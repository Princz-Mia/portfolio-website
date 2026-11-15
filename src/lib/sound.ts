/**
 * Small synthesised sound effects for the drawings, built with the Web Audio
 * API so no recordings are shipped. Every function here is meant to be called
 * from a click, tap or key press: one AudioContext is created lazily on first
 * use and shared, and every function quietly does nothing where audio is not
 * available. Volumes stay modest (no gain above 0.35).
 */

type AudioContextConstructor = new () => AudioContext;

let shared: AudioContext | null = null;
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
const impulses = new WeakMap<BaseAudioContext, AudioBuffer>();

function audioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * The shared AudioContext, created on first use. Returns null where the Web
 * Audio API is missing or the browser refuses to create a context.
 */
export function getAudioContext(): AudioContext | null {
  if (shared && shared.state !== "closed") {
    if (shared.state === "suspended") void shared.resume().catch(() => undefined);
    return shared;
  }
  const Ctor = audioContextConstructor();
  if (!Ctor) return null;
  try {
    shared = new Ctor();
  } catch {
    shared = null;
    return null;
  }
  if (shared.state === "suspended") void shared.resume().catch(() => undefined);
  return shared;
}

/** Closes the shared context and forgets any sound in progress. */
export function closeAudio() {
  const ctx = shared;
  shared = null;
  purr = null;
  hornBusyUntil = 0;
  if (ctx && ctx.state !== "closed") void ctx.close().catch(() => undefined);
}

/** Two seconds of white noise, made once per context and looped by sources. */
function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    const length = Math.floor(ctx.sampleRate * 2);
    buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/**
 * A stereo impulse response for a short, dark hall: decaying noise whose high
 * end dies away faster than its body. Made once per context.
 */
function hallImpulse(ctx: BaseAudioContext): AudioBuffer {
  let buffer = impulses.get(ctx);
  if (!buffer) {
    const seconds = 2.2;
    const length = Math.floor(ctx.sampleRate * seconds);
    buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let previous = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        // One-pole smoothing that grows with time darkens the tail.
        const smooth = 0.2 + 0.7 * t;
        previous = previous * smooth + (Math.random() * 2 - 1) * (1 - smooth);
        data[i] = previous * Math.pow(1 - t, 3);
      }
    }
    impulses.set(ctx, buffer);
  }
  return buffer;
}

/** Disconnects nodes once a sound has finished, ignoring nodes already gone. */
function disconnectAll(nodes: AudioNode[]) {
  for (const node of nodes) {
    try {
      node.disconnect();
    } catch {
      // Already disconnected.
    }
  }
}

/* ---------- purr ---------- */

type Purr = { envelope: GainNode; sources: AudioScheduledSourceNode[] };
let purr: Purr | null = null;

/**
 * A soft cat purr: low-passed noise pulsed at about 26 times a second, with a
 * faint body tone under it, fading in and out over `seconds`. A new purr fades
 * out the one before it instead of stacking. Returns whether it played.
 */
export function playPurr(seconds = 1.5): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const now = ctx.currentTime;
  if (purr) {
    const previous = purr;
    try {
      previous.envelope.gain.cancelScheduledValues(now);
      previous.envelope.gain.setTargetAtTime(0, now, 0.04);
      for (const source of previous.sources) source.stop(now + 0.2);
    } catch {
      // The previous purr had already ended.
    }
    purr = null;
  }

  const start = now + 0.01;
  const end = start + seconds;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 170;
  lowpass.Q.value = 0.8;

  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.value = 52;
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.35;

  // Amplitude modulation: the gain swings between about 0.05 and 0.95.
  const pulse = ctx.createGain();
  pulse.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(25, start);
  lfo.frequency.linearRampToValueAtTime(28, start + seconds * 0.5);
  lfo.frequency.linearRampToValueAtTime(26, end);
  const depth = ctx.createGain();
  depth.gain.value = 0.45;

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(0.28, start + 0.18);
  envelope.gain.setValueAtTime(0.28, Math.max(start + 0.2, end - 0.45));
  envelope.gain.linearRampToValueAtTime(0, end);

  noise.connect(lowpass);
  lowpass.connect(pulse);
  body.connect(bodyGain);
  bodyGain.connect(pulse);
  lfo.connect(depth);
  depth.connect(pulse.gain);
  pulse.connect(envelope);
  envelope.connect(ctx.destination);

  const sources = [noise, body, lfo];
  for (const source of sources) {
    source.start(start);
    source.stop(end + 0.05);
  }

  const current: Purr = { envelope, sources };
  purr = current;
  noise.onended = () => {
    disconnectAll([noise, lowpass, body, bodyGain, lfo, depth, pulse, envelope]);
    if (purr === current) purr = null;
  };
  return true;
}

/* ---------- war horn ---------- */

/** How long the synthesised horn lasts, in seconds. */
export const HORN_SECONDS = 2.6;
let hornBusyUntil = 0;

const nowMs = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/** Whether a horn started by `playHordeHorn` is still sounding. */
export function isHornSounding(): boolean {
  return nowMs() < hornBusyUntil;
}

/**
 * An orcish war horn: three detuned sawtooth voices around 98 Hz that slide up
 * into pitch, a low-pass filter that opens with the blast and closes as it
 * fades, a slow vibrato, a breathy noise layer and a dark hall reverb.
 */
function synthHorn(ctx: AudioContext): boolean {
  const t0 = ctx.currentTime + 0.02;
  const total = HORN_SECONDS;
  const end = t0 + total;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 2.2;
  filter.frequency.setValueAtTime(220, t0);
  filter.frequency.exponentialRampToValueAtTime(1500, t0 + 0.38);
  filter.frequency.exponentialRampToValueAtTime(950, t0 + 1.5);
  filter.frequency.exponentialRampToValueAtTime(180, end);

  // A gentle bump in the low mids makes the saws sound more like brass.
  const body = ctx.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 520;
  body.Q.value = 1.1;
  body.gain.value = 5;

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, t0);
  envelope.gain.exponentialRampToValueAtTime(0.3, t0 + 0.28);
  envelope.gain.linearRampToValueAtTime(0.26, t0 + 1.7);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  const vibrato = ctx.createOscillator();
  vibrato.type = "sine";
  vibrato.frequency.value = 5.2;
  const vibratoDepth = ctx.createGain();
  vibratoDepth.gain.setValueAtTime(0, t0);
  vibratoDepth.gain.linearRampToValueAtTime(0, t0 + 0.45);
  vibratoDepth.gain.linearRampToValueAtTime(1.6, t0 + 1.2);
  vibrato.connect(vibratoDepth);

  const voices = [97, 98.6, 49.4].map((pitch) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(pitch * 0.8, t0);
    osc.frequency.exponentialRampToValueAtTime(pitch, t0 + 0.36);
    osc.frequency.linearRampToValueAtTime(pitch * 1.025, t0 + 1.8);
    osc.frequency.linearRampToValueAtTime(pitch * 0.97, end);
    vibratoDepth.connect(osc.frequency);
    const level = ctx.createGain();
    level.gain.value = pitch < 60 ? 0.22 : 0.3;
    osc.connect(level);
    level.connect(filter);
    return { osc, level };
  });

  // Breath through the mouthpiece: band-passed noise, strongest at the attack.
  const breath = ctx.createBufferSource();
  breath.buffer = noiseBuffer(ctx);
  breath.loop = true;
  const breathFilter = ctx.createBiquadFilter();
  breathFilter.type = "bandpass";
  breathFilter.frequency.value = 1300;
  breathFilter.Q.value = 0.8;
  const breathGain = ctx.createGain();
  breathGain.gain.setValueAtTime(0, t0);
  breathGain.gain.linearRampToValueAtTime(0.06, t0 + 0.08);
  breathGain.gain.linearRampToValueAtTime(0.02, t0 + 0.6);
  breathGain.gain.linearRampToValueAtTime(0, end - 0.1);
  breath.connect(breathFilter);
  breathFilter.connect(breathGain);

  const reverb = ctx.createConvolver();
  reverb.buffer = hallImpulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;

  filter.connect(body);
  body.connect(envelope);
  breathGain.connect(envelope);
  envelope.connect(ctx.destination);
  envelope.connect(reverb);
  reverb.connect(wet);
  wet.connect(ctx.destination);

  const sources: AudioScheduledSourceNode[] = [
    vibrato,
    breath,
    ...voices.map((voice) => voice.osc),
  ];
  for (const source of sources) {
    source.start(t0);
    source.stop(end + 0.05);
  }

  const nodes: AudioNode[] = [
    filter,
    body,
    envelope,
    vibrato,
    vibratoDepth,
    breath,
    breathFilter,
    breathGain,
    reverb,
    wet,
    ...voices.flatMap(({ osc, level }) => [osc, level]),
  ];
  // Let the reverb tail ring out before tearing the graph down.
  window.setTimeout(() => disconnectAll(nodes), (total + 2.4) * 1000);
  return true;
}

/** Plays a recording at a modest volume. Returns whether playback started. */
export function playFile(src: string, volume = 0.35): boolean {
  if (typeof Audio === "undefined") return false;
  try {
    const audio = new Audio(src);
    audio.volume = Math.min(volume, 1);
    void audio.play()?.catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sounds the Horde war horn: the recording at `file` when one is given,
 * otherwise the synthesised horn. While a horn is still sounding, further
 * calls do nothing and return false, so repeated clicks never stack.
 */
export function playHordeHorn(file?: string | null): boolean {
  if (isHornSounding()) return false;
  let played = false;
  if (file) {
    played = playFile(file);
  } else {
    const ctx = getAudioContext();
    played = ctx ? synthHorn(ctx) : false;
  }
  if (played) hornBusyUntil = nowMs() + HORN_SECONDS * 1000;
  return played;
}

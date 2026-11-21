/**
 * Sound for the drawings, built on one shared Web Audio context: small
 * synthesised effects (a purr, a war horn) and recordings, which are fetched
 * once, decoded into memory and played from there, so playback never depends
 * on a file still streaming in or on a media element's lifecycle.
 *
 * Every function that starts a sound is meant to be called from a click, tap
 * or key press, which is also where the context is created or resumed. Every
 * function quietly does nothing where audio is not available. Synthesised
 * effects stay at or below a gain of 0.35, recordings at or below 0.6, and
 * all of them reach the speakers through one bus with a soft limiter.
 */

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

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
    // Suspended, or interrupted (as iOS does during a call): ask it to run.
    if (shared.state !== "running") void shared.resume().catch(() => undefined);
    return shared;
  }
  const Ctor = audioContextConstructor();
  if (!Ctor) return null;
  // The context runs at the device's own rate (decoded recordings are
  // resampled to it), with a slightly larger buffer than the lowest-latency
  // default so a busy page does not make it run dry and crackle.
  try {
    shared = new Ctor({ latencyHint: "balanced" });
  } catch {
    try {
      shared = new Ctor();
    } catch {
      shared = null;
      return null;
    }
  }
  if (shared.state !== "running") void shared.resume().catch(() => undefined);
  return shared;
}

/** Level of the shared bus every sound passes through before the limiter. */
export const MASTER_GAIN = 0.8;
const outputs = new WeakMap<BaseAudioContext, AudioNode>();

/**
 * Where every sound connects instead of the speakers: one shared gain with
 * some headroom, then a compressor set as a soft limiter, then the speakers.
 * Sounds may overlap (the horn, the Lich King's line and a purr can all play
 * at once), and their sum would otherwise go over full scale and clip, which
 * is heard as crackle. Made once per context.
 */
export function audioOutput(ctx: BaseAudioContext): AudioNode {
  const existing = outputs.get(ctx);
  if (existing) return existing;
  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  let limiter: DynamicsCompressorNode | null = null;
  try {
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 2;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
  } catch {
    limiter = null;
  }
  if (limiter) {
    master.connect(limiter);
    limiter.connect(ctx.destination);
  } else {
    master.connect(ctx.destination);
  }
  outputs.set(ctx, master);
  return master;
}

/**
 * Closes the shared context and forgets every sound in progress and every
 * loaded recording. Nothing on the page calls it while sound may be playing;
 * it exists so a fresh start is possible (and for tests).
 */
export function closeAudio() {
  const ctx = shared;
  shared = null;
  purr = null;
  hornToken += 1;
  hornBusy = false;
  for (const playback of [...playing.values()]) playback.stop();
  playing.clear();
  buffers.clear();
  bytes.clear();
  loads.clear();
  unplayable.clear();
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
  envelope.connect(audioOutput(ctx));

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
/** The level the horn recording plays at. */
export const HORN_GAIN = 0.45;
let hornBusy = false;
let hornToken = 0;

/** Whether a horn started by `playHordeHorn` is still sounding (or about to). */
export function isHornSounding(): boolean {
  return hornBusy;
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
  envelope.connect(audioOutput(ctx));
  envelope.connect(reverb);
  reverb.connect(wet);
  wet.connect(audioOutput(ctx));

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


/* ---------- recordings ---------- */

/** The highest gain a recording plays at; the files are mastered near full scale. */
export const MAX_RECORDING_GAIN = 0.6;
/**
 * How long a play waits for its recording to finish loading before it gives
 * up (and the caller falls back to a synthesised sound).
 */
export const RECORDING_WAIT_MS = 4000;
/** The fade applied when a playing recording is stopped early, in seconds. */
const STOP_FADE = 0.03;

/** Decoded recordings by URL. */
const buffers = new Map<string, AudioBuffer>();
/** Fetches in flight, or done but not yet decoded, by URL. */
const bytes = new Map<string, Promise<ArrayBuffer | null>>();
/** Loads (fetch and decode) in flight, by URL, so concurrent calls share one. */
const loads = new Map<string, Promise<AudioBuffer | null>>();
/** Recordings this browser could not decode; they are not fetched again. */
const unplayable = new Set<string>();
/** The playback of each recording that is playing or about to, by URL. */
const playing = new Map<string, Playback>();

/**
 * Fetches a recording's bytes without decoding them, once per URL. Needs no
 * audio context, so it can run on hover or focus, before any user gesture.
 */
export function prefetchRecording(url: string): Promise<ArrayBuffer | null> {
  const pending = bytes.get(url);
  if (pending) return pending;
  if (buffers.has(url) || unplayable.has(url) || typeof fetch !== "function") {
    return Promise.resolve(null);
  }
  const fetching = fetch(url)
    .then((response) => (response.ok ? response.arrayBuffer() : null))
    .catch(() => null)
    .then((data) => {
      // A failed fetch may succeed later, so it is not remembered.
      if (!data && bytes.get(url) === fetching) bytes.delete(url);
      return data;
    });
  bytes.set(url, fetching);
  return fetching;
}

/** decodeAudioData as a promise, also for browsers that only offer the callbacks. */
function decode(ctx: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise<AudioBuffer>((resolve, reject) => {
    try {
      const result = ctx.decodeAudioData(data, resolve, reject);
      if (result && typeof result.then === "function") result.then(resolve, reject);
    } catch (error) {
      reject(error);
    }
  });
}

/** The decoded recording at `url`, or null while it is not loaded. */
export function loadedRecording(url: string): AudioBuffer | null {
  return buffers.get(url) ?? null;
}

/**
 * Fetches the recording at `url` once and decodes it on the shared context,
 * keeping the decoded audio for every later play. Concurrent calls share one
 * load. Resolves to null where there is no audio, the file cannot be fetched,
 * or the browser cannot decode its format (which is then not tried again).
 */
export function loadRecording(url: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(url);
  if (cached) return Promise.resolve(cached);
  if (unplayable.has(url)) return Promise.resolve(null);
  const pending = loads.get(url);
  if (pending) return pending;
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(null);

  const load: Promise<AudioBuffer | null> = prefetchRecording(url)
    .then(async (data) => {
      // The decoder takes the bytes over, so they cannot be decoded twice.
      if (bytes.get(url)) bytes.delete(url);
      if (!data) return null;
      try {
        const buffer = await decode(ctx, data);
        buffers.set(url, buffer);
        return buffer;
      } catch {
        unplayable.add(url);
        return null;
      }
    })
    .finally(() => {
      if (loads.get(url) === load) loads.delete(url);
    });
  loads.set(url, load);
  return load;
}

/** What a recording does while it plays. */
export type RecordingOptions = {
  /** Its level, capped at MAX_RECORDING_GAIN. */
  gain?: number;
  /** Called once when it starts playing, with its length in seconds. */
  onStart?: (seconds: number) => void;
  /** Called once when it has played to the end; not after `stop`. */
  onEnd?: () => void;
  /**
   * Called once when it cannot play: no audio, the file could not be
   * fetched or decoded, or loading took longer than RECORDING_WAIT_MS.
   */
  onFail?: () => void;
};

/** A recording that is playing, or about to once it has loaded. */
export type Playback = {
  readonly url: string;
  /** Resolves once it is over: played to the end, stopped, or failed. */
  readonly ended: Promise<void>;
  /** Stops it (with a very short fade, so it does not click). */
  stop: () => void;
};

/**
 * Plays a recording from its decoded audio: one AudioBufferSourceNode into a
 * GainNode into the speakers. When it is already decoded it starts at once;
 * otherwise it starts as soon as the load finishes. While a recording is
 * playing (or waiting to), playing it again does nothing and returns null, so
 * the same recording never stacks.
 */
export function playRecording(url: string, options: RecordingOptions = {}): Playback | null {
  if (playing.has(url)) return null;
  const ctx = getAudioContext();
  const gain = Math.min(Math.max(options.gain ?? 0.5, 0), MAX_RECORDING_GAIN);

  let phase: "waiting" | "playing" | "done" = "waiting";
  let nodes: { source: AudioBufferSourceNode; level: GainNode } | null = null;
  let waitTimer: number | undefined;
  let resolveEnded: () => void = () => {};
  const ended = new Promise<void>((resolve) => {
    resolveEnded = resolve;
  });

  /** Marks the playback over; returns false when it already was. */
  const finish = () => {
    if (phase === "done") return false;
    phase = "done";
    window.clearTimeout(waitTimer);
    if (playing.get(url) === playback) playing.delete(url);
    resolveEnded();
    return true;
  };

  const fail = () => {
    if (finish()) options.onFail?.();
  };

  const start = (buffer: AudioBuffer) => {
    if (phase !== "waiting") return;
    if (!ctx || ctx.state === "closed") return fail();
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const level = ctx.createGain();
      level.gain.value = gain;
      source.connect(level);
      level.connect(audioOutput(ctx));
      source.onended = () => {
        disconnectAll([source, level]);
        if (finish()) options.onEnd?.();
      };
      nodes = { source, level };
      source.start();
      phase = "playing";
    } catch {
      return fail();
    }
    options.onStart?.(buffer.duration);
  };

  const playback: Playback = {
    url,
    ended,
    stop() {
      const current = nodes;
      const wasPlaying = phase === "playing";
      if (!finish() || !wasPlaying || !current || !ctx) return;
      const { source, level } = current;
      source.onended = () => disconnectAll([source, level]);
      try {
        const now = ctx.currentTime;
        level.gain.cancelScheduledValues(now);
        level.gain.setValueAtTime(gain, now);
        level.gain.linearRampToValueAtTime(0, now + STOP_FADE);
        source.stop(now + STOP_FADE + 0.01);
      } catch {
        disconnectAll([source, level]);
      }
    },
  };

  playing.set(url, playback);
  // Without audio, or known not to decode here: the caller falls back at once.
  if (!ctx || unplayable.has(url)) {
    fail();
    return playback;
  }
  const cached = buffers.get(url);
  if (cached) {
    start(cached);
  } else {
    waitTimer = window.setTimeout(fail, RECORDING_WAIT_MS);
    void loadRecording(url).then((buffer) => (buffer ? start(buffer) : fail()));
  }
  return playback;
}

/** Whether a recording is playing, or waiting to start. */
export function isRecordingPlaying(url: string): boolean {
  return playing.has(url);
}

/* ---------- the horn, recorded or synthesised ---------- */

/**
 * Sounds the Horde war horn: the recording at `file` when one is given and
 * this browser can decode it, otherwise the synthesised horn. The horn is
 * busy for exactly as long as it sounds (the recording's length, or
 * HORN_SECONDS), then `onDone` is called once. While it is busy further calls
 * do nothing and return false, so repeated clicks never stack.
 */
export function playHordeHorn(file?: string | null, onDone?: () => void): boolean {
  if (hornBusy) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;

  hornBusy = true;
  const token = ++hornToken;
  let backstop: number | undefined;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    window.clearTimeout(backstop);
    if (token === hornToken) hornBusy = false;
    onDone?.();
  };
  /** Releases the horn after `seconds`, should its end never be heard. */
  const releaseAfter = (seconds: number) => {
    window.clearTimeout(backstop);
    backstop = window.setTimeout(release, seconds * 1000);
  };
  const synthesise = () => {
    if (token === hornToken && synthHorn(ctx)) releaseAfter(HORN_SECONDS);
    else release();
  };

  if (!file) {
    synthesise();
    return true;
  }
  const playback = playRecording(file, {
    gain: HORN_GAIN,
    // The end of the recording releases the horn; the backstop only matters
    // should the context be suspended mid-blast, so its end never comes.
    onStart: (seconds) => releaseAfter(seconds + 0.5),
    onEnd: release,
    onFail: synthesise,
  });
  if (!playback) release();
  return true;
}

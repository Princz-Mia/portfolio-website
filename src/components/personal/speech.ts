/**
 * Sound for the Lich King figure: a recording when one is configured, otherwise
 * the line spoken by the browser's speech synthesiser over a short icy drone
 * made with the Web Audio API. Every helper does nothing where its API is
 * missing, and each returns a function that stops what it started.
 *
 * The recording is loaded before it is needed (when the figure is hovered,
 * focused or first poked) into one audio element that every play reuses.
 * Starting a freshly created element straight away makes the browser begin
 * playback while the file is still arriving, which can stall and stutter at
 * the start.
 */

type Stop = () => void;

const noop: Stop = () => {};

let context: AudioContext | null = null;

/** The page's single AudioContext, created on first use; null where unsupported. */
function audioContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (typeof Ctor !== "function") return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/**
 * An English voice, preferring a deep-sounding British or American one and
 * never choosing a voice named as female while another is available.
 */
export function pickVoice<V extends { lang: string; name: string }>(
  voices: readonly V[],
): V | undefined {
  const english = voices.filter((voice) => /^en(-|_|$)/i.test(voice.lang));
  const notFemale = english.filter((voice) => !/female/i.test(voice.name));
  const deep = /(daniel|george|arthur|david|guy|ryan|fred|alex|male)/i;
  return (
    notFemale.find(
      (voice) => /^en-GB/i.test(voice.lang) && deep.test(voice.name),
    ) ??
    notFemale.find((voice) => deep.test(voice.name)) ??
    notFemale.find((voice) => /^en-GB/i.test(voice.lang)) ??
    notFemale[0] ??
    english[0]
  );
}

/**
 * Speaks a line slowly in a very low voice. Returns false when the browser
 * cannot speak.
 */
export function speak(text: string): boolean {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    typeof window.SpeechSynthesisUtterance !== "function"
  ) {
    return false;
  }
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    const voice = pickVoice(synth.getVoices?.() ?? []);
    if (voice) utterance.voice = voice;
    utterance.pitch = 0.2;
    utterance.rate = 0.8;
    utterance.volume = 0.9;
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/** Stops any line the speech synthesiser is saying. */
export function hush(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // Nothing to stop.
  }
}

/**
 * A four-second frosty drone: low detuned tones swelling through an opening
 * filter, with a few high glassy pings on top.
 */
export function frostDrone(seconds = 4): Stop {
  const ctx = audioContext();
  if (!ctx) return noop;
  try {
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

    const now = ctx.currentTime;
    const end = now + seconds;
    const nodes: AudioNode[] = [];
    const sources: OscillatorNode[] = [];

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.8);
    master.gain.setValueAtTime(0.16, end - 1.4);
    master.gain.exponentialRampToValueAtTime(0.0001, end);
    master.connect(ctx.destination);
    nodes.push(master);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 1.6);
    filter.frequency.exponentialRampToValueAtTime(500, end);
    filter.connect(master);
    nodes.push(filter);

    const drone: [number, OscillatorType, number][] = [
      [55, "sawtooth", 0.3],
      [82.4, "triangle", 0.35],
      [110.6, "sawtooth", 0.2],
    ];
    for (const [frequency, type, level] of drone) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      osc.detune.setValueAtTime(frequency > 100 ? 7 : -5, now);
      const gain = ctx.createGain();
      gain.gain.value = level;
      osc.connect(gain);
      gain.connect(filter);
      nodes.push(osc, gain);
      sources.push(osc);
    }

    const pings = [1760, 2637, 2349, 3136, 2093];
    pings.forEach((frequency, i) => {
      const at = now + 0.3 + i * 0.55;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, at);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.05, at + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      nodes.push(osc, gain);
      sources.push(osc);
    });

    for (const osc of sources) {
      osc.start(now);
      osc.stop(end + 0.05);
    }

    let done = false;
    const release = () => {
      if (done) return;
      done = true;
      for (const node of nodes) {
        try {
          node.disconnect();
        } catch {
          // Already disconnected.
        }
      }
    };
    sources[0].onended = release;

    return () => {
      if (done) return;
      for (const osc of sources) {
        try {
          osc.stop();
        } catch {
          // Already stopped.
        }
      }
      release();
    };
  } catch {
    return noop;
  }
}

/**
 * A recording loaded ahead of time, so that it plays from a full buffer
 * instead of starting while its first bytes are still arriving.
 */
export type Recording = {
  /** The file it plays. */
  readonly src: string;
  /**
   * Plays the recording once from the start at a modest volume. `onEnd` is
   * called once, when it finishes or cannot be played, and never after the
   * returned stop function has been called. While a play is still running a
   * second call does not restart it; it returns a function that does nothing.
   */
  play: (onEnd?: () => void) => Stop;
  /** Stops it and lets the browser drop the loaded audio. */
  dispose: () => void;
};

/**
 * Starts loading the audio file at `src` into one audio element that later
 * plays reuse. Returns null where the browser has no audio element.
 */
export function loadRecording(src: string): Recording | null {
  if (typeof window === "undefined" || typeof window.Audio !== "function") return null;
  let audio: HTMLAudioElement;
  try {
    audio = new window.Audio(src);
    audio.preload = "auto";
    audio.volume = 0.6;
    audio.load();
  } catch {
    return null;
  }

  /** Detaches the listeners of the play that is running, if any. */
  let detach: (() => void) | null = null;

  const halt = () => {
    detach?.();
    detach = null;
    try {
      audio.pause();
    } catch {
      // Nothing to pause.
    }
  };

  return {
    src,
    play(onEnd) {
      if (detach) return noop;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        detach?.();
        detach = null;
        onEnd?.();
      };
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", finish);
      detach = () => {
        audio.removeEventListener("ended", finish);
        audio.removeEventListener("error", finish);
      };
      try {
        if (audio.currentTime > 0) audio.currentTime = 0;
        const playing = audio.play();
        if (playing && typeof playing.catch === "function") playing.catch(finish);
      } catch {
        finish();
      }
      return () => {
        if (done) return;
        done = true;
        halt();
        try {
          audio.currentTime = 0;
        } catch {
          // Not seekable yet; the next play starts from the beginning anyway.
        }
      };
    },
    dispose() {
      halt();
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {
        // Already released.
      }
    },
  };
}

/**
 * Says the Lich King's line: the loaded recording when there is one,
 * otherwise the speech synthesiser with a frosty drone underneath. `onEnd` is
 * called when the recording finishes or fails; the spoken fallback calls it
 * straight away. Call it only from a click, tap or key press.
 */
export function sayLichKingLine(
  text: string,
  recording: Recording | null,
  onEnd?: () => void,
): Stop {
  if (recording) return recording.play(onEnd);
  const spoke = speak(text);
  const stopDrone = frostDrone();
  onEnd?.();
  return () => {
    stopDrone();
    if (spoke) hush();
  };
}

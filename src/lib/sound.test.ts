import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HORN_SECONDS,
  MASTER_GAIN,
  MAX_RECORDING_GAIN,
  RECORDING_WAIT_MS,
  audioOutput,
  closeAudio,
  getAudioContext,
  isHornSounding,
  isRecordingPlaying,
  loadRecording,
  loadedRecording,
  playHordeHorn,
  playPurr,
  playRecording,
  prefetchRecording,
} from "./sound";

type Created = { kind: string; node: Record<string, unknown> };
type FakeBuffer = { duration: number; url: string };

const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
  cancelScheduledValues: vi.fn(),
});

/** How the fake decoder treats the next files: decode them, or refuse. */
const decoder = { fail: false, duration: 2.25 };
/** Every AudioContext constructed, with the options it was given. */
const contexts: { options: unknown }[] = [];

/** A stand-in AudioContext that records every node it creates. */
function installFakeAudio() {
  const created: Created[] = [];
  const node = (kind: string, extra: Record<string, unknown> = {}) => {
    const value = { connect: vi.fn(), disconnect: vi.fn(), ...extra };
    created.push({ kind, node: value });
    return value;
  };
  const source = (kind: string, extra: Record<string, unknown> = {}) =>
    node(kind, { start: vi.fn(), stop: vi.fn(), onended: null, ...extra });

  class FakeAudioContext {
    state = "running";
    currentTime = 0;
    sampleRate = 8000;
    destination = { kind: "destination" };
    resume = vi.fn(() => Promise.resolve());
    close = vi.fn(() => {
      this.state = "closed";
      return Promise.resolve();
    });
    decodeAudioData = vi.fn((data: ArrayBuffer & { url?: string }) =>
      decoder.fail
        ? Promise.reject(new DOMException("Unable to decode audio data", "EncodingError"))
        : Promise.resolve({ duration: decoder.duration, url: data.url ?? "" } as FakeBuffer),
    );
    constructor(options?: unknown) {
      contexts.push({ options });
    }
    createBuffer(channels: number, length: number) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { getChannelData: (channel: number) => data[channel] };
    }
    createGain() {
      return node("gain", { gain: param() });
    }
    createBiquadFilter() {
      return node("filter", { type: "", frequency: param(), Q: param(), gain: param() });
    }
    createOscillator() {
      return source("oscillator", { type: "", frequency: param() });
    }
    createBufferSource() {
      return source("buffer", { buffer: null, loop: false });
    }
    createConvolver() {
      return node("convolver", { buffer: null });
    }
    createDynamicsCompressor() {
      return node("compressor", {
        threshold: param(),
        knee: param(),
        ratio: param(),
        attack: param(),
        release: param(),
      });
    }
  }

  vi.stubGlobal("AudioContext", FakeAudioContext);
  return created;
}

/** A stand-in fetch that serves any URL as a few bytes tagged with the URL. */
function installFakeFetch() {
  const fetch = vi.fn(async (url: string) => ({
    ok: true,
    arrayBuffer: async () => Object.assign(new ArrayBuffer(8), { url }),
  }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** Lets pending promises (fetch, decode) settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Buffer sources that play a recording (looping noise sources are synthesis). */
const recordingSources = (created: Created[]) =>
  created.filter((entry) => entry.kind === "buffer" && !entry.node.loop);

const ctxOf = () => getAudioContext() as unknown as {
  destination: unknown;
  decodeAudioData: ReturnType<typeof vi.fn>;
};

/** The shared bus sounds connect to on their way to the speakers. */
const busOf = () => audioOutput(getAudioContext() as AudioContext);

beforeEach(() => {
  decoder.fail = false;
  decoder.duration = 2.25;
  contexts.length = 0;
});

afterEach(() => {
  closeAudio();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("sound effects without the Web Audio API", () => {
  it("do nothing and report that nothing played", async () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(getAudioContext()).toBeNull();
    expect(playPurr()).toBe(false);
    expect(playHordeHorn()).toBe(false);
    expect(isHornSounding()).toBe(false);
    expect(await loadRecording("/audio/line.wav")).toBeNull();

    const onFail = vi.fn();
    playRecording("/audio/line.wav", { onFail });
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(isRecordingPlaying("/audio/line.wav")).toBe(false);
  });
});

describe("sound effects with the Web Audio API", () => {
  it("create one shared context lazily, at the device's own sample rate", () => {
    installFakeAudio();
    const first = getAudioContext();
    expect(first).not.toBeNull();
    expect(getAudioContext()).toBe(first);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].options ?? {}).not.toHaveProperty("sampleRate");
  });

  it("build a purr from filtered noise pulsed by a slow oscillator", () => {
    const created = installFakeAudio();
    expect(playPurr(1.5)).toBe(true);
    const kinds = created.map((entry) => entry.kind);
    expect(kinds).toContain("buffer");
    expect(kinds).toContain("filter");
    expect(kinds.filter((kind) => kind === "oscillator").length).toBeGreaterThanOrEqual(2);
    const sources = created.filter((entry) => "start" in entry.node);
    for (const { node } of sources) expect(node.start).toHaveBeenCalled();
  });

  it("keep the level sent to the speakers at or below 0.35", () => {
    const created = installFakeAudio();
    playPurr();
    playHordeHorn();
    const bus = busOf();
    const outputs = created.filter(
      ({ kind, node }) =>
        kind === "gain" &&
        (node.connect as ReturnType<typeof vi.fn>).mock.calls.some(
          ([target]) => target === bus,
        ),
    );
    expect(outputs.length).toBeGreaterThanOrEqual(2);
    for (const { node } of outputs) {
      const gain = node.gain as ReturnType<typeof param>;
      expect(gain.value).toBeLessThanOrEqual(0.35);
      for (const call of [
        ...gain.setValueAtTime.mock.calls,
        ...gain.linearRampToValueAtTime.mock.calls,
        ...gain.exponentialRampToValueAtTime.mock.calls,
      ]) {
        expect(call[0]).toBeLessThanOrEqual(0.35);
      }
    }
  });

  it("sound the synthesised horn with detuned sawtooth voices and a reverb, without stacking", () => {
    vi.useFakeTimers();
    const created = installFakeAudio();
    const onDone = vi.fn();
    expect(playHordeHorn(null, onDone)).toBe(true);
    const saws = created.filter(
      (entry) => entry.kind === "oscillator" && entry.node.type === "sawtooth",
    );
    expect(saws.length).toBeGreaterThanOrEqual(2);
    expect(created.some((entry) => entry.kind === "convolver")).toBe(true);

    const count = created.length;
    expect(playHordeHorn()).toBe(false);
    expect(created.length).toBe(count);
    expect(isHornSounding()).toBe(true);

    vi.advanceTimersByTime(HORN_SECONDS * 1000 - 1);
    expect(isHornSounding()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isHornSounding()).toBe(false);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe("recordings", () => {
  it("are fetched and decoded once, then served from memory", async () => {
    installFakeAudio();
    const fetch = installFakeFetch();

    const buffer = await loadRecording("/audio/horn.ogg");
    expect(buffer).toMatchObject({ url: "/audio/horn.ogg" });
    expect(loadedRecording("/audio/horn.ogg")).toBe(buffer);

    expect(await loadRecording("/audio/horn.ogg")).toBe(buffer);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(ctxOf().decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("share one load between calls made while it is in flight", async () => {
    installFakeAudio();
    const fetch = installFakeFetch();

    void prefetchRecording("/audio/line.wav");
    const first = loadRecording("/audio/line.wav");
    const second = loadRecording("/audio/line.wav");
    expect(second).toBe(first);
    const [a, b] = await Promise.all([first, second]);

    expect(a).toBe(b);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(ctxOf().decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("can fetch their bytes before any audio context exists", async () => {
    const fetch = installFakeFetch();
    vi.stubGlobal("AudioContext", undefined);
    await prefetchRecording("/audio/line.wav");
    await prefetchRecording("/audio/line.wav");
    expect(fetch).toHaveBeenCalledTimes(1);

    installFakeAudio();
    expect(await loadRecording("/audio/line.wav")).not.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("play from memory through one source and a gain node no louder than 0.6", async () => {
    const created = installFakeAudio();
    installFakeFetch();
    await loadRecording("/audio/line.wav");

    const onStart = vi.fn();
    const onEnd = vi.fn();
    const playback = playRecording("/audio/line.wav", { gain: 0.9, onStart, onEnd });
    expect(playback).not.toBeNull();

    // It starts at once, from the decoded buffer.
    const sources = recordingSources(created);
    expect(sources).toHaveLength(1);
    const [{ node: source }] = sources;
    expect(source.start).toHaveBeenCalledTimes(1);
    expect(source.buffer).toBe(loadedRecording("/audio/line.wav"));
    expect(onStart).toHaveBeenCalledWith(2.25);

    const level = created.find(
      ({ kind, node }) =>
        kind === "gain" &&
        (node.connect as ReturnType<typeof vi.fn>).mock.calls.some(
          ([target]) => target === busOf(),
        ),
    )?.node;
    expect(source.connect).toHaveBeenCalledWith(level);
    expect((level?.gain as ReturnType<typeof param>).value).toBe(MAX_RECORDING_GAIN);
    expect(MAX_RECORDING_GAIN).toBeLessThanOrEqual(0.6);

    // Nothing stops it early; it ends when the source does.
    expect(source.stop).not.toHaveBeenCalled();
    expect(isRecordingPlaying("/audio/line.wav")).toBe(true);
    (source.onended as () => void)();
    expect(onEnd).toHaveBeenCalledTimes(1);
    await expect(playback?.ended).resolves.toBeUndefined();
    expect(isRecordingPlaying("/audio/line.wav")).toBe(false);
  });

  it("never stack: playing the same recording again does nothing until it ends", async () => {
    const created = installFakeAudio();
    installFakeFetch();
    await loadRecording("/audio/line.wav");

    playRecording("/audio/line.wav");
    expect(playRecording("/audio/line.wav")).toBeNull();
    expect(playRecording("/audio/line.wav")).toBeNull();
    expect(recordingSources(created)).toHaveLength(1);

    (recordingSources(created)[0].node.onended as () => void)();
    expect(playRecording("/audio/line.wav")).not.toBeNull();
    expect(recordingSources(created)).toHaveLength(2);
  });

  it("wait for a load in flight, then start once", async () => {
    const created = installFakeAudio();
    const fetch = installFakeFetch();
    const onStart = vi.fn();

    playRecording("/audio/line.wav", { onStart });
    expect(recordingSources(created)).toHaveLength(0);
    expect(playRecording("/audio/line.wav")).toBeNull();

    await settle();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(recordingSources(created)).toHaveLength(1);
    expect(recordingSources(created)[0].node.start).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("report a format the browser cannot decode, and do not try it again", async () => {
    const created = installFakeAudio();
    const fetch = installFakeFetch();
    decoder.fail = true;

    const onFail = vi.fn();
    const onStart = vi.fn();
    const playback = playRecording("/audio/horn.ogg", { onFail, onStart });
    await settle();
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
    await expect(playback?.ended).resolves.toBeUndefined();
    expect(recordingSources(created)).toHaveLength(0);

    // Known to fail now: the next play fails at once, without fetching.
    const again = vi.fn();
    playRecording("/audio/horn.ogg", { onFail: again });
    expect(again).toHaveBeenCalledTimes(1);
    expect(await loadRecording("/audio/horn.ogg")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("give up when loading takes too long", async () => {
    vi.useFakeTimers();
    installFakeAudio();
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    const onFail = vi.fn();
    playRecording("/audio/line.wav", { onFail });
    await vi.advanceTimersByTimeAsync(RECORDING_WAIT_MS - 1);
    expect(onFail).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(isRecordingPlaying("/audio/line.wav")).toBe(false);
  });

  it("stop with a short fade, without reporting an end", async () => {
    const created = installFakeAudio();
    installFakeFetch();
    await loadRecording("/audio/line.wav");

    const onEnd = vi.fn();
    const playback = playRecording("/audio/line.wav", { onEnd });
    const [{ node: source }] = recordingSources(created);
    playback?.stop();

    expect(source.stop).toHaveBeenCalledTimes(1);
    const level = created.find(
      ({ kind, node }) => kind === "gain" && (source.connect as ReturnType<typeof vi.fn>).mock.calls.some(([t]) => t === node),
    )?.node;
    expect((level?.gain as ReturnType<typeof param>).linearRampToValueAtTime).toHaveBeenCalledWith(
      0,
      expect.any(Number),
    );
    await expect(playback?.ended).resolves.toBeUndefined();
    (source.onended as () => void)();
    expect(onEnd).not.toHaveBeenCalled();
    expect(isRecordingPlaying("/audio/line.wav")).toBe(false);
  });
});

describe("the horn recording", () => {
  it("plays instead of the synthesised horn, busy for exactly its length", async () => {
    vi.useFakeTimers();
    const created = installFakeAudio();
    installFakeFetch();
    await loadRecording("/audio/horn.ogg");

    const onDone = vi.fn();
    expect(playHordeHorn("/audio/horn.ogg", onDone)).toBe(true);
    expect(created.some((entry) => entry.kind === "oscillator")).toBe(false);
    const sources = recordingSources(created);
    expect(sources).toHaveLength(1);
    expect(sources[0].node.start).toHaveBeenCalledTimes(1);

    // Busy while it sounds: further clicks neither restart nor stack it.
    expect(playHordeHorn("/audio/horn.ogg")).toBe(false);
    expect(recordingSources(created)).toHaveLength(1);
    expect(isHornSounding()).toBe(true);

    // The source ends after the recording's 2.25 seconds.
    (sources[0].node.onended as () => void)();
    expect(isHornSounding()).toBe(false);
    expect(onDone).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("is released shortly after its length should its end never be heard", async () => {
    vi.useFakeTimers();
    installFakeAudio();
    installFakeFetch();
    await loadRecording("/audio/horn.ogg");

    const onDone = vi.fn();
    playHordeHorn("/audio/horn.ogg", onDone);
    vi.advanceTimersByTime(2250);
    expect(isHornSounding()).toBe(true);
    vi.advanceTimersByTime(500);
    expect(isHornSounding()).toBe(false);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("falls back to the synthesised horn when the recording cannot be decoded", async () => {
    const created = installFakeAudio();
    installFakeFetch();
    decoder.fail = true;

    expect(playHordeHorn("/audio/horn.ogg")).toBe(true);
    await settle();
    expect(recordingSources(created)).toHaveLength(0);
    expect(
      created.filter((entry) => entry.kind === "oscillator" && entry.node.type === "sawtooth")
        .length,
    ).toBeGreaterThanOrEqual(2);
    expect(isHornSounding()).toBe(true);
  });
});

describe("the shared output bus", () => {
  it("passes every sound through one gain and a soft limiter to the speakers", async () => {
    const created = installFakeAudio();
    installFakeFetch();
    playPurr();
    playHordeHorn();
    playRecording("/audio/line.wav", { gain: MAX_RECORDING_GAIN });
    await settle();

    const ctx = ctxOf();
    const bus = busOf();
    expect(busOf()).toBe(bus);
    const masters = created.filter(({ node }) => (node as unknown) === bus);
    expect(masters).toHaveLength(1);
    expect((bus as unknown as { gain: { value: number } }).gain.value).toBe(MASTER_GAIN);
    expect(MASTER_GAIN).toBeLessThanOrEqual(0.8);

    const limiters = created.filter(({ kind }) => kind === "compressor");
    expect(limiters).toHaveLength(1);
    const [{ node: limiter }] = limiters;
    expect(bus.connect).toHaveBeenCalledWith(limiter);
    expect((limiter.threshold as ReturnType<typeof param>).value).toBeLessThanOrEqual(-3);
    expect((limiter.ratio as ReturnType<typeof param>).value).toBeGreaterThanOrEqual(12);

    // Only the limiter reaches the speakers; every sound goes through the bus.
    const direct = created.filter(({ node }) =>
      (node.connect as ReturnType<typeof vi.fn>).mock.calls.some(
        ([target]) => target === ctx.destination,
      ),
    );
    expect(direct.map(({ node }) => node)).toEqual([limiter]);
    const intoBus = created.filter(({ node }) =>
      (node.connect as ReturnType<typeof vi.fn>).mock.calls.some(([target]) => target === bus),
    );
    // The purr's envelope, the horn's dry and wet paths and the recording's level.
    expect(intoBus.length).toBeGreaterThanOrEqual(3);
  });

  it("connects straight to the speakers where there is no compressor", () => {
    const created = installFakeAudio();
    const ctx = getAudioContext() as unknown as Record<string, unknown>;
    ctx.createDynamicsCompressor = () => {
      throw new Error("not supported");
    };
    const bus = busOf();
    expect(created.some(({ kind }) => kind === "compressor")).toBe(false);
    expect(bus.connect).toHaveBeenCalledWith(ctxOf().destination);
  });
});

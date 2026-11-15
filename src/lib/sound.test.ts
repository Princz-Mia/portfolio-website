import { afterEach, describe, expect, it, vi } from "vitest";
import {
  closeAudio,
  getAudioContext,
  isHornSounding,
  playHordeHorn,
  playPurr,
} from "./sound";

type Created = { kind: string; node: Record<string, unknown> };

const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
  cancelScheduledValues: vi.fn(),
});

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
  }

  vi.stubGlobal("AudioContext", FakeAudioContext);
  return created;
}

afterEach(() => {
  closeAudio();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("sound effects without the Web Audio API", () => {
  it("do nothing and report that nothing played", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(getAudioContext()).toBeNull();
    expect(playPurr()).toBe(false);
    expect(playHordeHorn()).toBe(false);
    expect(isHornSounding()).toBe(false);
  });
});

describe("sound effects with the Web Audio API", () => {
  it("create one shared context lazily", () => {
    installFakeAudio();
    const first = getAudioContext();
    expect(first).not.toBeNull();
    expect(getAudioContext()).toBe(first);
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
    const ctx = getAudioContext() as unknown as { destination: unknown };
    const outputs = created.filter(
      ({ kind, node }) =>
        kind === "gain" &&
        (node.connect as ReturnType<typeof vi.fn>).mock.calls.some(
          ([target]) => target === ctx.destination,
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

  it("sound the horn with detuned sawtooth voices and a reverb, without stacking", () => {
    vi.useFakeTimers();
    const created = installFakeAudio();
    expect(playHordeHorn()).toBe(true);
    const saws = created.filter(
      (entry) => entry.kind === "oscillator" && entry.node.type === "sawtooth",
    );
    expect(saws.length).toBeGreaterThanOrEqual(2);
    expect(created.some((entry) => entry.kind === "convolver")).toBe(true);

    const count = created.length;
    expect(playHordeHorn()).toBe(false);
    expect(created.length).toBe(count);
    expect(isHornSounding()).toBe(true);
  });

  it("play the recording instead when one is given", () => {
    const created = installFakeAudio();
    const play = vi.fn(() => Promise.resolve());
    const FakeAudio = vi.fn(function FakeAudio(this: Record<string, unknown>, src: string) {
      this.src = src;
      this.volume = 1;
      this.play = play;
    });
    vi.stubGlobal("Audio", FakeAudio);

    expect(playHordeHorn("/audio/horn.mp3")).toBe(true);
    expect(FakeAudio).toHaveBeenCalledWith("/audio/horn.mp3");
    expect(play).toHaveBeenCalled();
    expect(created).toHaveLength(0);
  });
});

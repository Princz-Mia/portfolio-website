import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeskScene } from "./DeskScene";
import { AWAKE_MS, LICH_QUOTE, MAX_AWAKE_MS } from "./LichKingEgg";
import { pickVoice, speak } from "./speech";
import { ART_SCREEN, ART_VIEWBOX, LICH_BOX } from "@/components/illustrations/WorkArt";

const RECORDING = "/audio/lich-king.wav";

// The scene reads the sounds at the moment of the poke, so a test can switch
// the recording off to reach the spoken fallback.
const content = vi.hoisted(() => ({
  sounds: { hordeHorn: null as string | null, lichKingQuote: "/audio/lich-king.wav" as string | null },
}));

vi.mock("@/content", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/content")>();
  return { ...actual, sounds: content.sounds };
});

class FakeAudio {
  static instances: FakeAudio[] = [];
  static failToPlay = false;
  src: string;
  volume = 1;
  private listeners = new Map<string, Set<() => void>>();
  play = vi.fn(() => (FakeAudio.failToPlay ? Promise.reject(new Error("blocked")) : Promise.resolve()));
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }

  addEventListener(type: string, listener: () => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: () => void) {
    this.listeners.get(type)?.delete(listener);
  }

  /** Fires an event at the element, as the browser would. */
  emit(type: string) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener();
  }
}

class FakeUtterance {
  text: string;
  lang = "";
  pitch = 1;
  rate = 1;
  volume = 1;
  voice: unknown = null;
  constructor(text: string) {
    this.text = text;
  }
}

const pokeButton = () => screen.getByRole("button", { name: "Poke the Lich King figure" });

const poke = (times: number) => {
  for (let i = 0; i < times; i += 1) {
    fireEvent.click(pokeButton());
  }
};

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const stateOf = (container: HTMLElement) =>
  container.querySelector("[data-lich]")?.getAttribute("data-lich");

const renderScene = () =>
  render(
    <DeskScene>
      <svg data-testid="drawing" />
    </DeskScene>,
  );

describe("Lich King figure", () => {
  const speakSpy = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    speakSpy.mockReset();
    FakeAudio.instances = [];
    FakeAudio.failToPlay = false;
    content.sounds.lichKingQuote = RECORDING;
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("speechSynthesis", {
      speak: speakSpy,
      cancel: vi.fn(),
      getVoices: () => [],
    });
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders its children and a poke button, seated", () => {
    const { container } = renderScene();

    expect(screen.getByTestId("drawing")).toBeInTheDocument();
    expect(pokeButton().tagName).toBe("BUTTON");
    expect(stateOf(container)).toBe("rest");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("renders only the drawing on the server", () => {
    const html = renderToString(
      <DeskScene>
        <svg />
      </DeskScene>,
    );

    expect(html).toContain("<svg");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<dialog");
    expect(html).toContain('data-lich="rest"');
  });

  it("wobbles on a poke but stays seated after fewer than five", () => {
    const { container } = renderScene();

    poke(1);
    expect(container.querySelector("[data-poke]")).not.toBeNull();

    poke(3);
    expect(stateOf(container)).toBe("rest");
    expect(FakeAudio.instances).toHaveLength(0);
  });

  it("does not count pokes spread far apart", () => {
    const { container } = renderScene();

    for (let i = 0; i < 5; i += 1) {
      poke(1);
      advance(1000);
    }

    expect(stateOf(container)).toBe("rest");
  });

  it("wakes after five quick pokes and plays the recording once instead of speaking", () => {
    const { container } = renderScene();

    poke(5);

    expect(stateOf(container)).toBe("awake");
    expect(screen.getByRole("status")).toHaveTextContent(LICH_QUOTE);
    expect(FakeAudio.instances).toHaveLength(1);
    const [audio] = FakeAudio.instances;
    expect(audio.src).toBe(RECORDING);
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.volume).toBeLessThan(1);
    expect(speakSpy).not.toHaveBeenCalled();

    // More pokes while awake do not start the line again.
    poke(5);
    expect(FakeAudio.instances).toHaveLength(1);
  });

  it("stays awake until the recording has ended, then sits back down", () => {
    const { container } = renderScene();
    poke(5);
    const [audio] = FakeAudio.instances;

    // The recording is 6.7 seconds long.
    advance(6670);
    expect(stateOf(container)).toBe("awake");
    act(() => audio.emit("ended"));
    expect(stateOf(container)).toBe("awake");

    advance(AWAKE_MS - 6670);
    expect(stateOf(container)).toBe("rest");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("waits for a recording that ends late instead of cutting it off", () => {
    const { container } = renderScene();
    poke(5);
    const [audio] = FakeAudio.instances;

    advance(AWAKE_MS + 1500);
    expect(stateOf(container)).toBe("awake");
    expect(audio.pause).not.toHaveBeenCalled();

    act(() => audio.emit("ended"));
    expect(stateOf(container)).toBe("rest");
  });

  it("sits down after the shortest awake time when the recording cannot play", async () => {
    FakeAudio.failToPlay = true;
    const { container } = renderScene();
    poke(5);
    await act(async () => {});

    advance(AWAKE_MS - 1);
    expect(stateOf(container)).toBe("awake");
    advance(1);
    expect(stateOf(container)).toBe("rest");
  });

  it("gives up on a recording that never ends", () => {
    const { container } = renderScene();
    poke(5);
    const [audio] = FakeAudio.instances;

    advance(MAX_AWAKE_MS);

    expect(stateOf(container)).toBe("rest");
    expect(audio.pause).toHaveBeenCalled();
  });

  it("speaks the line in a low voice when no recording is set", () => {
    content.sounds.lichKingQuote = null;
    const { container } = renderScene();

    poke(5);

    expect(stateOf(container)).toBe("awake");
    expect(FakeAudio.instances).toHaveLength(0);
    expect(speakSpy).toHaveBeenCalledTimes(1);
    const utterance = speakSpy.mock.calls[0][0] as FakeUtterance;
    expect(utterance.text).toBe(LICH_QUOTE);
    expect(utterance.pitch).toBeLessThanOrEqual(0.3);

    advance(AWAKE_MS);
    expect(stateOf(container)).toBe("rest");
  });

  it("still wakes when the browser cannot speak", () => {
    content.sounds.lichKingQuote = null;
    vi.stubGlobal("speechSynthesis", undefined);
    const { container } = renderScene();

    expect(() => poke(5)).not.toThrow();
    expect(stateOf(container)).toBe("awake");
    expect(screen.getByRole("status")).toHaveTextContent(LICH_QUOTE);
    expect(speak("hello")).toBe(false);
  });

  it("clears its timers and stops the recording when unmounted while awake", () => {
    const { unmount } = renderScene();
    poke(5);
    const [audio] = FakeAudio.instances;

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(audio.pause).toHaveBeenCalled();
  });
});

describe("pickVoice", () => {
  const voice = (name: string, lang: string) => ({ name, lang });

  it("picks a male British voice even when a female one is listed first", () => {
    const voices = [
      voice("Google US English", "en-US"),
      voice("Google UK English Female", "en-GB"),
      voice("Google UK English Male", "en-GB"),
    ];

    expect(pickVoice(voices)?.name).toBe("Google UK English Male");
  });

  it("skips female voices when choosing a fallback", () => {
    const voices = [
      voice("Microsoft Hazel - English (United Kingdom)", "en-GB"),
      voice("Samantha (Female)", "en-US"),
      voice("Karen", "en-AU"),
    ];

    expect(pickVoice(voices)?.name).toBe("Microsoft Hazel - English (United Kingdom)");
    expect(pickVoice([voice("Samantha Female", "en-US"), voice("Karen", "en-AU")])?.name).toBe(
      "Karen",
    );
  });

  it("falls back to any English voice, and to none without one", () => {
    expect(pickVoice([voice("Amélie", "fr-FR"), voice("UK Female", "en-GB")])?.name).toBe(
      "UK Female",
    );
    expect(pickVoice([voice("Amélie", "fr-FR")])).toBeUndefined();
  });
});

describe("Lich King figure placement", () => {
  it("keeps the throne out of the drawing's left-most strip, which lies under the text on wide screens", () => {
    // On wide screens up to about 13% of the drawing's width sits under the
    // section's text column, where clicks land on the text instead.
    expect((LICH_BOX.x - ART_VIEWBOX.x) / ART_VIEWBOX.w).toBeGreaterThan(0.14);
  });

  it("keeps the poke target clear of the laptop's screen", () => {
    expect(LICH_BOX.x + LICH_BOX.w).toBeLessThanOrEqual(ART_SCREEN.x);
  });
});

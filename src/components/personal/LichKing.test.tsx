import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LICH_HEAD, LICH_POSE, LichKingFigure } from "@/components/illustrations/LichKingFigure";
import { PersonalArt } from "@/components/illustrations/PersonalArt";
import { PersonalScene } from "./PersonalScene";
import { AWAKE_MS, LICH_QUOTE, MAX_AWAKE_MS, POKES_TO_WAKE } from "./useLichKing";
import { pickVoice, speak } from "./speech";

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
  preload = "";
  currentTime = 0;
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

const sceneOf = (container: HTMLElement) => container.querySelector('[data-scene="personal"]');

const stateOf = (container: HTMLElement) => sceneOf(container)?.getAttribute("data-lich");

const bubbleOf = (container: HTMLElement) => container.querySelector("[data-lich-bubble]");

const renderScene = () =>
  render(
    <PersonalScene catPhotos={[]} hornSrc={null}>
      <PersonalArt />
    </PersonalScene>,
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

  it("draws the figure on its throne in the drawing, with a poke button over it, seated", () => {
    const { container } = renderScene();

    expect(container.querySelector('[data-part="lich"]')).not.toBeNull();
    expect(pokeButton().tagName).toBe("BUTTON");
    expect(stateOf(container)).toBe("rest");
    expect(bubbleOf(container)).toHaveTextContent("");
    expect(bubbleOf(container)).not.toHaveAttribute("data-show");
  });

  it("renders only the still, seated drawing on the server", () => {
    const html = renderToString(
      <PersonalScene catPhotos={[]} hornSrc={null}>
        <PersonalArt />
      </PersonalScene>,
    );

    expect(html).toContain("<svg");
    expect(html).toContain('data-part="lich"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain("data-lich=");
  });

  it("wobbles on a poke but stays seated after fewer than five", () => {
    const { container } = renderScene();

    poke(1);
    expect(sceneOf(container)).toHaveAttribute("data-lich-poke", "a");
    poke(1);
    expect(sceneOf(container)).toHaveAttribute("data-lich-poke", "b");

    poke(POKES_TO_WAKE - 3);
    expect(stateOf(container)).toBe("rest");
    // The first poke loads the recording; nothing plays yet.
    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0].play).not.toHaveBeenCalled();
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
    expect(bubbleOf(container)).toHaveTextContent(LICH_QUOTE);
    expect(bubbleOf(container)).toHaveAttribute("data-show");
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
    expect(bubbleOf(container)).toHaveTextContent("");
    expect(sceneOf(container)).not.toHaveAttribute("data-lich-poke");
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
    expect(bubbleOf(container)).toHaveTextContent(LICH_QUOTE);
    expect(speak("hello")).toBe(false);
  });

  it("loads the recording when the figure is hovered or focused, without playing it", () => {
    renderScene();

    fireEvent.pointerEnter(pokeButton());
    expect(FakeAudio.instances).toHaveLength(1);
    const [audio] = FakeAudio.instances;
    expect(audio.src).toBe(RECORDING);
    expect(audio.preload).toBe("auto");
    expect(audio.load).toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();

    // Loading happens once, however often the figure is hovered or focused.
    fireEvent.focus(pokeButton());
    fireEvent.pointerEnter(pokeButton());
    expect(FakeAudio.instances).toHaveLength(1);
  });

  it("plays the element loaded on the first poke when the fifth wakes the figure", () => {
    renderScene();

    poke(1);
    expect(FakeAudio.instances).toHaveLength(1);
    const [audio] = FakeAudio.instances;
    expect(audio.preload).toBe("auto");
    expect(audio.play).not.toHaveBeenCalled();

    poke(POKES_TO_WAKE - 1);
    expect(FakeAudio.instances).toHaveLength(1);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("plays the line exactly once per awakening and never stops it before it ends", () => {
    const { container } = renderScene();
    poke(5);
    const [audio] = FakeAudio.instances;

    // Pokes while awake, and the shortest awake time passing, neither
    // restart nor stop the line.
    for (let i = 0; i < 4; i += 1) {
      poke(5);
      advance(2000);
    }
    expect(2000 * 4).toBeGreaterThan(AWAKE_MS);
    expect(stateOf(container)).toBe("awake");
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.pause).not.toHaveBeenCalled();
    expect(audio.load).toHaveBeenCalledTimes(1);
    expect(audio.removeAttribute).not.toHaveBeenCalled();

    act(() => audio.emit("ended"));
    expect(stateOf(container)).toBe("rest");

    // The next awakening plays the same, already loaded element from the start.
    audio.currentTime = 6.67;
    poke(5);
    expect(stateOf(container)).toBe("awake");
    expect(FakeAudio.instances).toHaveLength(1);
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.currentTime).toBe(0);
  });

  it("stops the line only when it gives up waiting, and does not hear its end afterwards", () => {
    const { container } = renderScene();
    poke(5);
    const [audio] = FakeAudio.instances;

    advance(MAX_AWAKE_MS - 1);
    expect(audio.pause).not.toHaveBeenCalled();
    advance(1);
    expect(stateOf(container)).toBe("rest");
    expect(audio.pause).toHaveBeenCalledTimes(1);

    // A late end of the stopped line does not affect the figure.
    act(() => audio.emit("ended"));
    expect(stateOf(container)).toBe("rest");
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

describe("Lich King figure poses", () => {
  const css = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../illustrations/LichKingFigure.module.css"),
    "utf8",
  );

  /** The CSS rules whose selectors name one of the pose classes, as [selector, body]. */
  const poseRules = () =>
    Array.from(css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g))
      .map(([, selector, body]) => [selector.trim(), body] as const)
      .filter(([selector]) => /\.(figure|rise|standLegs|sitLegs|sitOnly|arm)\b/.test(selector));

  const renderFigure = () =>
    render(
      <svg viewBox="-20 -40 120 200">
        <LichKingFigure />
      </svg>,
    );

  const pose = (container: HTMLElement, name: string) =>
    container.querySelector(`[data-lich-pose="${name}"]`) as SVGGElement;

  it("never scales a pose: no scale in the pose styles or on the pose groups", () => {
    const rules = poseRules();
    expect(rules.length).toBeGreaterThan(0);
    for (const [selector, body] of rules) {
      expect(body, selector).not.toMatch(/scale/i);
    }

    const { container } = renderFigure();
    for (const name of ["body", "standing", "seated"]) {
      let node: Element | null = pose(container, name);
      expect(node, name).not.toBeNull();
      // Neither the group nor anything above it inside the figure is scaled.
      while (node && node.tagName.toLowerCase() !== "svg") {
        expect(node.getAttribute("transform") ?? "", name).not.toMatch(/scale|matrix/);
        node = node.parentElement;
      }
    }
  });

  it("shares one head, body and arms between the poses, so only the legs change", () => {
    const { container } = renderFigure();
    const body = pose(container, "body");
    const standing = pose(container, "standing");
    const seated = pose(container, "seated");

    // The helm (and its print shadow) is drawn once, in the shared upper body.
    const helms = container.querySelectorAll('path[d^="M8 35"]');
    expect(helms).toHaveLength(2);
    helms.forEach((helm) => expect(body.contains(helm)).toBe(true));
    expect(standing.querySelector('path[d^="M8 35"]')).toBeNull();
    expect(seated.querySelector('path[d^="M8 35"]')).toBeNull();

    // Both poses wear the same boot: the standing one is the seated one moved
    // down to the dais, every coordinate either equal or shifted by the drop.
    const boot = (group: Element) =>
      Array.from(group.querySelectorAll("path"))
        .map((path) => path.getAttribute("d") ?? "")
        .find((d) => /^M19\.5 [\d.]+ H33\.5/.test(d));
    const numbers = (d = "") => Array.from(d.matchAll(/-?\d+(?:\.\d+)?/g), (m) => Number(m[0]));
    const seatedBoot = numbers(boot(seated));
    const standingBoot = numbers(boot(standing));
    const drop = LICH_POSE.standingSole - LICH_POSE.seatedSole;
    expect(seatedBoot.length).toBeGreaterThan(0);
    expect(standingBoot).toHaveLength(seatedBoot.length);
    standingBoot.forEach((value, i) => {
      const moved = value - seatedBoot[i];
      expect(Math.abs(moved) < 1e-9 || Math.abs(moved - drop) < 1e-9, `coordinate ${i}`).toBe(true);
    });
  });

  it("stands only as much taller as the straightened legs make it", () => {
    const seatedHeight = LICH_POSE.seatedSole - LICH_POSE.headTop;
    const standingHeight = LICH_POSE.standingSole - LICH_HEAD.top;
    expect(standingHeight / seatedHeight).toBeGreaterThanOrEqual(1.15);
    expect(standingHeight / seatedHeight).toBeLessThanOrEqual(1.25);

    // The rise in the styles is the one the figure's geometry is drawn for.
    const awakeRise = poseRules().find(([selector]) => /awake"\]\s*\.rise$/.test(selector));
    expect(awakeRise?.[1]).toContain(`translateY(-${LICH_POSE.rise}px)`);
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AWAKE_MS, LICH_QUOTE, LichKingEgg } from "./LichKingEgg";
import { pickVoice, speak } from "./speech";
import { ART_VIEWBOX, LICH_BOX } from "@/components/illustrations/WorkArt";

const pokeButton = () =>
  screen.getByRole("button", { name: "Poke the Lich King figure" });

const poke = (times: number) => {
  for (let i = 0; i < times; i += 1) {
    fireEvent.click(pokeButton());
  }
};

const stateOf = (container: HTMLElement) =>
  container.querySelector("[data-lich]")?.getAttribute("data-lich");

const renderEgg = () =>
  render(
    <LichKingEgg>
      <svg data-testid="drawing" />
    </LichKingEgg>,
  );

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

describe("LichKingEgg", () => {
  const speakSpy = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    speakSpy.mockReset();
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

  it("renders its children and a poke button, at rest", () => {
    const { container } = renderEgg();

    expect(screen.getByTestId("drawing")).toBeInTheDocument();
    expect(pokeButton().tagName).toBe("BUTTON");
    expect(stateOf(container)).toBe("rest");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("renders only the drawing on the server", () => {
    const html = renderToString(
      <LichKingEgg>
        <svg />
      </LichKingEgg>,
    );

    expect(html).toContain("<svg");
    expect(html).not.toContain("<button");
    expect(html).toContain('data-lich="rest"');
  });

  it("wobbles on a poke but stays at rest after fewer than five", () => {
    const { container } = renderEgg();

    poke(1);
    expect(container.querySelector("[data-poke]")).not.toBeNull();

    poke(3);
    expect(stateOf(container)).toBe("rest");
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it("does not count pokes spread far apart", () => {
    const { container } = renderEgg();

    for (let i = 0; i < 5; i += 1) {
      poke(1);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(stateOf(container)).toBe("rest");
  });

  it("wakes after five quick pokes, says its line once, then rests again", () => {
    const { container } = renderEgg();

    poke(5);

    expect(stateOf(container)).toBe("awake");
    expect(screen.getByRole("status")).toHaveTextContent(LICH_QUOTE);
    expect(speakSpy).toHaveBeenCalledTimes(1);
    const utterance = speakSpy.mock.calls[0][0] as FakeUtterance;
    expect(utterance.text).toBe(LICH_QUOTE);
    expect(utterance.pitch).toBeLessThanOrEqual(0.3);

    // More pokes while awake do not start the line again.
    poke(5);
    expect(speakSpy).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(AWAKE_MS);
    });

    expect(stateOf(container)).toBe("rest");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("still wakes when the browser cannot speak", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    const { container } = renderEgg();

    expect(() => poke(5)).not.toThrow();
    expect(stateOf(container)).toBe("awake");
    expect(screen.getByRole("status")).toHaveTextContent(LICH_QUOTE);
    expect(speak("hello")).toBe(false);
  });

  it("clears its timer when unmounted while awake", () => {
    const { unmount } = renderEgg();
    poke(5);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
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

    expect(pickVoice(voices)?.name).toBe(
      "Microsoft Hazel - English (United Kingdom)",
    );
    expect(
      pickVoice([voice("Samantha Female", "en-US"), voice("Karen", "en-AU")])
        ?.name,
    ).toBe("Karen");
  });

  it("falls back to any English voice, and to none without one", () => {
    expect(
      pickVoice([voice("Amélie", "fr-FR"), voice("UK Female", "en-GB")])?.name,
    ).toBe("UK Female");
    expect(pickVoice([voice("Amélie", "fr-FR")])).toBeUndefined();
  });
});

describe("Lich King figure placement", () => {
  it("keeps the figure out of the drawing's left-most strip, which lies under the text on wide screens", () => {
    // On wide screens up to about 13% of the drawing's width sits under the
    // section's text column, where clicks land on the text instead.
    expect((LICH_BOX.x - ART_VIEWBOX.x) / ART_VIEWBOX.w).toBeGreaterThan(0.14);
  });
});

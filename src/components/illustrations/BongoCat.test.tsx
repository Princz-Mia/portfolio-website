import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BongoCat, SCREEN_LOOP } from "./BongoCat";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "BongoCat.module.css"),
  "utf8",
);

type ScreenToken = { u1: number; u2: number; v: number; delay: number };

const screenTokens = (container: HTMLElement): ScreenToken[] =>
  Array.from(container.querySelectorAll("[data-loop='screen'] line")).map((line) => ({
    u1: Number(line.getAttribute("x1")),
    u2: Number(line.getAttribute("x2")),
    v: Number(line.getAttribute("y1")),
    delay: parseFloat((line as SVGElement).style.getPropertyValue("--d")),
  }));

const rowAt = (tokens: ScreenToken[], v: number) =>
  tokens
    .filter((token) => Math.abs(token.v - v) < 1e-6)
    .map(({ u1, u2, delay }) => ({ u1, u2, delay }));

const moodOf = () =>
  screen
    .getByRole("img", { name: /cat with headphones/i })
    .closest("[data-mood]")
    ?.getAttribute("data-mood");

const petButton = () => screen.getByRole("button", { name: "Pet the cat" });

const pet = (times: number) => {
  for (let i = 0; i < times; i += 1) {
    fireEvent.click(petButton());
  }
};

describe("BongoCat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a named drawing with a pet button", () => {
    render(<BongoCat />);

    expect(screen.getByRole("img", { name: /cat with headphones/i })).toBeInTheDocument();
    expect(petButton().tagName).toBe("BUTTON");
    expect(moodOf()).toBe("calm");
  });

  it("renders only the still drawing on the server", () => {
    const html = renderToString(<BongoCat />);

    expect(html).toContain("<svg");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("pet the cat");
  });

  it("closes its eyes briefly when petted", () => {
    render(<BongoCat />);

    pet(1);
    expect(moodOf()).toBe("happy");

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(moodOf()).toBe("calm");
  });

  it("squeezes its eyes shut after three quick pets", () => {
    render(<BongoCat />);

    pet(3);
    expect(moodOf()).toBe("giddy");
  });

  it("starts a new streak when pets are far apart", () => {
    render(<BongoCat />);

    pet(2);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    pet(1);
    expect(moodOf()).toBe("happy");
  });

  it("gets grumpy after five quick pets, ignores pets meanwhile, then calms down", () => {
    render(<BongoCat />);

    pet(5);
    expect(moodOf()).toBe("grumpy");
    expect(screen.getByText("#$!")).toBeInTheDocument();

    pet(1);
    expect(moodOf()).toBe("grumpy");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(moodOf()).toBe("calm");
    expect(screen.queryByText("#$!")).not.toBeInTheDocument();
  });

  it("pauses its loops while grumpy and resumes them without remounting", () => {
    const { container } = render(<BongoCat />);
    const loops = () => Array.from(container.querySelectorAll("[data-loop]"));
    const tokens = () => Array.from(container.querySelectorAll("[data-loop='screen'] line"));

    const loopsBefore = loops();
    const tokensBefore = tokens();
    expect(loopsBefore.map((node) => node.getAttribute("data-loop")).sort()).toEqual([
      "notes",
      "notes",
      "paw",
      "paw",
      "screen",
    ]);
    expect(tokensBefore.length).toBeGreaterThan(0);

    pet(5);
    expect(moodOf()).toBe("grumpy");
    // The same nodes stay in place, so their animations hold rather than restart.
    expect(loops()).toEqual(loopsBefore);
    loops().forEach((node, index) => expect(node).toBe(loopsBefore[index]));
    tokens().forEach((node, index) => expect(node).toBe(tokensBefore[index]));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(moodOf()).toBe("calm");
    loops().forEach((node, index) => expect(node).toBe(loopsBefore[index]));
    tokens().forEach((node, index) => expect(node).toBe(tokensBefore[index]));
  });

  it("can be petted again once it has calmed down", () => {
    render(<BongoCat />);

    pet(5);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(moodOf()).toBe("calm");

    pet(1);
    expect(moodOf()).toBe("happy");
  });

  it("clips the scrolling code to the laptop screen", () => {
    const { container } = render(<BongoCat />);
    const screen = container.querySelector("[data-loop='screen']");
    expect(screen).not.toBeNull();

    // Every clip on the way up from the code points at a clip path that exists.
    const clipped: Element[] = [];
    for (let node = screen?.parentElement; node && node !== container; node = node.parentElement) {
      if (node.hasAttribute("clip-path")) {
        clipped.push(node);
      }
    }
    expect(clipped).toHaveLength(2);
    clipped.forEach((node) => {
      const id = node.getAttribute("clip-path")?.match(/^url\(#(.+)\)$/)?.[1];
      expect(id).toBeTruthy();
      expect(container.querySelector(`clipPath[id="${id}"]`)).not.toBeNull();
    });
  });

  it("clears its timers when unmounted", () => {
    const { unmount } = render(<BongoCat />);

    pet(5);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("hides the hint after the first pet", () => {
    render(<BongoCat />);

    const hint = screen.getByText("psst: pet the cat");
    expect(hint).not.toHaveAttribute("data-gone");

    pet(1);
    expect(hint).toHaveAttribute("data-gone");
  });

  it("draws the last line above the first, so the wrap scrolls like every other step", () => {
    const { container } = render(<BongoCat />);
    const tokens = screenTokens(container);
    const { gap, lines } = SCREEN_LOOP;
    const top = Math.min(...tokens.map((token) => token.v));

    const above = rowAt(tokens, top);
    expect(above.length).toBeGreaterThan(0);
    // Same layout and timing as the last line of the program, one row below the first.
    expect(above).toEqual(rowAt(tokens, top + lines * gap));
  });

  it("opens the loop on the same frame as the still drawing", () => {
    const { container } = render(<BongoCat />);
    const tokens = screenTokens(container);
    const { gap, rows, stepS, loopS, openS } = SCREEN_LOOP;
    const first = Math.min(...tokens.map((token) => token.v)) + gap;

    // No scroll has happened yet and the easing of the first step is over.
    expect(openS).toBeLessThan(stepS);
    expect(openS).toBeGreaterThanOrEqual(0.15 * stepS);

    // Every line on screen is fully typed at that moment.
    const visible = tokens.filter((token) => token.v >= first && token.v <= first + (rows - 1) * gap);
    expect(visible.length).toBeGreaterThan(0);
    visible.forEach(({ delay }) => {
      const progress = (((-delay % loopS) + loopS) % loopS) / loopS;
      expect(progress).toBeGreaterThanOrEqual(0.02);
      expect(progress).toBeLessThanOrEqual(0.88);
    });
  });

  it("takes the scroll timing from the component instead of fixed numbers", () => {
    const { container } = render(<BongoCat />);
    const group = container.querySelector("[data-loop='screen']") as SVGElement;
    const { gap, lines, stepS, loopS, openS } = SCREEN_LOOP;

    expect(group.style.getPropertyValue("--loop")).toBe(`${loopS}s`);
    expect(group.style.getPropertyValue("--step")).toBe(`${stepS}s`);
    expect(group.style.getPropertyValue("--steps")).toBe(String(lines));
    expect(group.style.getPropertyValue("--gap")).toBe(String(gap));
    expect(group.style.getPropertyValue("--shift")).toBe(String(lines * gap));
    expect(group.style.getPropertyValue("--open")).toBe(`${-openS}s`);

    expect(css).toMatch(/animation: scroll var\(--loop\) steps\(var\(--steps\), end\) var\(--open\)/);
    expect(css).toMatch(/animation: scrollEase var\(--step\) ease-out var\(--open\)/);
    expect(css).toMatch(/animation: type var\(--loop\)/);
  });

  it("clears each line after it leaves the top and before it scrolls in again", () => {
    const { rows, stepS, scrollS, loopS } = SCREEN_LOOP;
    const type = css.match(/@keyframes type \{([\s\S]*?)\r?\n\}/)?.[1] ?? "";
    const shownUntil = Number(type.match(/2%,\s*([\d.]+)% \{\s*stroke-dashoffset: 0;/)?.[1]);
    const clearedFrom = Number(type.match(/([\d.]+)%,\s*100% \{\s*stroke-dashoffset: 1;/)?.[1]);

    // Seconds after a line starts typing: it leaves the top of the screen
    // ROWS steps later, and the next copy scrolls in a whole loop later.
    expect((shownUntil / 100) * loopS).toBeGreaterThanOrEqual(rows * stepS + scrollS);
    expect((clearedFrom / 100) * loopS).toBeLessThan(loopS - stepS);
  });
});

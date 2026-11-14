import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Chalkboard } from "./Chalkboard";
import {
  BOARD_H,
  BOARD_W,
  WRITING_LABEL,
  WRITING_LINES,
  buildScript,
  chalkMarks,
  describeBoard,
  heartPoints,
  layoutGlyphs,
  mulberry32,
  noiseAlpha,
  pointAlong,
  segmentRng,
  spongeDabs,
  strokeReach,
  sweepPath,
  tipAt,
  toBoard,
  type StrokeStep,
} from "./chalk";

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

describe("mulberry32", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const first = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(first);
    expect(Array.from({ length: 5 }, mulberry32(43))).not.toEqual(first);
  });

  it("stays within [0, 1)", () => {
    const rnd = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const value = rnd();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("gives each segment of a stroke its own sequence", () => {
    expect(segmentRng(9, 0)()).toBe(segmentRng(9, 0)());
    expect(segmentRng(9, 0)()).not.toBe(segmentRng(9, 1)());
  });
});

describe("chalkMarks", () => {
  const a = { x: 10, y: 10 };
  const b = { x: 30, y: 14 };

  it("is deterministic for a seeded generator", () => {
    expect(chalkMarks(a, b, mulberry32(5))).toEqual(chalkMarks(a, b, mulberry32(5)));
  });

  it("keeps opacity and width within a chalky range", () => {
    const marks = chalkMarks(a, b, mulberry32(5), 2);
    expect(marks.alpha).toBeGreaterThanOrEqual(0.6);
    expect(marks.alpha).toBeLessThanOrEqual(0.9);
    expect(marks.lineWidth).toBeGreaterThanOrEqual(1.7);
    expect(marks.lineWidth).toBeLessThanOrEqual(2.3);
  });

  it("scatters grain pits close to the segment, more on longer strokes", () => {
    const marks = chalkMarks(a, b, mulberry32(8));
    expect(marks.pits.length).toBeGreaterThan(10);
    for (const pit of marks.pits) {
      expect(pit.x).toBeGreaterThan(a.x - 3);
      expect(pit.x).toBeLessThan(b.x + 3);
      expect(pit.y).toBeGreaterThan(a.y - 3);
      expect(pit.y).toBeLessThan(b.y + 3);
    }
    expect(chalkMarks(a, { x: 11, y: 10 }, mulberry32(8)).pits.length).toBeLessThan(
      marks.pits.length,
    );
  });
});

describe("spongeDabs", () => {
  it("covers a drag without gaps and ends on the target", () => {
    const radius = 10;
    const dabs = spongeDabs({ x: 0, y: 0 }, { x: 100, y: 0 }, radius);
    expect(dabs.at(-1)).toEqual({ x: 100, y: 0 });
    let previous = 0;
    for (const dab of dabs) {
      expect(dab.x - previous).toBeLessThanOrEqual(radius * 0.35 + 1e-9);
      previous = dab.x;
    }
  });

  it("stamps once when the sponge does not move", () => {
    expect(spongeDabs({ x: 5, y: 5 }, { x: 5, y: 5 }, 10)).toEqual([{ x: 5, y: 5 }]);
  });
});

describe("board geometry", () => {
  it("maps pointer positions to board units", () => {
    const rect = { left: 100, top: 50, width: BOARD_W * 2, height: BOARD_H * 2 };
    expect(toBoard(100, 50, rect)).toEqual({ x: 0, y: 0 });
    expect(toBoard(100 + BOARD_W, 50 + BOARD_H, rect)).toEqual({ x: BOARD_W / 2, y: BOARD_H / 2 });
  });

  it("keeps the wipe sweep on the board", () => {
    for (const point of sweepPath()) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(BOARD_W);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(BOARD_H);
    }
  });

  it("walks along a polyline by fraction", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(pointAlong(line, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAlong(line, 0.25)).toEqual({ x: 5, y: 0 });
    expect(pointAlong(line, 0.75)).toEqual({ x: 10, y: 5 });
    expect(pointAlong(line, 1)).toEqual({ x: 10, y: 10 });
  });

  it("draws a closed heart", () => {
    const heart = heartPoints({ x: 50, y: 50 }, 20);
    expect(heart[0].x).toBeCloseTo(heart.at(-1)!.x);
    expect(heart[0].y).toBeCloseTo(heart.at(-1)!.y);
    const xs = heart.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(20, 0);
  });
});

describe("texture and handwriting", () => {
  it("makes a grain tile that is mostly clear with some deep pits", () => {
    const alpha = noiseAlpha(32, mulberry32(3));
    expect(alpha).toHaveLength(32 * 32);
    const clear = alpha.filter((value) => value === 0).length;
    const deep = alpha.filter((value) => value >= 150).length;
    expect(clear / alpha.length).toBeGreaterThan(0.45);
    expect(deep).toBeGreaterThan(0);
  });

  it("places glyphs at their measured offsets and skips spaces", () => {
    const glyphs = layoutGlyphs("a b", [0, 10, 15], mulberry32(1));
    expect(glyphs.map((glyph) => glyph.char)).toEqual(["a", "b"]);
    expect(glyphs.map((glyph) => glyph.x)).toEqual([0, 15]);
    for (const glyph of glyphs) {
      expect(Math.abs(glyph.dy)).toBeLessThanOrEqual(0.8);
      expect(Math.abs(glyph.rotate)).toBeLessThanOrEqual(0.04);
    }
  });
});

describe("writing script", () => {
  const widths = WRITING_LINES.map((line) => line.text.length * 10);
  const script = buildScript(widths);

  it("takes about three to four seconds", () => {
    expect(script.duration).toBeGreaterThan(2800);
    expect(script.duration).toBeLessThan(4600);
  });

  it("writes every line, the underline and the heart in order without overlaps", () => {
    const texts = script.steps.filter((step) => step.kind === "text");
    expect(texts.map((step) => step.line)).toEqual(WRITING_LINES.map((_, i) => i));
    expect(script.steps.filter((step) => step.kind === "stroke")).toHaveLength(2);
    for (let i = 1; i < script.steps.length; i++) {
      const before = script.steps[i - 1];
      expect(script.steps[i].start).toBeCloseTo(before.start + before.duration);
    }
  });

  it("keeps the chalk tip on the board and parks it when done", () => {
    for (let t = 0; t < script.duration; t += 50) {
      const tip = tipAt(script, t);
      expect(tip).not.toBeNull();
      expect(tip!.x).toBeGreaterThanOrEqual(0);
      expect(tip!.x).toBeLessThanOrEqual(BOARD_W);
      expect(tip!.y).toBeGreaterThanOrEqual(0);
      expect(tip!.y).toBeLessThanOrEqual(BOARD_H);
    }
    expect(tipAt(script, script.duration)).toBeNull();
  });

  it("reaches further along a stroke as time passes", () => {
    const stroke = script.steps.find((step): step is StrokeStep => step.kind === "stroke")!;
    expect(strokeReach(stroke, 0)).toBe(0);
    expect(strokeReach(stroke, 0.5)).toBeGreaterThan(0);
    expect(strokeReach(stroke, 0.5)).toBeLessThan(stroke.points.length - 1);
    expect(strokeReach(stroke, 1)).toBe(stroke.points.length - 1);
  });
});

describe("describeBoard", () => {
  it("names the written program only when it is untouched", () => {
    expect(describeBoard({ writing: true, doodles: false, smudged: false })).toBe(WRITING_LABEL);
    expect(describeBoard({ writing: true, doodles: true, smudged: false })).toMatch(/doodles added/);
    expect(describeBoard({ writing: true, doodles: false, smudged: true })).toMatch(
      /class Hello.*partly wiped away/,
    );
  });

  it("describes a blank board and doodles alone", () => {
    expect(describeBoard({ writing: false, doodles: false, smudged: false })).toMatch(/blank/);
    expect(describeBoard({ writing: false, doodles: false, smudged: true })).toMatch(/blank/);
    expect(describeBoard({ writing: false, doodles: true, smudged: false })).not.toMatch(/Hello/);
    expect(describeBoard({ writing: false, doodles: true, smudged: true })).toMatch(/partly wiped/);
  });
});

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/** A 2D context that accepts every call; jsdom has no canvas of its own. */
function fakeContext(): CanvasRenderingContext2D {
  const target: Record<PropertyKey, unknown> = {
    measureText: (text: string) => ({ width: text.length * 10 }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createPattern: () => ({}),
    createImageData: (w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    }),
  };
  return new Proxy(target, {
    get(object, key) {
      if (!(key in object)) object[key] = () => {};
      return object[key];
    },
  }) as unknown as CanvasRenderingContext2D;
}

function stubReducedMotion(reduce: boolean) {
  const query = (media: string) =>
    ({
      matches: reduce && media.includes("prefers-reduced-motion"),
      media,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: query });
}

describe("Chalkboard", () => {
  const originalMatchMedia = window.matchMedia;
  let getContext: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stubReducedMotion(true);
    getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(fakeContext as unknown as HTMLCanvasElement["getContext"]);
  });

  afterEach(() => {
    getContext.mockRestore();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
  });

  it("renders the finished writing statically when the canvas is unavailable", () => {
    getContext.mockReturnValue(null);
    const { container } = render(<Chalkboard />);

    const texts = Array.from(container.querySelectorAll("svg text"), (node) => node.textContent);
    expect(texts).toEqual(WRITING_LINES.map((line) => line.text));
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("img", { name: /class Hello/ })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveAttribute("data-board");
  });

  it("offers the tools once the board is live", async () => {
    const { container } = render(<Chalkboard />);

    const sponge = await screen.findByRole("button", { name: "Pick up the sponge" });
    const chalk = screen.getByRole("button", { name: "Pick up the chalk" });
    expect(container.firstElementChild).toHaveAttribute("data-board", "live");
    expect(sponge).toHaveAttribute("aria-pressed", "false");
    expect(chalk).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(sponge);
    expect(sponge).toHaveAttribute("aria-pressed", "true");
    expect(chalk).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent(/sponge picked up/i);
    expect(screen.getByRole("img")).toHaveAttribute("data-tool", "sponge");

    fireEvent.click(chalk);
    expect(chalk).toHaveAttribute("aria-pressed", "true");
    expect(sponge).toHaveAttribute("aria-pressed", "false");

    fireEvent.keyDown(document.body, { key: "Escape", ctrlKey: true });
    expect(chalk).toHaveAttribute("aria-pressed", "true");

    // Escape works wherever focus is, not only inside the board.
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(chalk).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("img")).not.toHaveAttribute("data-tool");
    expect(screen.getByRole("status")).toHaveTextContent(/back on the tray/i);
  });

  it("wipes the board and writes it again from buttons", async () => {
    render(<Chalkboard />);

    fireEvent.click(await screen.findByRole("button", { name: "Wipe the board" }));
    expect(screen.getByRole("status")).toHaveTextContent(/wiped clean/i);
    expect(screen.getByRole("img")).toHaveAccessibleName(/blank chalkboard/i);

    fireEvent.click(screen.getByRole("button", { name: "Write it again" }));
    expect(screen.getByRole("status")).toHaveTextContent(/writing on the board again/i);
    expect(screen.getByRole("img")).toHaveAccessibleName(/class Hello/);
  });

  it("does not write over a board wiped before it scrolled into view", async () => {
    stubReducedMotion(false);
    let reveal: IntersectionObserverCallback = () => {};
    class PendingObserver {
      constructor(callback: IntersectionObserverCallback) {
        reveal = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", PendingObserver);
    try {
      render(<Chalkboard />);
      const wipe = await screen.findByRole("button", { name: "Wipe the board" });
      expect(screen.getByRole("img")).toHaveAccessibleName(/blank chalkboard/i);

      fireEvent.click(wipe);
      act(() => {
        reveal(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });
      expect(screen.getByRole("img")).toHaveAccessibleName(/blank chalkboard/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps working with motion allowed", async () => {
    stubReducedMotion(false);
    render(<Chalkboard />);

    const again = await screen.findByRole("button", { name: "Write it again" });
    fireEvent.click(again);
    fireEvent.click(screen.getByRole("button", { name: "Pick up the chalk" }));
    expect(screen.getByRole("button", { name: "Pick up the chalk" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

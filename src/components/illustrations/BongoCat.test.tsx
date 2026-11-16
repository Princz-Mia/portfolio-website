import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BongoCat, SCREEN_LOOP, screenAt, type TokenSpot } from "./BongoCat";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "BongoCat.module.css"),
  "utf8",
);

type Point = [number, number];

/** The laptop screen's corners, clockwise from the far top corner. */
const CORNERS: Point[] = [
  [93.8, 63.3],
  [284.1, 73],
  [335.9, 230.5],
  [146.2, 197.6],
];
const SCREEN_POINTS = CORNERS.map(([x, y]) => `${x},${y}`).join(" ");

/** Distance of a point from the nearest screen edge, positive inside. */
const inset = ([x, y]: Point) =>
  Math.min(
    ...CORNERS.map(([ax, ay], i) => {
      const [bx, by] = CORNERS[(i + 1) % CORNERS.length];
      return ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / Math.hypot(bx - ax, by - ay);
    }),
  );

const slope = ([ax, ay]: Point, [bx, by]: Point) => (by - ay) / (bx - ax);

const shown = (spots: TokenSpot[]) =>
  spots.filter((spot): spot is NonNullable<TokenSpot> => spot !== null);

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

  it("keeps the notes going while grumpy and holds the paws and screen without remounting", () => {
    const { container } = render(<BongoCat />);
    const loops = () => Array.from(container.querySelectorAll("[data-loop]"));
    const tokens = () => Array.from(container.querySelectorAll("[data-loop='screen'] line"));
    const byKind = (kind: string) =>
      Array.from(container.querySelectorAll(`[data-loop='${kind}']`));
    const noteNodes = () => Array.from(container.querySelectorAll("[data-loop='notes'] *"));

    const loopsBefore = loops();
    const tokensBefore = tokens();
    const notesBefore = noteNodes();
    expect(loopsBefore.map((node) => node.getAttribute("data-loop")).sort()).toEqual([
      "notes",
      "notes",
      "paw",
      "paw",
      "screen",
    ]);
    expect(tokensBefore.length).toBeGreaterThan(0);
    loopsBefore.forEach((node) => expect(node).not.toHaveAttribute("data-paused"));

    pet(5);
    expect(moodOf()).toBe("grumpy");
    // Paws and screen hold their frame; the notes carry on.
    [...byKind("paw"), ...byKind("screen")].forEach((node) =>
      expect(node).toHaveAttribute("data-paused"),
    );
    byKind("notes").forEach((node) => {
      expect(node).not.toHaveAttribute("data-paused");
      expect(node.closest("[data-paused]")).toBeNull();
      expect(node.querySelector("[data-paused]")).toBeNull();
    });
    // The same nodes stay in place, so no animation restarts.
    loops().forEach((node, index) => expect(node).toBe(loopsBefore[index]));
    tokens().forEach((node, index) => expect(node).toBe(tokensBefore[index]));
    noteNodes().forEach((node, index) => expect(node).toBe(notesBefore[index]));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(moodOf()).toBe("calm");
    loops().forEach((node, index) => {
      expect(node).toBe(loopsBefore[index]);
      expect(node).not.toHaveAttribute("data-paused");
    });
    tokens().forEach((node, index) => expect(node).toBe(tokensBefore[index]));
    noteNodes().forEach((node, index) => expect(node).toBe(notesBefore[index]));
  });

  it("scrolls the screen while in view, holds it while grumpy and carries on from there", () => {
    const { container } = render(
      <div data-anim="in">
        <BongoCat />
      </div>,
    );
    const lines = Array.from(container.querySelectorAll("[data-loop='screen'] line"));
    const frame = () =>
      lines
        .map((line) =>
          line.hasAttribute("visibility")
            ? "-"
            : ["x1", "y1", "x2", "y2"].map((name) => line.getAttribute(name)).join(" "),
        )
        .join("|");
    const still = frame();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    const moving = frame();
    expect(moving).not.toBe(still);

    pet(5);
    expect(moodOf()).toBe("grumpy");
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const held = frame();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(frame()).toBe(held);

    // Calm again: it picks up from the held frame instead of starting over.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(moodOf()).toBe("calm");
    const resumed = frame();
    expect(resumed).not.toBe(still);
    const changed = resumed.split("|").filter((spot, index) => spot !== held.split("|")[index]);
    expect(changed.length).toBeLessThanOrEqual(lines.length / 2);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(frame()).not.toBe(resumed);
  });

  it("keeps the still screen when motion is reduced", () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      ...matchMedia(query),
      matches: query.includes("reduce"),
    })) as typeof window.matchMedia;
    try {
      const { container } = render(
        <div data-anim="in">
          <BongoCat />
        </div>,
      );
      const lines = Array.from(container.querySelectorAll("[data-loop='screen'] line"));
      const before = lines.map((line) => line.outerHTML).join();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(lines.map((line) => line.outerHTML).join()).toBe(before);
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it("pauses only the paws in the stylesheet, never the notes", () => {
    const paused = Array.from(
      css
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .matchAll(/([^{}]+)\{[^{}]*animation-play-state:\s*paused/g),
      (match) => match[1],
    ).join(",");

    expect(paused).toMatch(/\[data-paused\] \.tapA/);
    expect(paused).toMatch(/\[data-paused\] \.tapB/);
    expect(paused).not.toMatch(/note|sparkle/i);
  });

  it("draws both ears in front of the headband", () => {
    const { container } = render(<BongoCat />);
    const ears = Array.from(container.querySelectorAll("[data-part='ear']"));

    expect(ears).toHaveLength(2);
    ears.forEach((ear) => expect(ear.querySelectorAll("path").length).toBeGreaterThan(0));
    // Later in the document means painted on top of the band.
    const band = ears[0].parentElement?.querySelector(":scope > path");
    expect(band).toBeTruthy();
    ears.forEach((ear) =>
      expect(band!.compareDocumentPosition(ear) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy(),
    );
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
    const code = container.querySelector("[data-loop='screen']");
    expect(code).not.toBeNull();

    const clipIds: string[] = [];
    for (let node = code?.parentElement; node && node !== container; node = node.parentElement) {
      const id = node.getAttribute("clip-path")?.match(/^url\(#(.+)\)$/)?.[1];
      if (id) {
        clipIds.push(id);
      }
    }
    expect(clipIds).toHaveLength(2);
    const shapes = clipIds.map((id) =>
      container.querySelector(`clipPath[id="${id}"] polygon`)?.getAttribute("points"),
    );
    // The outer clip is the screen itself; the inner one is the band of rows.
    expect(shapes[1]).toBe(SCREEN_POINTS);
    expect(shapes[0]).toBeTruthy();
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

  it("keeps every line inside the screen, following its perspective", () => {
    const top = slope(CORNERS[0], CORNERS[1]);
    const bottom = slope(CORNERS[3], CORNERS[2]);
    const { stepS, loopS, openS } = SCREEN_LOOP;

    for (let t = 0; t < loopS; t += stepS / 7) {
      const visible = shown(screenAt(t));
      expect(visible.length).toBeGreaterThan(0);
      visible.forEach(({ x1, y1, x2, y2 }) => {
        // Only the line sliding out past the top margin may come near the edge,
        // and the scroll clip trims it there.
        expect(inset([x1, y1])).toBeGreaterThan(-10);
        expect(inset([x2, y2])).toBeGreaterThan(-10);
        // Each line runs between the slopes of the screen's top and bottom edges.
        if (x2 - x1 > 3) {
          const s = slope([x1, y1], [x2, y2]);
          expect(s).toBeGreaterThanOrEqual(top - 1e-3);
          expect(s).toBeLessThanOrEqual(bottom + 1e-3);
        }
      });
    }

    // At rest every line is well inside the screen.
    const rest = shown(screenAt(openS));
    rest.forEach(({ x1, y1, x2, y2 }) => {
      expect(inset([x1, y1])).toBeGreaterThan(5);
      expect(inset([x2, y2])).toBeGreaterThan(5);
    });
    // The first line runs parallel to the top edge and the last one nearly
    // parallel to the bottom edge.
    const byHeight = [...rest].sort((a, b) => a.y1 - b.y1);
    const first = byHeight.filter((spot) => Math.abs(spot.y1 - byHeight[0].y1) < 6);
    expect(slope([first[0].x1, first[0].y1], [first[0].x2, first[0].y2])).toBeCloseTo(top, 1);
    const last = byHeight[byHeight.length - 1];
    expect(slope([last.x1, last.y1], [last.x2, last.y2])).toBeCloseTo(bottom, 1);
  });

  it("indents lines from the screen's left edge with a consistent margin", () => {
    const rest = shown(screenAt(SCREEN_LOOP.openS));
    const [p0, p3] = [CORNERS[0], CORNERS[3]];
    const [ex, ey] = [p3[0] - p0[0], p3[1] - p0[1]];
    // Distance of each line's first token from the left edge.
    const starts = rest
      .filter((spot) => !rest.some((other) => other !== spot && Math.abs(other.y1 - spot.y1) < 4 && other.x1 < spot.x1))
      .map(({ x1, y1 }) => Math.abs(ex * (y1 - p0[1]) - ey * (x1 - p0[0])) / Math.hypot(ex, ey));
    expect(starts.length).toBeGreaterThan(5);
    expect(Math.min(...starts)).toBeGreaterThan(8);
    expect(Math.min(...starts)).toBeLessThan(16);
  });

  it("opens the loop on the still drawing and types each new line from its start", () => {
    const { container } = render(<BongoCat />);
    const { rows, stepS, scrollS, openS } = SCREEN_LOOP;
    const lines = Array.from(container.querySelectorAll("[data-loop='screen'] line"));
    const still = screenAt(openS);
    expect(lines).toHaveLength(still.length);

    // The rendered screen is the opening frame.
    lines.forEach((line, index) => {
      const spot = still[index];
      if (spot) {
        expect(Number(line.getAttribute("x1"))).toBe(spot.x1);
        expect(Number(line.getAttribute("y1"))).toBe(spot.y1);
        expect(Number(line.getAttribute("x2"))).toBe(spot.x2);
        expect(Number(line.getAttribute("y2"))).toBe(spot.y2);
        expect(line).not.toHaveAttribute("visibility");
      } else {
        expect(line).toHaveAttribute("visibility", "hidden");
      }
    });

    // A full screen of lines at rest (one program line is blank).
    const heights = new Set(shown(still).map((spot) => Math.round(spot.y1 / 8)));
    expect(heights.size).toBeGreaterThanOrEqual(rows - 2);

    // Early in the next step only the first token of the new bottom line has
    // started, and it grows from its start.
    const early = screenAt(stepS + scrollS + 0.05);
    const later = screenAt(stepS + scrollS + 0.1);
    const typing = early
      .map((spot, index) => ({ spot, next: later[index], was: still[index] }))
      .filter(({ spot, was }) => spot && !was);
    expect(typing).toHaveLength(1);
    const [{ spot, next }] = typing;
    expect(next!.x1).toBeCloseTo(spot!.x1, 1);
    expect(next!.x2).toBeGreaterThan(spot!.x2);
  });

  it("loops seamlessly", () => {
    const { loopS } = SCREEN_LOOP;
    expect(screenAt(loopS + 0.37)).toEqual(screenAt(0.37));
    expect(screenAt(loopS - 1e-6).map((spot) => spot !== null)).toEqual(
      screenAt(0).map((spot) => spot !== null),
    );
  });
});

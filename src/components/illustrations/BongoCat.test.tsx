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

/** Distance of a point from the line through one screen edge. */
const distanceToEdge =
  ([ax, ay]: Point, [bx, by]: Point) =>
  ([x, y]: Point) =>
    Math.abs((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / Math.hypot(bx - ax, by - ay);

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

  it("tucks both band ends under the speakers, which are drawn over them", () => {
    const { container } = render(<BongoCat />);
    const headset = container.querySelector("[data-part='ear']")?.parentElement;
    expect(headset).toBeTruthy();
    const bands = Array.from(headset!.querySelectorAll(":scope > path"));
    expect(bands).toHaveLength(2);
    // Each speaker is a print shadow, a shell, a cushion and an outer face.
    const speakers = Array.from(headset!.querySelectorAll("g")).filter(
      (group) => group.querySelectorAll(":scope > path").length === 4,
    );
    expect(speakers).toHaveLength(2);
    speakers.forEach((speaker) =>
      bands.forEach((band) =>
        expect(band.compareDocumentPosition(speaker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy(),
      ),
    );
  });

  it("puts each speaker over the base of the ears, not an ear across a speaker", () => {
    const { container } = render(<BongoCat />);
    const ears = Array.from(container.querySelectorAll("[data-part='ear']"));
    const speakers = Array.from(container.querySelectorAll("[data-part='speaker']"));

    expect(speakers.map((speaker) => speaker.getAttribute("data-side"))).toEqual(["far", "near"]);
    speakers.forEach((speaker) =>
      ears.forEach((ear) =>
        expect(ear.compareDocumentPosition(speaker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy(),
      ),
    );
  });

  it("bends the near half of the band down the side of the head, behind the near ear", () => {
    const { container } = render(<BongoCat />);
    const headset = container.querySelector("[data-part='ear']")?.parentElement;
    const near = Array.from(headset!.querySelectorAll(":scope > path"))
      .map((band) => band.getAttribute("d") ?? "")
      .find((d) => /^M6\d\d/.test(d));
    expect(near).toBeTruthy();

    // The drop to the speaker is one cubic, then the arc over the crown:
    // M p0 C p1 p2 p3 A r r rotation large sweep end.
    const n = near!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    const cubic = (p: number[]) => (t: number): Point => {
      const k = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3];
      return [0, 1].map((axis) => k.reduce((sum, w, i) => sum + w * p[i * 2 + axis], 0)) as Point;
    };
    const drop = cubic(n.slice(0, 8));
    const samples = Array.from({ length: 201 }, (_, i) => drop(i / 200));

    // Centre of the crown arc, on the side the head is (below the arc).
    const [x1, y1, r, , , , , x2, y2] = n.slice(6, 15);
    const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
    const chord = Math.hypot(x2 - x1, y2 - y1);
    const h = Math.sqrt(r * r - (chord / 2) ** 2);
    const centre: Point = [mx + ((y2 - y1) / chord) * h, my - ((x2 - x1) / chord) * h];
    expect(centre[1]).toBeGreaterThan(y1);

    // It leaves the crown arc without a kink: the last handle runs along the arc.
    const handle: Point = [n[6] - n[4], n[7] - n[5]];
    const radius: Point = [x1 - centre[0], y1 - centre[1]];
    const cosine =
      (handle[0] * radius[0] + handle[1] * radius[1]) /
      (Math.hypot(...handle) * Math.hypot(...radius));
    expect(Math.abs(cosine)).toBeLessThan(0.01);

    // It follows the head's curve at a near constant offset instead of bulging out.
    samples.forEach(([x, y]) => {
      expect(Math.abs(Math.hypot(x - centre[0], y - centre[1]) - r)).toBeLessThan(9);
    });

    // It never gets out past the near ear, whose tip is the head's outermost point there.
    const tip: Point = [629.5, 118.8];
    samples.forEach(([x]) => expect(x).toBeLessThan(tip[0] - 8));

    // It crosses the inner edge of the near ear, so it goes behind the ear, not round it.
    const earEdge = cubic([629.5, 118.8, 617.9, 116.9, 587.5, 133, 585, 136.3]);
    const edge = Array.from({ length: 201 }, (_, i) => earEdge(i / 200));
    const gap = Math.min(
      ...samples.flatMap(([x, y]) => edge.map(([ex, ey]) => Math.hypot(x - ex, y - ey))),
    );
    expect(gap).toBeLessThan(1);

    // It ends on top of the near speaker's shell, below the base of the ear.
    const [endX, endY] = samples[0];
    expect(endX).toBeGreaterThan(605);
    expect(endX).toBeLessThan(630);
    expect(endY).toBeGreaterThan(136);
    expect(endY).toBeLessThan(146);
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
        if (Math.abs(x2 - x1) > 3) {
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

  it("starts every line at the screen's right edge and indents it from there", () => {
    const rest = shown(screenAt(SCREEN_LOOP.openS));
    const fromRight = distanceToEdge(CORNERS[1], CORNERS[2]);
    const fromLeft = distanceToEdge(CORNERS[0], CORNERS[3]);

    // Every token starts at its right end and runs towards the left.
    rest.forEach(({ x1, x2 }) => expect(x2).toBeLessThan(x1));

    // Distance of each line's first token, its rightmost one, from the right edge.
    const sameLine = (a: NonNullable<TokenSpot>, b: NonNullable<TokenSpot>) =>
      Math.abs(a.y1 - b.y1) < 4;
    const firsts = rest.filter(
      (spot) => !rest.some((other) => other !== spot && sameLine(other, spot) && other.x1 > spot.x1),
    );
    const starts = firsts.map(({ x1, y1 }) => fromRight([x1, y1]));
    expect(starts.length).toBeGreaterThan(5);
    expect(Math.min(...starts)).toBeGreaterThan(8);
    expect(Math.min(...starts)).toBeLessThan(16);
    // Indented lines start further left, by whole indent steps.
    expect(Math.max(...starts)).toBeGreaterThan(Math.min(...starts) + 20);
    // The ragged ends of the lines are on the left, well away from the left edge.
    const ends = rest.filter(
      (spot) => !rest.some((other) => other !== spot && sameLine(other, spot) && other.x2 < spot.x2),
    );
    ends.forEach(({ x2, y2 }) => expect(fromLeft([x2, y2])).toBeGreaterThan(20));
  });

  it("puts the highlighted keywords at the start of their lines, on the right", () => {
    const { container } = render(<BongoCat />);
    const lines = Array.from(container.querySelectorAll("[data-loop='screen'] line")).filter(
      (line) => !line.hasAttribute("visibility"),
    );
    const accents = lines.filter((line) => /codeAccent/.test(line.getAttribute("class") ?? ""));
    expect(accents.length).toBeGreaterThan(0);
    const x1 = (line: Element) => Number(line.getAttribute("x1"));
    const y1 = (line: Element) => Number(line.getAttribute("y1"));
    accents.forEach((accent) => {
      const row = lines.filter((line) => Math.abs(y1(line) - y1(accent)) < 4);
      // At most one plain token comes before the keyword, to its right.
      expect(row.filter((line) => x1(line) > x1(accent)).length).toBeLessThanOrEqual(1);
      expect(row.length).toBeGreaterThan(1);
    });
  });

  it("opens the loop on the still drawing and types each new line from its right end", () => {
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
    // started: it is anchored at its start near the right edge and grows
    // leftwards, towards the left edge.
    const early = screenAt(stepS + scrollS + 0.05);
    const later = screenAt(stepS + scrollS + 0.1);
    const typing = early
      .map((spot, index) => ({ spot, next: later[index], was: still[index] }))
      .filter(({ spot, was }) => spot && !was);
    expect(typing).toHaveLength(1);
    const [{ spot, next }] = typing;
    expect(next!.x1).toBeCloseTo(spot!.x1, 1);
    expect(next!.y1).toBeCloseTo(spot!.y1, 1);
    expect(next!.x2).toBeLessThan(spot!.x2);
    expect(spot!.x2).toBeLessThan(spot!.x1);
    // It starts much nearer the right edge than the left one.
    const start: Point = [spot!.x1, spot!.y1];
    expect(distanceToEdge(CORNERS[1], CORNERS[2])(start) * 2).toBeLessThan(
      distanceToEdge(CORNERS[0], CORNERS[3])(start),
    );

    // Once the line is done, its later tokens sit further left than its first.
    const done = screenAt(2 * stepS - 0.05);
    const row = done
      .map((spot, index) => ({ spot, index }))
      .filter(({ spot, index }) => spot && !still[index] && Math.abs(spot.y1 - next!.y1) < 12);
    expect(row.length).toBeGreaterThan(1);
    for (let i = 1; i < row.length; i += 1) {
      expect(row[i].spot!.x1).toBeLessThan(row[i - 1].spot!.x2);
    }
  });

  it("loops seamlessly", () => {
    const { loopS } = SCREEN_LOOP;
    expect(screenAt(loopS + 0.37)).toEqual(screenAt(0.37));
    expect(screenAt(loopS - 1e-6).map((spot) => spot !== null)).toEqual(
      screenAt(0).map((spot) => spot !== null),
    );
  });
});

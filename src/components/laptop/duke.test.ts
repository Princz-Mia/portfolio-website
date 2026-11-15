import { describe, expect, it, vi } from "vitest";
import {
  BEAN_BONUS,
  DUKE_X,
  MAX_SPEED,
  START_SPEED,
  STEP,
  UNITS_PER_POINT,
  WORLD_W,
  createGame,
  dukeBox,
  exceptionFor,
  overlaps,
  pickKind,
  random,
  readBest,
  score,
  spawnGap,
  step,
  writeBest,
  type DukeInput,
  type DukeState,
  type Thing,
} from "./duke";

const idle: DukeInput = { jump: false, duck: false };

function run(state: DukeState, seconds: number, input: DukeInput = idle): DukeState {
  let s = state;
  for (let i = 0; i < Math.round(seconds / STEP); i++) s = step(s, STEP, input);
  return s;
}

/** A game with nothing on screen and nothing due to spawn for a long while. */
function emptyGame(): DukeState {
  return { ...createGame(1), nextSpawn: Number.POSITIVE_INFINITY };
}

function thing(kind: Thing["kind"], x: number, y = 0, extra: Partial<Thing> = {}): Thing {
  const sizes = {
    npe: [26, 26],
    bug: [26, 15],
    spikes: [42, 18],
    brace: [16, 18],
    tomb: [28, 36],
    bean: [12, 10],
  };
  const [w, h] = sizes[kind];
  return { id: 99, kind, x, y, w, h, vx: 0, ...extra };
}

describe("random", () => {
  it("is repeatable for a seed and stays in [0, 1)", () => {
    let seed = 42;
    const first: number[] = [];
    for (let i = 0; i < 200; i++) {
      let value: number;
      [value, seed] = random(seed);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      first.push(value);
    }
    let again = 42;
    for (const value of first) {
      let repeat: number;
      [repeat, again] = random(again);
      expect(repeat).toBe(value);
    }
  });
});

describe("step", () => {
  it("runs, counts score and speeds up over time", () => {
    const later = run(emptyGame(), 10);
    expect(later.phase).toBe("playing");
    expect(later.speed).toBeGreaterThan(START_SPEED);
    expect(later.distance).toBeGreaterThan(START_SPEED * 10);
    expect(score(later)).toBe(Math.floor(later.distance / UNITS_PER_POINT));
    expect(run(emptyGame(), 600).speed).toBe(MAX_SPEED);
  });

  it("does not change the state it was given", () => {
    const start = { ...emptyGame(), things: [thing("npe", 300)] };
    const snapshot = structuredClone(start);
    step(start, STEP, { jump: true, duck: false });
    expect(start).toEqual(snapshot);
  });

  it("jumps from the ground and lands again", () => {
    let s = step(emptyGame(), STEP, { jump: false, jumpPressed: true, duck: false });
    expect(s.y).toBeGreaterThan(0);
    let peak = 0;
    for (let i = 0; i < 120; i++) {
      s = step(s, STEP, idle);
      peak = Math.max(peak, s.y);
    }
    expect(peak).toBeGreaterThan(50);
    expect(s.y).toBe(0);
    expect(s.vy).toBe(0);
  });

  it("jumps a little higher while the jump is held", () => {
    const peakOf = (hold: boolean) => {
      let s = step(emptyGame(), STEP, { jump: true, duck: false });
      let peak = 0;
      for (let i = 0; i < 120; i++) {
        s = step(s, STEP, { jump: hold && i < 30, duck: false });
        peak = Math.max(peak, s.y);
        if (s.y === 0) break;
      }
      return peak;
    };
    const tap = peakOf(false);
    const held = peakOf(true);
    expect(held).toBeGreaterThan(tap * 1.15);
    expect(held).toBeLessThan(tap * 2);
  });

  it("ducks to a lower hitbox and drops quickly when ducking in the air", () => {
    const ducked = step(emptyGame(), STEP, { jump: false, duck: true });
    expect(dukeBox(ducked).h).toBeLessThan(dukeBox(emptyGame()).h);

    const up = run(step(emptyGame(), STEP, { jump: true, duck: false }), 0.1);
    const floating = run(up, 0.15);
    const dropping = run(up, 0.15, { jump: false, duck: true });
    expect(dropping.y).toBeLessThan(floating.y);
  });

  it("ends the game on hitting a crate and names the exception", () => {
    const start = { ...emptyGame(), things: [thing("npe", DUKE_X + 30)] };
    const end = run(start, 0.5);
    expect(end.phase).toBe("over");
    expect(end.cause?.kind).toBe("npe");
    expect(exceptionFor(end.cause)).toBe("java.lang.NullPointerException");
    // A finished game stays finished.
    expect(step(end, STEP, { jump: true, duck: false })).toBe(end);
  });

  it("clears a crate with a well-timed jump", () => {
    let s: DukeState = { ...emptyGame(), things: [thing("npe", DUKE_X + 90)] };
    s = step(s, STEP, { jump: false, jumpPressed: true, duck: false });
    s = run(s, 1);
    expect(s.phase).toBe("playing");
  });

  it("passes under a flying brace while ducking but not standing", () => {
    const brace = thing("brace", DUKE_X + 40, 31, { glyph: "{" });
    const standing = run({ ...emptyGame(), things: [brace] }, 0.5);
    expect(standing.phase).toBe("over");
    expect(exceptionFor(standing.cause)).toBe('java.lang.Error: Syntax error on token "{"');

    const ducking = run({ ...emptyGame(), things: [brace] }, 0.5, { jump: false, duck: true });
    expect(ducking.phase).toBe("playing");
  });

  it("picks up coffee beans for a bonus", () => {
    const start = { ...emptyGame(), things: [thing("bean", DUKE_X + 20, 10)] };
    const after = run(start, 0.3);
    expect(after.beans).toBe(1);
    expect(after.things).toHaveLength(0);
    expect(score(after)).toBe(Math.floor(after.distance / UNITS_PER_POINT) + BEAN_BONUS);
  });

  it("forgets things once they leave the screen", () => {
    const start = { ...emptyGame(), y: 200, vy: 0, things: [thing("npe", -44)] };
    expect(step(start, STEP, idle).things).toHaveLength(0);
  });

  it("spawns the same course for the same seed, and a different one for another", () => {
    const course = (seed: number) => {
      let s = createGame(seed);
      const seen: string[] = [];
      // Fly high above everything so the game never ends.
      for (let i = 0; i < 60 * 40; i++) {
        s = step({ ...s, y: 500, vy: 0 }, STEP, idle);
        for (const t of s.things) {
          const key = `${t.id}:${t.kind}`;
          if (!seen.includes(key)) seen.push(key);
        }
      }
      return seen;
    };
    expect(course(7)).toEqual(course(7));
    expect(course(7)).not.toEqual(course(8));
    expect(course(7).length).toBeGreaterThan(10);
  });

  it("spawns things off the right edge", () => {
    const s = run({ ...createGame(3), y: 500, nextSpawn: 1 }, STEP);
    expect(s.things.length).toBeGreaterThan(0);
    expect(s.things[0].x).toBeGreaterThan(WORLD_W - 20);
  });
});

describe("spawning rules", () => {
  it("brings in harder obstacles as the score grows", () => {
    const kinds = (points: number) =>
      new Set(Array.from({ length: 100 }, (_, i) => pickKind(i / 100, points)));
    expect([...kinds(0)].sort()).toEqual(["bug", "npe"]);
    expect(kinds(150).has("brace")).toBe(true);
    expect(kinds(150).has("tomb")).toBe(false);
    expect(kinds(400).has("tomb")).toBe(true);
  });

  it("always leaves room to land between obstacles, more at speed", () => {
    expect(spawnGap(START_SPEED, 0)).toBeGreaterThan(START_SPEED * 0.5);
    expect(spawnGap(MAX_SPEED, 0)).toBeGreaterThan(spawnGap(START_SPEED, 0));
    expect(spawnGap(START_SPEED, 1)).toBeGreaterThan(spawnGap(START_SPEED, 0));
  });
});

describe("collisions", () => {
  it("forgives a graze at the edges", () => {
    const a = { x: 0, y: 0, w: 20, h: 20 };
    expect(overlaps(a, { x: 18, y: 0, w: 20, h: 20 })).toBe(false);
    expect(overlaps(a, { x: 10, y: 0, w: 20, h: 20 })).toBe(true);
  });
});

describe("high score storage", () => {
  it("reads a stored score and treats junk, absence and errors as zero", () => {
    expect(readBest({ getItem: () => "123" }, "k")).toBe(123);
    expect(readBest({ getItem: () => "nope" }, "k")).toBe(0);
    expect(readBest({ getItem: () => null }, "k")).toBe(0);
    expect(readBest(null, "k")).toBe(0);
    expect(
      readBest(
        {
          getItem: () => {
            throw new DOMException("blocked", "SecurityError");
          },
        },
        "k",
      ),
    ).toBe(0);
  });

  it("writes a score and ignores a storage that refuses it", () => {
    const setItem = vi.fn();
    writeBest({ setItem }, "k", 41.7);
    expect(setItem).toHaveBeenCalledWith("k", "41");
    expect(() =>
      writeBest(
        {
          setItem: () => {
            throw new DOMException("full", "QuotaExceededError");
          },
        },
        "k",
        1,
      ),
    ).not.toThrow();
  });
});

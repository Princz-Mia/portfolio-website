/**
 * Duke runner: an endless runner starring Duke, the Java mascot. This module
 * is the whole game without any drawing: state, one step of the simulation,
 * spawning from a seeded random generator, and collisions. Everything is in
 * world units on a WORLD_W x WORLD_H field with the ground at GROUND_Y; heights
 * are measured upwards from the ground.
 */

export const WORLD_W = 600;
export const WORLD_H = 200;
/** The ground line, in canvas coordinates from the top. */
export const GROUND_Y = 170;

/** Fixed simulation step, in seconds. */
export const STEP = 1 / 60;

export const DUKE_X = 64;
export const DUKE_STAND = { w: 28, h: 46 } as const;
export const DUKE_DUCK = { w: 40, h: 26 } as const;

export const START_SPEED = 300;
export const MAX_SPEED = 780;
/** Speed gained per second of play. */
export const ACCEL = 7;

const JUMP_SPEED = 560;
const GRAVITY = 2200;
/** Gravity while the jump is held on the way up, for a slightly higher jump. */
const HOLD_GRAVITY = GRAVITY * 0.5;
/** How long holding the jump keeps gravity low. */
const MAX_HOLD = 0.16;
/** Gravity while ducking in the air: a quick drop back to the ground. */
const DROP_GRAVITY = GRAVITY * 2.6;

/** World units run per point of score. */
export const UNITS_PER_POINT = 40;
export const BEAN_BONUS = 10;

/** Hitboxes are shrunk by this much on each side, so near misses feel fair. */
const FORGIVE = 3;

export type ObstacleKind = "npe" | "bug" | "spikes" | "brace" | "tomb";
export type ThingKind = ObstacleKind | "bean";

export type Thing = {
  id: number;
  kind: ThingKind;
  /** Left edge, in world units. */
  x: number;
  /** Bottom edge, as height above the ground. */
  y: number;
  w: number;
  h: number;
  /** Extra speed towards Duke on top of the scrolling ground (bugs scuttle, braces fly). */
  vx: number;
  /** The character a flying brace draws: "{", "}" or ";". */
  glyph?: string;
};

export type DukeState = {
  phase: "playing" | "over";
  /** Seconds played. */
  time: number;
  /** World units run so far. */
  distance: number;
  speed: number;
  /** Coffee beans picked up. */
  beans: number;
  /** Duke's feet above the ground. */
  y: number;
  vy: number;
  ducking: boolean;
  /** Seconds the current jump has been held. */
  held: number;
  things: Thing[];
  /** Distance at which the next thing appears. */
  nextSpawn: number;
  nextId: number;
  /** State of the random generator. */
  seed: number;
  /** What ended the game. */
  cause: Thing | null;
};

export type DukeInput = {
  /** The jump key or tap is held. */
  jump: boolean;
  /** The jump was pressed since the last step, so a very short tap still counts. */
  jumpPressed?: boolean;
  /** The duck key is held. */
  duck: boolean;
};

export type Box = { x: number; y: number; w: number; h: number };

/** One draw from a mulberry32 generator: a number in [0, 1) and the next state. */
export function random(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** A fresh game, running from the start. */
export function createGame(seed: number): DukeState {
  return {
    phase: "playing",
    time: 0,
    distance: 0,
    speed: START_SPEED,
    beans: 0,
    y: 0,
    vy: 0,
    ducking: false,
    held: 0,
    things: [],
    nextSpawn: 520,
    nextId: 1,
    seed: seed | 0,
    cause: null,
  };
}

export function score(state: DukeState): number {
  return Math.floor(state.distance / UNITS_PER_POINT) + state.beans * BEAN_BONUS;
}

export function onGround(state: DukeState): boolean {
  return state.y <= 0 && state.vy <= 0;
}

/** Duke's hitbox: x from the left, y as height of the bottom edge above the ground. */
export function dukeBox(state: DukeState): Box {
  const size = state.ducking && onGround(state) ? DUKE_DUCK : DUKE_STAND;
  return { x: DUKE_X, y: state.y, w: size.w, h: size.h };
}

export function overlaps(a: Box, b: Box, inset = FORGIVE): boolean {
  return (
    a.x + inset < b.x + b.w - inset &&
    b.x + inset < a.x + a.w - inset &&
    a.y + inset < b.y + b.h - inset &&
    b.y + inset < a.y + a.h - inset
  );
}

/** The exception a game over prints, after `Exception in thread "main"`. */
export function exceptionFor(cause: Thing | null): string {
  switch (cause?.kind) {
    case "npe":
      return "java.lang.NullPointerException";
    case "bug":
      return "java.lang.IllegalStateException: found a bug";
    case "spikes":
      return "java.lang.StackOverflowError";
    case "brace":
      return `java.lang.Error: Syntax error on token "${cause.glyph ?? ";"}"`;
    case "tomb":
      return "java.lang.UnsupportedOperationException: @Deprecated";
    default:
      return "java.lang.RuntimeException";
  }
}

type Template = Omit<Thing, "id" | "x">;

const TEMPLATES: Record<ObstacleKind, Template> = {
  npe: { kind: "npe", y: 0, w: 26, h: 26, vx: 0 },
  bug: { kind: "bug", y: 0, w: 26, h: 15, vx: 50 },
  spikes: { kind: "spikes", y: 0, w: 42, h: 18, vx: 0 },
  // Flies at head height: duck under it (or clear it with a high jump).
  brace: { kind: "brace", y: 31, w: 16, h: 18, vx: 70 },
  tomb: { kind: "tomb", y: 0, w: 28, h: 36, vx: 0 },
};

const GLYPHS = ["{", "}", ";"];

/** Which obstacle comes next, from a draw in [0, 1) and the score so far. */
export function pickKind(roll: number, points: number): ObstacleKind {
  const weights: [ObstacleKind, number][] = [
    ["npe", 3],
    ["bug", 3],
    ["spikes", points >= 60 ? 2 : 0],
    ["brace", points >= 120 ? 2.5 : 0],
    ["tomb", points >= 250 ? 0.8 : 0],
  ];
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let left = roll * total;
  for (const [kind, w] of weights) {
    if (left < w) return kind;
    left -= w;
  }
  return "npe";
}

/** Distance from one spawn to the next: always room to land and jump again. */
export function spawnGap(speed: number, roll: number): number {
  const airtime = (2 * JUMP_SPEED) / GRAVITY;
  const minimum = speed * airtime + 140;
  return minimum + roll * (220 + speed * 0.5);
}

function spawn(state: DukeState): void {
  let roll: number;
  [roll, state.seed] = random(state.seed);
  const kind = pickKind(roll, score(state));
  const thing: Thing = { ...TEMPLATES[kind], id: state.nextId++, x: WORLD_W + 10 };
  if (kind === "brace") {
    [roll, state.seed] = random(state.seed);
    thing.glyph = GLYPHS[Math.floor(roll * GLYPHS.length)];
  }
  state.things.push(thing);

  // Now and then a coffee bean floats above the obstacle, worth a jump.
  [roll, state.seed] = random(state.seed);
  if (roll < 0.35 && kind !== "brace") {
    state.things.push({
      id: state.nextId++,
      kind: "bean",
      x: thing.x + thing.w / 2 - 6,
      y: thing.h + 38,
      w: 12,
      h: 10,
      vx: 0,
    });
  }

  [roll, state.seed] = random(state.seed);
  state.nextSpawn = state.distance + spawnGap(state.speed, roll);
}

/**
 * Advances the game by `dt` seconds. Returns a new state and leaves the old
 * one untouched; a finished game is returned as it is.
 */
export function step(prev: DukeState, dt: number, input: DukeInput): DukeState {
  if (prev.phase === "over") return prev;
  const state: DukeState = { ...prev, things: prev.things.map((t) => ({ ...t })) };

  state.time += dt;
  state.speed = Math.min(MAX_SPEED, state.speed + ACCEL * dt);
  const run = state.speed * dt;
  state.distance += run;

  // Jumping and ducking.
  const grounded = onGround(state);
  state.ducking = input.duck;
  if (grounded && !input.duck && (input.jump || input.jumpPressed)) {
    state.vy = JUMP_SPEED;
    state.held = 0;
  }
  if (!onGround(state)) {
    let gravity = GRAVITY;
    if (input.duck) gravity = DROP_GRAVITY;
    else if (input.jump && state.vy > 0 && state.held < MAX_HOLD) gravity = HOLD_GRAVITY;
    if (input.jump) state.held += dt;
    else state.held = MAX_HOLD;
    state.vy -= gravity * dt;
    state.y += state.vy * dt;
    if (state.y <= 0) {
      state.y = 0;
      state.vy = 0;
    }
  }

  // Move, spawn and forget what has left the screen.
  for (const thing of state.things) thing.x -= run + thing.vx * dt;
  state.things = state.things.filter((t) => t.x + t.w > -20);
  if (state.distance >= state.nextSpawn) spawn(state);

  // Collisions.
  const duke = dukeBox(state);
  const kept: Thing[] = [];
  for (const thing of state.things) {
    if (!overlaps(duke, thing)) {
      kept.push(thing);
    } else if (thing.kind === "bean") {
      state.beans += 1;
    } else {
      kept.push(thing);
      state.phase = "over";
      state.cause = thing;
    }
  }
  state.things = kept;
  return state;
}

/** Reads a stored high score; storage can be missing, blocked or hold junk. */
export function readBest(storage: Pick<Storage, "getItem"> | null | undefined, key: string) {
  try {
    const value = Number(storage?.getItem(key));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

/** Stores a high score; a failure (private mode, quota, blocked storage) is ignored. */
export function writeBest(
  storage: Pick<Storage, "setItem"> | null | undefined,
  key: string,
  value: number,
): void {
  try {
    storage?.setItem(key, String(Math.floor(value)));
  } catch {
    // The best score then lasts only for this visit.
  }
}

/*
 * Pure helpers for the chalkboard: seeded randomness, chalk and sponge marks,
 * the writing script and its timing. Drawing helpers take the 2D context they
 * paint on and keep no state of their own.
 *
 * Everything works in board units: the slate is BOARD_W x BOARD_H, with its top
 * left corner at BOARD_X, BOARD_Y in the drawing's 480 x 400 view box.
 */

export type Pt = { x: number; y: number };
export type Rng = () => number;
export type Tool = "chalk" | "sponge";

export const VIEW_W = 480;
export const VIEW_H = 400;
export const BOARD_X = 78;
export const BOARD_Y = 68;
export const BOARD_W = 316;
export const BOARD_H = 194;

/** Off-white chalk and a soft pink chalk for the doodle, as "r,g,b". */
export const CHALK_RGB = "236,231,220";
export const PINK_RGB = "222,160,168";

/** The handwriting: font size and each line's start and baseline. */
export const WRITING_SIZE = 24;
export const WRITING_LINES: readonly { text: string; x: number; baseline: number }[] = [
  { text: "class Hello {", x: 22, baseline: 46 },
  { text: "// ideas first,", x: 50, baseline: 84 },
  { text: "// then code", x: 50, baseline: 122 },
  { text: "}", x: 22, baseline: 160 },
];
export const HEART_CENTER: Pt = { x: 268, y: 138 };
export const HEART_SIZE = 17;

/** What the board says, for assistive technology. */
export const WRITING_LABEL =
  "A chalkboard on an easel. Written in chalk: class Hello, with the comments " +
  "ideas first, then code, underlined and finished with a small heart.";

/** What is on the board: the written program, visitors' chalk, and sponge wipes over either. */
export type BoardContent = { writing: boolean; doodles: boolean; smudged: boolean };

/** Describes the board's current content for its accessible name. */
export function describeBoard({ writing, doodles, smudged }: BoardContent): string {
  if (!writing && !doodles) return "A blank chalkboard on an easel.";
  if (!writing) {
    return smudged
      ? "A chalkboard on an easel with chalk doodles, partly wiped away."
      : "A chalkboard on an easel with chalk doodles.";
  }
  if (!smudged && !doodles) return WRITING_LABEL;
  const extras = [doodles ? "chalk doodles added" : "", smudged ? "partly wiped away" : ""]
    .filter(Boolean)
    .join(" and ");
  return `A chalkboard on an easel with the program class Hello written in chalk, ${extras}.`;
}

/** A small, fast, seedable generator (mulberry32) returning numbers in [0, 1). */
export function mulberry32(seed: number): Rng {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An independent generator for one segment of a seeded stroke. */
export function segmentRng(seed: number, index: number): Rng {
  return mulberry32((seed ^ Math.imul(index + 1, 0x9e3779b1)) | 0);
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const distance = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

/** Maps a pointer position to board units using the canvas's on-screen box. */
export function toBoard(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): Pt {
  const w = rect.width || 1;
  const h = rect.height || 1;
  return {
    x: ((clientX - rect.left) * BOARD_W) / w,
    y: ((clientY - rect.top) * BOARD_H) / h,
  };
}

/* ------------------------------------------------------------------ */
/* Chalk                                                               */
/* ------------------------------------------------------------------ */

export type ChalkMarks = {
  alpha: number;
  lineWidth: number;
  /** Tiny holes punched out of the stroke so the slate shows through. */
  pits: { x: number; y: number; w: number; h: number; alpha: number }[];
  /** Faint specks of dust that fall beside the stroke. */
  dust: { x: number; y: number; size: number; alpha: number }[];
};

/**
 * The marks one chalk segment leaves: a body with jittered opacity and width,
 * grain pits scattered along it and, now and then, a speck of dust.
 */
export function chalkMarks(a: Pt, b: Pt, rnd: Rng, width = 2.4): ChalkMarks {
  const alpha = 0.6 + rnd() * 0.3;
  const lineWidth = width * (0.85 + rnd() * 0.3);
  const count = Math.max(1, Math.ceil(distance(a, b) * 1.1));
  const spread = lineWidth * 1.3;
  const pits: ChalkMarks["pits"] = [];
  for (let i = 0; i < count; i++) {
    const t = rnd();
    pits.push({
      x: lerp(a.x, b.x, t) + (rnd() - 0.5) * spread,
      y: lerp(a.y, b.y, t) + (rnd() - 0.5) * spread,
      w: 0.35 + rnd() * 0.55,
      h: 0.3 + rnd() * 0.4,
      alpha: 0.35 + rnd() * 0.5,
    });
  }
  const dust: ChalkMarks["dust"] = [];
  if (rnd() < 0.3) {
    dust.push({
      x: b.x + (rnd() - 0.5) * 6,
      y: b.y + (rnd() - 0.5) * 6,
      size: 0.5 + rnd() * 0.5,
      alpha: 0.12 + rnd() * 0.1,
    });
  }
  return { alpha, lineWidth, pits, dust };
}

/** Paints one chalk segment from a to b. */
export function drawChalkSegment(
  ctx: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  rnd: Rng,
  rgb = CHALK_RGB,
  width = 2.4,
) {
  const marks = chalkMarks(a, b, rnd, width);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = `rgba(${rgb},${marks.alpha})`;
  ctx.lineWidth = marks.lineWidth;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  ctx.globalCompositeOperation = "destination-out";
  for (const pit of marks.pits) {
    ctx.fillStyle = `rgba(0,0,0,${pit.alpha})`;
    ctx.fillRect(pit.x, pit.y, pit.w, pit.h);
  }
  ctx.restore();

  for (const speck of marks.dust) {
    ctx.fillStyle = `rgba(${rgb},${speck.alpha})`;
    ctx.fillRect(speck.x, speck.y, speck.size, speck.size);
  }
}

/** Paints a polyline as chalk, one seeded segment at a time from `from`. */
export function drawChalkPolyline(
  ctx: CanvasRenderingContext2D,
  points: readonly Pt[],
  seed: number,
  from = 0,
  to = points.length - 1,
  rgb = CHALK_RGB,
  width = 2.4,
) {
  for (let i = from; i < to; i++) {
    drawChalkSegment(ctx, points[i], points[i + 1], segmentRng(seed, i), rgb, width);
  }
}

/* ------------------------------------------------------------------ */
/* Sponge                                                              */
/* ------------------------------------------------------------------ */

/**
 * Centres of the soft dabs a sponge leaves moving from a to b, spaced closely
 * enough that fast drags leave no gaps. The start point itself is excluded, as
 * the previous segment already stamped it; a zero-length move stamps once.
 */
export function spongeDabs(a: Pt, b: Pt, radius: number): Pt[] {
  const steps = Math.max(1, Math.ceil(distance(a, b) / (radius * 0.35)));
  const dabs: Pt[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    dabs.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
  }
  return dabs;
}

/**
 * Wipes from a to b with an oval felt sponge. A single pass leaves a faint ghost,
 * as a dry sponge does, and a few specks of dust trail behind it.
 */
export function drawSponge(
  ctx: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  rnd: Rng,
  radius = 14,
  strength = 0.8,
) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  for (const dab of spongeDabs(a, b, radius)) {
    ctx.save();
    ctx.translate(dab.x, dab.y);
    ctx.scale(1.5, 1);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, `rgba(0,0,0,${strength})`);
    gradient.addColorStop(0.7, `rgba(0,0,0,${strength * 0.6})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }
  ctx.restore();

  const specks = rnd() < 0.5 ? 1 : 2;
  for (let i = 0; i < specks; i++) {
    ctx.fillStyle = `rgba(${CHALK_RGB},${0.05 + rnd() * 0.05})`;
    const size = 0.6 + rnd() * 0.9;
    ctx.fillRect(
      b.x + (rnd() - 0.5) * radius * 2.6,
      b.y + (rnd() - 0.5) * radius * 1.4,
      size,
      size,
    );
  }
}

/** Paints a polyline as sponge strokes, one seeded segment at a time from `from`. */
export function drawSpongePolyline(
  ctx: CanvasRenderingContext2D,
  points: readonly Pt[],
  seed: number,
  from = 0,
  to = points.length - 1,
) {
  for (let i = from; i < to; i++) {
    drawSponge(ctx, points[i], points[i + 1], segmentRng(seed, i));
  }
}

/** The zigzag the sponge follows when the whole board is wiped. */
export function sweepPath(): Pt[] {
  const rows = [26, 70, 114, 158, 182];
  const points: Pt[] = [{ x: 8, y: 10 }];
  rows.forEach((y, i) => {
    const leftToRight = i % 2 === 0;
    points.push({ x: leftToRight ? BOARD_W - 10 : 10, y });
    if (i < rows.length - 1) {
      points.push({ x: leftToRight ? BOARD_W - 18 : 18, y: y + 22 });
    }
  });
  return points;
}

export type Smear = { points: Pt[]; width: number; alpha: number };

/** Faint arcs of dust a sponge leaves behind after wiping the whole board. */
export function residueSmears(rnd: Rng): Smear[] {
  const smears: Smear[] = [];
  const count = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < count; i++) {
    const cx = 30 + rnd() * (BOARD_W - 60);
    const cy = 22 + rnd() * (BOARD_H - 44);
    const span = 40 + rnd() * 70;
    const bow = (rnd() - 0.5) * 18;
    const points: Pt[] = [];
    for (let j = 0; j <= 12; j++) {
      const t = j / 12;
      points.push({
        x: cx - span / 2 + span * t,
        y: cy + Math.sin(Math.PI * t) * bow,
      });
    }
    smears.push({ points, width: 10 + rnd() * 10, alpha: 0.018 + rnd() * 0.02 });
  }
  return smears;
}

/** Paints the dust residue left after a full wipe. */
export function drawResidue(ctx: CanvasRenderingContext2D, rnd: Rng) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const smear of residueSmears(rnd)) {
    ctx.strokeStyle = `rgba(${CHALK_RGB},${smear.alpha})`;
    ctx.lineWidth = smear.width;
    ctx.beginPath();
    smear.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Texture and handwriting                                             */
/* ------------------------------------------------------------------ */

/**
 * Alpha values for a square grain tile: most pixels clear, some punched deep and
 * some lightly, so chalk drawn through it looks dusty.
 */
export function noiseAlpha(size: number, rnd: Rng): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(size * size);
  for (let i = 0; i < alpha.length; i++) {
    const roll = rnd();
    if (roll < 0.2) {
      alpha[i] = 150 + rnd() * 105;
    } else if (roll < 0.42) {
      alpha[i] = 40 + rnd() * 60;
    }
  }
  return alpha;
}

export type Glyph = { char: string; x: number; dy: number; rotate: number };

/**
 * Places each character of a line at its measured offset with a small seeded
 * wobble in height and angle, so the text looks written by hand. `prefixWidths`
 * holds the measured width of the text before each character, which keeps the
 * font's kerning. Spaces are left out.
 */
export function layoutGlyphs(text: string, prefixWidths: readonly number[], rnd: Rng): Glyph[] {
  const glyphs: Glyph[] = [];
  for (let i = 0; i < text.length; i++) {
    const dy = (rnd() - 0.5) * 1.6;
    const rotate = (rnd() - 0.5) * 0.08;
    if (text[i] !== " ") {
      glyphs.push({ char: text[i], x: prefixWidths[i] ?? 0, dy, rotate });
    }
  }
  return glyphs;
}

/** A hand-drawn underline with a slight wave and an upturned end. */
export function underlinePoints(x0: number, x1: number, y: number): Pt[] {
  const points: Pt[] = [];
  const steps = Math.max(2, Math.ceil((x1 - x0) / 3));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: lerp(x0, x1, t),
      y: y + Math.sin(t * Math.PI * 1.4) * 1.4 - Math.max(0, t - 0.88) * 18,
    });
  }
  return points;
}

/** A heart drawn in one stroke, starting and ending at the dip at the top. */
export function heartPoints(center: Pt, size: number, steps = 48): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    // The classic heart curve, scaled so its width is about `size`.
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    points.push({ x: center.x + (x / 32) * size, y: center.y - (y / 32) * size });
  }
  return points;
}

/** Total length of a polyline. */
export function polylineLength(points: readonly Pt[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
  return length;
}

/** Cumulative length at each point of a polyline, starting at 0. */
export function cumulativeLengths(points: readonly Pt[]): number[] {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]));
  }
  return lengths;
}

/** The point a fraction `t` of the way along a polyline. */
export function pointAlong(points: readonly Pt[], t: number): Pt {
  if (points.length === 0) return { x: 0, y: 0 };
  const lengths = cumulativeLengths(points);
  const target = clamp01(t) * lengths[lengths.length - 1];
  for (let i = 1; i < points.length; i++) {
    if (lengths[i] >= target) {
      const span = lengths[i] - lengths[i - 1] || 1;
      const local = (target - lengths[i - 1]) / span;
      return {
        x: lerp(points[i - 1].x, points[i].x, local),
        y: lerp(points[i - 1].y, points[i].y, local),
      };
    }
  }
  return points[points.length - 1];
}

/* ------------------------------------------------------------------ */
/* Writing script                                                      */
/* ------------------------------------------------------------------ */

export type TextStep = {
  kind: "text";
  line: number;
  /** Left and right edge of the reveal, in board units. */
  x0: number;
  x1: number;
  baseline: number;
  start: number;
  duration: number;
};

export type StrokeStep = {
  kind: "stroke";
  points: Pt[];
  lengths: number[];
  rgb: string;
  seed: number;
  start: number;
  duration: number;
};

export type TravelStep = { kind: "travel"; from: Pt; to: Pt; start: number; duration: number };

export type Step = TextStep | StrokeStep | TravelStep;
export type Script = { steps: Step[]; duration: number };

/** Writing speeds in board units per second, and the pause of a pen lift. */
const TEXT_SPEED = 220;
const UNDERLINE_SPEED = 330;
const DOODLE_SPEED = 150;
const TRAVEL_SPEED = 650;
const LIFT_MS = 70;

/** Where the chalk tip sits while it writes a line, before any wobble. */
const textTipY = (baseline: number) => baseline - WRITING_SIZE * 0.32;

/**
 * Builds the writing timeline from the measured width of each line: the first
 * line, its underline, the remaining lines, then the heart, with short pen-lift
 * travels in between. Times are in milliseconds.
 */
export function buildScript(lineWidths: readonly number[]): Script {
  const steps: Step[] = [];
  let clock = 0;
  let tip: Pt | null = null;

  const travelTo = (to: Pt) => {
    if (tip) {
      const duration = LIFT_MS + (distance(tip, to) / TRAVEL_SPEED) * 1000;
      steps.push({ kind: "travel", from: tip, to, start: clock, duration });
      clock += duration;
    }
    tip = to;
  };

  const addStroke = (points: Pt[], speed: number, rgb: string, seed: number) => {
    travelTo(points[0]);
    const lengths = cumulativeLengths(points);
    const duration = (lengths[lengths.length - 1] / speed) * 1000;
    steps.push({ kind: "stroke", points, lengths, rgb, seed, start: clock, duration });
    clock += duration;
    tip = points[points.length - 1];
  };

  WRITING_LINES.forEach((line, index) => {
    const width = lineWidths[index] ?? 0;
    const x0 = line.x - 2;
    const x1 = line.x + width + 4;
    travelTo({ x: x0, y: textTipY(line.baseline) });
    const duration = ((x1 - x0) / TEXT_SPEED) * 1000;
    steps.push({ kind: "text", line: index, x0, x1, baseline: line.baseline, start: clock, duration });
    clock += duration;
    tip = { x: x1, y: textTipY(line.baseline) };

    if (index === 0) {
      const y = line.baseline + 7;
      addStroke(underlinePoints(line.x - 3, line.x + width + 6, y), UNDERLINE_SPEED, CHALK_RGB, 11);
    }
  });

  addStroke(heartPoints(HEART_CENTER, HEART_SIZE), DOODLE_SPEED, PINK_RGB, 23);
  return { steps, duration: clock };
}

/** Fraction of a step completed at time t. */
export function stepProgress(step: Step, t: number): number {
  return step.duration > 0 ? clamp01((t - step.start) / step.duration) : t >= step.start ? 1 : 0;
}

/** Where the reveal edge of a text step is at progress p. */
export function textRevealX(step: TextStep, p: number): number {
  return lerp(step.x0, step.x1, p);
}

/**
 * Where the chalk tip is at time t, or null once the writing is finished. Along
 * a line it bobs up and down as if forming letters; between strokes it lifts in
 * a shallow arc.
 */
export function tipAt(script: Script, t: number): Pt | null {
  if (t >= script.duration) return null;
  const step =
    script.steps.find((candidate) => t < candidate.start + candidate.duration) ??
    script.steps[script.steps.length - 1];
  if (!step) return null;
  const p = stepProgress(step, t);
  switch (step.kind) {
    case "text": {
      const x = textRevealX(step, p);
      const bob = Math.sin((x - step.x0) / 3.1) * WRITING_SIZE * 0.26;
      return { x, y: textTipY(step.baseline) + bob };
    }
    case "travel":
      return {
        x: lerp(step.from.x, step.to.x, p),
        y: lerp(step.from.y, step.to.y, p) - Math.sin(Math.PI * p) * 7,
      };
    case "stroke":
      return pointAlong(step.points, p);
  }
}

/**
 * The index of the last stroke point reached at progress p: segments up to it
 * are drawn. Uses the precomputed cumulative lengths.
 */
export function strokeReach(step: StrokeStep, p: number): number {
  const total = step.lengths[step.lengths.length - 1];
  if (p >= 1) return step.points.length - 1;
  const target = p * total;
  let index = 0;
  while (index + 1 < step.lengths.length && step.lengths[index + 1] <= target) index++;
  return index;
}

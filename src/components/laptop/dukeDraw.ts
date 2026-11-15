/**
 * Draws a Duke runner frame on a 2D canvas, in the site's drawing style: warm
 * grey monoline, flat paper and shade fills, a tint print-shadow behind each
 * shape and small oxblood accents. Everything is drawn in world units; the
 * caller sets the transform for the canvas size and pixel ratio.
 */

import {
  DUKE_DUCK,
  DUKE_STAND,
  DUKE_X,
  GROUND_Y,
  WORLD_H,
  WORLD_W,
  onGround,
  score,
  type DukeState,
  type Thing,
} from "./duke";

const C = {
  paper: "#f6f1ea",
  ink: "#8a7f76",
  inkStrong: "#6f655d",
  dark: "#3f3532",
  accent: "#a14d59",
  tint: "#f1e2dd",
  shade: "#ebe4da",
  white: "#ffffff",
};

const LINE = 1.7;
const SHADOW = { x: 2.5, y: 2 };

export type DrawOptions = {
  best: number;
  /** Font family for the score, read from the page so it matches the terminal. */
  font: string;
  /** Still frame: no bobbing or leg swing. */
  still: boolean;
};

const pad = (n: number) => String(n).padStart(5, "0");

/** Top of a thing on the canvas, from its height above the ground. */
const topOf = (y: number, h: number) => GROUND_Y - y - h;

function stroke(ctx: CanvasRenderingContext2D, color = C.ink, width = LINE) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Fills a path twice: a tint copy offset down-right, then the shape itself. */
function printed(ctx: CanvasRenderingContext2D, path: Path2D, fill: string) {
  ctx.save();
  ctx.translate(SHADOW.x, SHADOW.y);
  ctx.fillStyle = C.tint;
  ctx.fill(path);
  ctx.restore();
  ctx.fillStyle = fill;
  ctx.fill(path);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = LINE;
  ctx.stroke(path);
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y + r);
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  stroke(ctx, C.accent, 1.2);
}

function drawClouds(ctx: CanvasRenderingContext2D, distance: number) {
  const span = WORLD_W + 160;
  for (let i = 0; i < 3; i++) {
    const x = ((i * 230 + 120 - distance * 0.12) % span + span) % span - 80;
    const y = 34 + (i % 2) * 22;
    const cloud = new Path2D();
    cloud.moveTo(x, y + 8);
    cloud.arc(x + 10, y + 4, 8, Math.PI * 0.9, Math.PI * 1.75);
    cloud.arc(x + 26, y, 11, Math.PI * 1.15, Math.PI * 1.9);
    cloud.arc(x + 42, y + 5, 7, Math.PI * 1.3, Math.PI * 0.1);
    cloud.lineTo(x, y + 8);
    ctx.fillStyle = C.paper;
    ctx.fill(cloud);
    ctx.strokeStyle = C.tint;
    ctx.lineWidth = LINE;
    ctx.stroke(cloud);
  }
}

function drawGround(ctx: CanvasRenderingContext2D, distance: number) {
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(WORLD_W, GROUND_Y);
  ctx.lineCap = "round";
  stroke(ctx);
  // Pebbles and dashes that scroll by, so the ground reads as moving.
  const span = WORLD_W + 40;
  for (let i = 0; i < 14; i++) {
    const x = (((i * 97 + (i % 3) * 31 - distance) % span) + span) % span - 20;
    const y = GROUND_Y + 6 + ((i * 7) % 3) * 5;
    ctx.beginPath();
    if (i % 3 === 0) {
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = C.ink;
      ctx.fill();
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 6 + (i % 4) * 3, y);
      stroke(ctx, C.ink, 1.2);
    }
  }
}

/** Duke's outline: a rounded tooth shape, w wide and h tall, standing on (cx, bottom). */
function dukePath(cx: number, bottom: number, w: number, h: number): Path2D {
  const top = bottom - h;
  const half = w / 2;
  const path = new Path2D();
  path.moveTo(cx, top);
  path.bezierCurveTo(
    cx + half * 0.55,
    top + h * 0.12,
    cx + half * 1.08,
    bottom - h * 0.38,
    cx + half,
    bottom - h * 0.12,
  );
  path.quadraticCurveTo(cx, bottom + h * 0.02, cx - half, bottom - h * 0.12);
  path.bezierCurveTo(
    cx - half * 1.08,
    bottom - h * 0.38,
    cx - half * 0.55,
    top + h * 0.12,
    cx,
    top,
  );
  path.closePath();
  return path;
}

function drawDuke(ctx: CanvasRenderingContext2D, state: DukeState, still: boolean) {
  const ducking = state.ducking && onGround(state);
  const size = ducking ? DUKE_DUCK : DUKE_STAND;
  const cx = DUKE_X + size.w / 2;
  const bottom = GROUND_Y - state.y - 3;
  const h = size.h - 3;
  const top = bottom - h;
  const running = state.phase === "playing" && onGround(state) && !still;
  const stride = running ? (Math.floor(state.distance / 16) % 2 === 0 ? 1 : -1) : 0;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Feet, under the body.
  for (const side of [-1, 1]) {
    const lift = onGround(state) ? 0 : 2;
    const fx = cx + side * size.w * 0.22 + stride * side * 2.5;
    ctx.beginPath();
    ctx.ellipse(fx, bottom + 1 - lift, 4.2, 2.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.dark;
    ctx.fill();
  }

  // Arms: swinging while running, thrown up in a jump, pulled back in a duck.
  const armY = bottom - h * 0.42;
  const swing = stride * 4;
  const arms: [number, number, number, number][] = ducking
    ? [
        [cx - size.w * 0.38, armY, cx - size.w * 0.38 - 9, armY - 3],
        [cx + size.w * 0.38, armY, cx + size.w * 0.38 - 4, armY + 7],
      ]
    : !onGround(state)
      ? [
          [cx - size.w * 0.36, armY, cx - size.w * 0.36 - 8, armY - 11],
          [cx + size.w * 0.36, armY, cx + size.w * 0.36 + 8, armY - 11],
        ]
      : [
          [cx - size.w * 0.36, armY, cx - size.w * 0.36 - 7, armY + 3 + swing],
          [cx + size.w * 0.36, armY, cx + size.w * 0.36 + 7, armY + 3 - swing],
        ];
  for (const [x1, y1, x2, y2] of arms) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    stroke(ctx);
    ctx.beginPath();
    ctx.arc(x2, y2, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = C.white;
    ctx.fill();
    stroke(ctx, C.ink, 1.2);
  }

  // Body: white, with the dark head clipped to the top of the same shape.
  const body = dukePath(cx, bottom, size.w, h);
  printed(ctx, body, C.white);
  const headLine = top + h * 0.47;
  ctx.save();
  ctx.clip(body);
  ctx.beginPath();
  ctx.moveTo(cx - size.w, top - 2);
  ctx.lineTo(cx + size.w, top - 2);
  ctx.lineTo(cx + size.w, headLine - 2);
  ctx.quadraticCurveTo(cx, headLine + 4, cx - size.w, headLine - 2);
  ctx.closePath();
  ctx.fillStyle = C.dark;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = LINE;
  ctx.stroke(body);

  // The red nose, right on the edge of the head, with a highlight.
  const noseR = ducking ? 4 : 4.6;
  const noseY = headLine + 1;
  ctx.beginPath();
  ctx.arc(cx + (ducking ? 3 : 0), noseY, noseR, 0, Math.PI * 2);
  ctx.fillStyle = C.accent;
  ctx.fill();
  stroke(ctx, C.ink, 1.2);
  ctx.beginPath();
  ctx.arc(cx + (ducking ? 3 : 0) - 1.4, noseY - 1.5, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = C.white;
  ctx.fill();

  if (state.phase === "over") {
    ctx.fillStyle = C.accent;
    ctx.font = "700 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("!", cx + size.w * 0.7, top - 4);
  }
}

function drawCrate(ctx: CanvasRenderingContext2D, t: Thing, font: string) {
  const top = topOf(t.y, t.h);
  const box = new Path2D();
  box.roundRect(t.x, top, t.w, t.h, 2);
  printed(ctx, box, C.shade);
  ctx.beginPath();
  ctx.moveTo(t.x + 3, top + 5);
  ctx.lineTo(t.x + t.w - 3, top + 5);
  ctx.moveTo(t.x + 3, top + t.h - 4);
  ctx.lineTo(t.x + t.w - 3, top + t.h - 4);
  stroke(ctx, C.ink, 1.1);
  ctx.fillStyle = C.accent;
  ctx.font = `700 8px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NPE", t.x + t.w / 2, top + t.h / 2 + 0.5);
}

function drawBug(ctx: CanvasRenderingContext2D, t: Thing, time: number, still: boolean) {
  const top = topOf(t.y, t.h);
  const cy = top + t.h * 0.5;
  const step = still ? 0 : Math.floor(time * 14) % 2;
  // Legs first, so the shell sits on them.
  for (let i = 0; i < 3; i++) {
    const lx = t.x + 9 + i * 6;
    const kick = (i + step) % 2 === 0 ? 2 : -2;
    ctx.beginPath();
    ctx.moveTo(lx, cy + 2);
    ctx.lineTo(lx + kick, GROUND_Y - 0.5);
    stroke(ctx, C.ink, 1.2);
  }
  const shell = new Path2D();
  shell.ellipse(t.x + 15, cy, 10, 6, 0, 0, Math.PI * 2);
  printed(ctx, shell, C.dark);
  ctx.beginPath();
  ctx.moveTo(t.x + 15, cy - 6);
  ctx.lineTo(t.x + 15, cy + 6);
  stroke(ctx, C.paper, 1);
  ctx.beginPath();
  ctx.arc(t.x + 19, cy - 1.5, 1.6, 0, Math.PI * 2);
  ctx.fillStyle = C.accent;
  ctx.fill();
  // Head and feelers, facing Duke.
  ctx.beginPath();
  ctx.arc(t.x + 4.5, cy + 0.5, 3.4, 0, Math.PI * 2);
  ctx.fillStyle = C.dark;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(t.x + 3, cy - 2);
  ctx.quadraticCurveTo(t.x, cy - 7, t.x - 3, cy - 6);
  ctx.moveTo(t.x + 5, cy - 2.5);
  ctx.quadraticCurveTo(t.x + 3, cy - 8, t.x + 1, cy - 9);
  stroke(ctx, C.ink, 1.1);
}

function drawSpikes(ctx: CanvasRenderingContext2D, t: Thing) {
  const top = topOf(t.y, t.h);
  const count = 3;
  const w = t.w / count;
  const spikes = new Path2D();
  for (let i = 0; i < count; i++) {
    const x = t.x + i * w;
    const peak = top + (i === 1 ? 0 : 4);
    spikes.moveTo(x, GROUND_Y);
    spikes.lineTo(x + w / 2, peak);
    spikes.lineTo(x + w, GROUND_Y);
  }
  spikes.closePath();
  printed(ctx, spikes, C.shade);
  // Lines of a stack trace scratched into the spikes.
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const x = t.x + i * w + w / 2;
    ctx.moveTo(x - 3, GROUND_Y - 4);
    ctx.lineTo(x + 3, GROUND_Y - 4);
    ctx.moveTo(x - 2, GROUND_Y - 7);
    ctx.lineTo(x + 2, GROUND_Y - 7);
  }
  stroke(ctx, C.ink, 1);
  ctx.beginPath();
  ctx.arc(t.x + t.w / 2, top + 2.5, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = C.accent;
  ctx.fill();
}

function drawBrace(
  ctx: CanvasRenderingContext2D,
  t: Thing,
  time: number,
  still: boolean,
  font: string,
) {
  const bob = still ? 0 : Math.sin(time * 9 + t.id) * 1.5;
  const cx = t.x + t.w / 2;
  const cy = topOf(t.y, t.h) + t.h / 2 + bob;
  ctx.font = `700 22px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.tint;
  ctx.fillText(t.glyph ?? ";", cx + SHADOW.x, cy + SHADOW.y);
  ctx.fillStyle = C.accent;
  ctx.fillText(t.glyph ?? ";", cx, cy);
  // Speed lines behind it.
  ctx.beginPath();
  ctx.moveTo(t.x + t.w + 3, cy - 3);
  ctx.lineTo(t.x + t.w + 11, cy - 3);
  ctx.moveTo(t.x + t.w + 5, cy + 3);
  ctx.lineTo(t.x + t.w + 14, cy + 3);
  stroke(ctx, C.ink, 1);
}

function drawTomb(ctx: CanvasRenderingContext2D, t: Thing, font: string) {
  const top = topOf(t.y, t.h);
  const stone = new Path2D();
  stone.moveTo(t.x, GROUND_Y);
  stone.lineTo(t.x, top + t.w / 2);
  stone.arc(t.x + t.w / 2, top + t.w / 2, t.w / 2, Math.PI, 0);
  stone.lineTo(t.x + t.w, GROUND_Y);
  stone.closePath();
  printed(ctx, stone, C.shade);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.inkStrong;
  ctx.font = `700 8px ${font}`;
  ctx.fillText("RIP", t.x + t.w / 2, top + 13);
  ctx.fillStyle = C.accent;
  ctx.font = `600 6px ${font}`;
  ctx.fillText("@Dep", t.x + t.w / 2, top + 23);
  // A tuft of grass at its foot.
  ctx.beginPath();
  ctx.moveTo(t.x - 3, GROUND_Y);
  ctx.lineTo(t.x - 1, GROUND_Y - 4);
  ctx.moveTo(t.x + t.w + 1, GROUND_Y);
  ctx.lineTo(t.x + t.w + 3, GROUND_Y - 5);
  stroke(ctx, C.ink, 1.1);
}

function drawBean(ctx: CanvasRenderingContext2D, t: Thing, time: number, still: boolean) {
  const bob = still ? 0 : Math.sin(time * 5 + t.id) * 1.2;
  const cx = t.x + t.w / 2;
  const cy = topOf(t.y, t.h) + t.h / 2 + bob;
  const bean = new Path2D();
  bean.ellipse(cx, cy, 6, 4.4, -0.45, 0, Math.PI * 2);
  printed(ctx, bean, C.dark);
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 2);
  ctx.quadraticCurveTo(cx, cy - 1, cx + 4, cy - 2.4);
  stroke(ctx, C.paper, 1);
  sparkle(ctx, cx + 9, cy - 6, 2.4);
}

function drawThing(ctx: CanvasRenderingContext2D, t: Thing, state: DukeState, o: DrawOptions) {
  switch (t.kind) {
    case "npe":
      return drawCrate(ctx, t, o.font);
    case "bug":
      return drawBug(ctx, t, state.time, o.still);
    case "spikes":
      return drawSpikes(ctx, t);
    case "brace":
      return drawBrace(ctx, t, state.time, o.still, o.font);
    case "tomb":
      return drawTomb(ctx, t, o.font);
    case "bean":
      return drawBean(ctx, t, state.time, o.still);
  }
}

/** Draws one whole frame. */
export function drawFrame(ctx: CanvasRenderingContext2D, state: DukeState, o: DrawOptions) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  drawClouds(ctx, state.distance);
  drawGround(ctx, state.distance);
  for (const thing of state.things) drawThing(ctx, thing, state, o);
  drawDuke(ctx, state, o.still);

  // Score, top right, as the offline dino game shows it.
  ctx.font = `600 13px ${o.font}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = C.ink;
  const best = Math.max(o.best, state.phase === "over" ? score(state) : 0);
  ctx.fillText(`HI ${pad(best)}`, WORLD_W - 84, 12);
  ctx.fillStyle = C.dark;
  ctx.fillText(pad(score(state)), WORLD_W - 16, 12);
  if (state.beans > 0) {
    ctx.fillStyle = C.accent;
    ctx.font = `600 11px ${o.font}`;
    ctx.fillText(`☕ ${state.beans}`, WORLD_W - 16, 30);
  }
}

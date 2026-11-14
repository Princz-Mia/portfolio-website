"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Sparkle, Tube, s } from "@/components/illustrations/parts";
import {
  BOARD_H,
  BOARD_W,
  BOARD_X,
  BOARD_Y,
  CHALK_RGB,
  HEART_CENTER,
  HEART_SIZE,
  PINK_RGB,
  WRITING_LABEL,
  WRITING_LINES,
  WRITING_SIZE,
  buildScript,
  describeBoard,
  drawChalkPolyline,
  drawChalkSegment,
  drawResidue,
  drawSponge,
  drawSpongePolyline,
  heartPoints,
  layoutGlyphs,
  mulberry32,
  noiseAlpha,
  pointAlong,
  segmentRng,
  stepProgress,
  strokeReach,
  sweepPath,
  textRevealX,
  tipAt,
  toBoard,
  underlinePoints,
  type BoardContent,
  type Pt,
  type Script,
  type TextStep,
  type Tool,
} from "./chalk";
import styles from "./Chalkboard.module.css";

/* ------------------------------------------------------------------ */
/* Painter: owns the canvas, the drawing log and the animations.       */
/* ------------------------------------------------------------------ */

type Op =
  | { kind: "write"; until: number }
  | { kind: "chalk" | "sponge"; points: Pt[]; seed: number }
  | { kind: "residue"; seed: number };

type StrokeOp = Extract<Op, { kind: "chalk" | "sponge" }>;

type PainterHooks = {
  getTool: () => Tool | null;
  onChalkTip: (point: Pt | null) => void;
  onSponge: (point: Pt | null) => void;
  onWriting: (active: boolean) => void;
  onSweeping: (active: boolean) => void;
  /** Called whenever marks are added to or removed from the board. */
  onContent: (content: BoardContent) => void;
};

type LineArt = { canvas: HTMLCanvasElement; top: number };

const SWEEP_MS = 800;
const MAX_DPR = 2.5;
const GRAIN_SIZE = 48;

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Paints the board in board units. Every mark is kept in a small log (the
 * writing's progress and each seeded stroke), so a resize can rebuild the
 * backing store and replay the board exactly. Animation frames run only while
 * the writing or a full wipe is playing, and while a stroke has points queued.
 */
class BoardPainter {
  private ops: Op[] = [];
  private script: Script | null = null;
  private font = "";
  private prefixWidths: number[][] = [];
  private lineArt: LineArt[] = [];
  private k = 1;
  private dpr = 1;
  private sized = false;
  private disposed = false;
  private animation: { frame: number; finish: () => void } | null = null;
  private stroke: { op: StrokeOp; pointerId: number } | null = null;
  private queue: Pt[] = [];
  private flushFrame = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
    private readonly hooks: PainterHooks,
  ) {}

  /** Waits for the handwriting font, measures the text and sizes the canvas. */
  async prepare(fontFamily: string): Promise<boolean> {
    this.font = `italic 500 ${WRITING_SIZE}px ${fontFamily}`;
    if (typeof document !== "undefined" && "fonts" in document) {
      try {
        await document.fonts.load(this.font, "class Hello");
      } catch {
        // Fall back to whichever face is available.
      }
    }
    if (this.disposed) return false;

    this.ctx.font = this.font;
    const widths = WRITING_LINES.map(({ text }) => this.ctx.measureText(text).width);
    this.prefixWidths = WRITING_LINES.map(({ text }) =>
      Array.from(text, (_, i) => this.ctx.measureText(text.slice(0, i)).width),
    );
    this.script = buildScript(widths);
    this.resize();

    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerEnd);
    this.canvas.addEventListener("pointercancel", this.onPointerEnd);
    this.canvas.addEventListener("lostpointercapture", this.onPointerEnd);
    this.reportContent();
    return true;
  }

  dispose() {
    this.disposed = true;
    if (this.animation) cancelAnimationFrame(this.animation.frame);
    this.animation = null;
    cancelAnimationFrame(this.flushFrame);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerEnd);
    this.canvas.removeEventListener("pointercancel", this.onPointerEnd);
    this.canvas.removeEventListener("lostpointercapture", this.onPointerEnd);
  }

  /** Matches the backing store to the canvas's CSS box and replays the board. */
  resize() {
    if (!this.script || this.disposed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round((width * BOARD_H) / BOARD_W));
    if (this.sized && width === this.canvas.width && height === this.canvas.height) return;

    // Setting the size clears the bitmap and resets the context state.
    this.canvas.width = width;
    this.canvas.height = height;
    this.k = width / BOARD_W;
    this.dpr = dpr;
    this.sized = true;
    this.buildLineArt();
    this.replay();
  }

  hasContent() {
    return this.ops.some((op) => op.kind === "chalk" || (op.kind === "write" && op.until > 0));
  }

  /**
   * Summarises the log. A started write counts as written, since finishing an
   * animation always completes it; a sponge stroke counts once there was
   * something on the board for it to wipe.
   */
  content(): BoardContent {
    const content: BoardContent = { writing: false, doodles: false, smudged: false };
    for (const op of this.ops) {
      if (op.kind === "write") content.writing = true;
      else if (op.kind === "chalk") content.doodles = true;
      else if (op.kind === "sponge" && (content.writing || content.doodles)) content.smudged = true;
    }
    return content;
  }

  private reportContent() {
    this.hooks.onContent(this.content());
  }

  /** Writes the script, animated with the chalk following along, or at once. */
  write(animated: boolean) {
    const script = this.script;
    if (!script || this.disposed) return;
    this.finishAll();
    const op: Extract<Op, { kind: "write" }> = { kind: "write", until: 0 };
    this.ops.push(op);
    this.reportContent();

    const frame = (t: number) => {
      this.drawScriptRange(op.until, t);
      op.until = t;
      this.hooks.onChalkTip(tipAt(script, t));
    };

    if (!animated) {
      frame(script.duration);
      return;
    }
    this.hooks.onWriting(true);
    this.animate(script.duration, frame, () => {
      this.hooks.onChalkTip(null);
      this.hooks.onWriting(false);
    });
  }

  /** Wipes the whole board, sweeping the sponge across it when animated. */
  wipe(animated: boolean, then?: () => void) {
    if (this.disposed) return;
    this.finishAll();
    if (!animated || !this.hasContent()) {
      this.clear();
      then?.();
      return;
    }

    const path = sweepPath();
    const seed = randomSeed();
    let last = path[0];
    let index = 0;
    this.hooks.onSweeping(true);
    this.animate(
      SWEEP_MS,
      (t) => {
        const point = pointAlong(path, easeInOut(t / SWEEP_MS));
        drawSponge(this.ctx, last, point, segmentRng(seed, index++), 30, 0.8);
        last = point;
        this.hooks.onSponge(point);
      },
      () => {
        this.hooks.onSponge(null);
        this.clear();
        this.hooks.onSweeping(false);
        then?.();
      },
    );
  }

  /** Wipes the board if anything is on it, then writes the script again. */
  writeAgain(animated: boolean) {
    this.wipe(animated, () => this.write(animated));
  }

  /** Completes any running animation (and any it chains to) immediately. */
  finishAll() {
    while (this.animation) {
      const current = this.animation;
      this.animation = null;
      cancelAnimationFrame(current.frame);
      current.finish();
    }
  }

  private animate(duration: number, onFrame: (t: number) => void, onEnd: () => void) {
    let start: number | null = null;
    const animation = {
      frame: 0,
      finish: () => {
        onFrame(duration);
        onEnd();
      },
    };
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(duration, now - start);
      onFrame(t);
      if (t >= duration) {
        this.animation = null;
        onEnd();
        return;
      }
      animation.frame = requestAnimationFrame(tick);
    };
    animation.frame = requestAnimationFrame(tick);
    this.animation = animation;
  }

  private clear() {
    this.ops = [];
    this.clearBitmap();
    const residue: Op = { kind: "residue", seed: randomSeed() };
    this.ops.push(residue);
    this.drawOp(residue);
    this.reportContent();
  }

  private clearBitmap() {
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
  }

  private replay() {
    this.clearBitmap();
    for (const op of this.ops) this.drawOp(op);
  }

  private drawOp(op: Op) {
    switch (op.kind) {
      case "write":
        this.drawScriptRange(0, op.until);
        break;
      case "chalk":
        drawChalkPolyline(this.ctx, op.points, op.seed);
        break;
      case "sponge":
        drawSpongePolyline(this.ctx, op.points, op.seed);
        break;
      case "residue":
        drawResidue(this.ctx, mulberry32(op.seed));
        break;
    }
  }

  /** Draws whatever the script adds between two moments of its timeline. */
  private drawScriptRange(from: number, to: number) {
    if (!this.script || to <= from) return;
    for (const step of this.script.steps) {
      if (step.kind === "travel") continue;
      if (to <= step.start || from >= step.start + step.duration) continue;
      const p0 = stepProgress(step, from);
      const p1 = stepProgress(step, to);
      if (step.kind === "text") {
        this.revealText(step, p0, p1);
      } else {
        const i0 = strokeReach(step, p0);
        const i1 = strokeReach(step, p1);
        drawChalkPolyline(this.ctx, step.points, step.seed, i0, i1, step.rgb, 2.3);
      }
    }
  }

  /**
   * Copies a vertical slice of a pre-rendered line onto the board. Slice edges
   * are snapped to whole device pixels so consecutive slices meet without seams.
   */
  private revealText(step: TextStep, p0: number, p1: number) {
    const art = this.lineArt[step.line];
    if (!art) return;
    const { k } = this;
    const full = art.canvas.width;
    const a = p0 <= 0 ? 0 : Math.floor(textRevealX(step, p0) * k);
    const b = p1 >= 1 ? full : Math.floor(textRevealX(step, p1) * k);
    if (b <= a) return;
    const h = art.canvas.height;
    this.ctx.drawImage(art.canvas, a, 0, b - a, h, a / k, art.top / k, (b - a) / k, h / k);
  }

  /** Renders each line of handwriting once, in chalk with a dusty grain. */
  private buildLineArt() {
    const { k } = this;
    const width = this.canvas.width;
    const grain = this.buildGrain();
    this.lineArt = [];

    WRITING_LINES.forEach((line, index) => {
      const canvas = document.createElement("canvas");
      const top = Math.round((line.baseline - WRITING_SIZE * 1.3) * k);
      canvas.width = width;
      canvas.height = Math.max(1, Math.ceil(WRITING_SIZE * 1.85 * k));
      const lc = canvas.getContext("2d");
      if (!lc) return;

      lc.setTransform(k, 0, 0, k, 0, -top);
      lc.font = this.font;
      lc.textBaseline = "alphabetic";
      lc.fillStyle = `rgba(${CHALK_RGB},0.94)`;
      lc.shadowColor = `rgba(${CHALK_RGB},0.3)`;
      lc.shadowBlur = 2.2 * k;
      const glyphs = layoutGlyphs(line.text, this.prefixWidths[index] ?? [], mulberry32(101 + index));
      for (const glyph of glyphs) {
        lc.save();
        lc.translate(line.x + glyph.x, line.baseline + glyph.dy);
        lc.rotate(glyph.rotate);
        lc.fillText(glyph.char, 0, 0);
        lc.restore();
      }

      if (grain) {
        const pattern = lc.createPattern(grain, "repeat");
        if (pattern) {
          lc.setTransform(1, 0, 0, 1, 0, 0);
          lc.shadowBlur = 0;
          lc.shadowColor = "transparent";
          lc.globalCompositeOperation = "destination-out";
          lc.fillStyle = pattern;
          lc.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      this.lineArt[index] = { canvas, top };
    });
  }

  /** A grain tile whose pixels are one CSS pixel in size. */
  private buildGrain(): HTMLCanvasElement | null {
    const noise = document.createElement("canvas");
    noise.width = GRAIN_SIZE;
    noise.height = GRAIN_SIZE;
    const nc = noise.getContext("2d");
    if (!nc) return null;
    const image = nc.createImageData(GRAIN_SIZE, GRAIN_SIZE);
    const alpha = noiseAlpha(GRAIN_SIZE, mulberry32(7));
    for (let i = 0; i < alpha.length; i++) image.data[i * 4 + 3] = alpha[i];
    nc.putImageData(image, 0, 0);

    const size = Math.max(1, Math.round(GRAIN_SIZE * this.dpr));
    if (size === GRAIN_SIZE) return noise;
    const tile = document.createElement("canvas");
    tile.width = size;
    tile.height = size;
    const tc = tile.getContext("2d");
    if (!tc) return noise;
    tc.imageSmoothingEnabled = false;
    tc.drawImage(noise, 0, 0, size, size);
    return tile;
  }

  /* Pointer drawing ------------------------------------------------- */

  private onPointerDown = (event: PointerEvent) => {
    const tool = this.hooks.getTool();
    if (!tool || this.stroke || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // Capture is a nicety; drawing still works inside the board without it.
    }
    this.finishAll();
    const rect = this.canvas.getBoundingClientRect();
    const point = toBoard(event.clientX, event.clientY, rect);
    // A tap with the chalk leaves a dot; a tap with the sponge dabs once.
    const second = tool === "chalk" ? { x: point.x + 0.4, y: point.y + 0.2 } : point;
    const op: StrokeOp = { kind: tool, points: [point, second], seed: randomSeed() };
    this.ops.push(op);
    this.stroke = { op, pointerId: event.pointerId };
    this.drawOp(op);
    this.reportContent();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.stroke || event.pointerId !== this.stroke.pointerId) return;
    const rect = this.canvas.getBoundingClientRect();
    const coalesced =
      typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [];
    for (const each of coalesced.length > 0 ? coalesced : [event]) {
      this.queue.push(toBoard(each.clientX, each.clientY, rect));
    }
    if (!this.flushFrame) this.flushFrame = requestAnimationFrame(this.flush);
  };

  private onPointerEnd = (event: PointerEvent) => {
    if (!this.stroke || event.pointerId !== this.stroke.pointerId) return;
    cancelAnimationFrame(this.flushFrame);
    this.flush();
    this.stroke = null;
  };

  /** Draws the points queued since the last frame. */
  private flush = () => {
    this.flushFrame = 0;
    const stroke = this.stroke;
    if (!stroke) {
      this.queue.length = 0;
      return;
    }
    const { op } = stroke;
    for (const point of this.queue) {
      const last = op.points[op.points.length - 1];
      if (Math.hypot(point.x - last.x, point.y - last.y) < 0.3) continue;
      op.points.push(point);
      const index = op.points.length - 2;
      if (op.kind === "chalk") {
        drawChalkSegment(this.ctx, last, point, segmentRng(op.seed, index));
      } else {
        drawSponge(this.ctx, last, point, segmentRng(op.seed, index));
      }
    }
    this.queue.length = 0;
  };
}

/* ------------------------------------------------------------------ */
/* Static drawing data                                                 */
/* ------------------------------------------------------------------ */

const toPath = (points: Pt[]) =>
  points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(BOARD_X + p.x).toFixed(1)} ${(BOARD_Y + p.y).toFixed(1)}`)
    .join(" ");

/** The first line's width is estimated for the static drawing; the canvas measures it. */
const STATIC_UNDERLINE = toPath(
  underlinePoints(WRITING_LINES[0].x - 3, WRITING_LINES[0].x + 143, WRITING_LINES[0].baseline + 7),
);
const STATIC_HEART = toPath(heartPoints(HEART_CENTER, HEART_SIZE));

/** Chalk-stick fill, set inline so it wins over the line class's `fill: none`. */
const STICK = { fill: "#f3efe6" } as const;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * A chalkboard on an easel. When it scrolls into view a piece of chalk writes a
 * short program on it. Visitors can pick up the chalk or the sponge from the tray
 * and draw or wipe, or use the buttons to wipe the board and write it again.
 * Without JavaScript the board shows the finished writing and no controls.
 */
export function Chalkboard() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const slateId = `${uid}-slate`;
  const dustId = `${uid}-dust`;

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chalkSpriteRef = useRef<SVGGElement>(null);
  const spongeSpriteRef = useRef<SVGGElement>(null);
  const painterRef = useRef<BoardPainter | null>(null);
  const toolRef = useRef<Tool | null>(null);
  /** Set once the script has been written, or a visitor has wiped or rewritten the board. */
  const startedRef = useRef(false);

  const [live, setLive] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [writing, setWriting] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [label, setLabel] = useState(WRITING_LABEL);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const place = (sprite: SVGGElement | null, point: Pt | null) => {
      if (!sprite) return;
      if (!point) {
        sprite.setAttribute("visibility", "hidden");
        return;
      }
      const x = (BOARD_X + point.x).toFixed(1);
      const y = (BOARD_Y + point.y).toFixed(1);
      sprite.setAttribute("transform", `translate(${x} ${y})`);
      sprite.setAttribute("visibility", "visible");
    };

    const painter = new BoardPainter(canvas, ctx, {
      getTool: () => toolRef.current,
      onChalkTip: (point) => place(chalkSpriteRef.current, point),
      onSponge: (point) => place(spongeSpriteRef.current, point),
      onWriting: setWriting,
      onSweeping: setSweeping,
      onContent: (content) => setLabel(describeBoard(content)),
    });
    painterRef.current = painter;

    let seen = typeof IntersectionObserver === "undefined";
    let prepared = false;
    const start = () => {
      if (!prepared || !seen || startedRef.current) return;
      startedRef.current = true;
      painter.write(!prefersReducedMotion());
    };

    const intersection = seen
      ? null
      : new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              intersection?.disconnect();
              seen = true;
              start();
            }
          },
          { threshold: 0.4 },
        );
    intersection?.observe(root);

    let resize: ResizeObserver | null = null;
    const family = getComputedStyle(canvas).fontFamily || "Georgia, serif";
    void painter.prepare(family).then((ok) => {
      if (!ok) return;
      prepared = true;
      setLive(true);
      // With reduced motion the writing is simply there, even off screen.
      if (prefersReducedMotion()) seen = true;
      if (typeof ResizeObserver !== "undefined") {
        resize = new ResizeObserver(() => painter.resize());
        resize.observe(canvas);
      }
      start();
    });

    const motion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const onMotionChange = () => {
      if (motion?.matches) painter.finishAll();
    };
    motion?.addEventListener?.("change", onMotionChange);

    return () => {
      intersection?.disconnect();
      resize?.disconnect();
      motion?.removeEventListener?.("change", onMotionChange);
      painter.dispose();
      painterRef.current = null;
    };
  }, []);

  // While a tool is held, Escape anywhere on the page puts it back on the tray.
  useEffect(() => {
    if (!tool) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.ctrlKey || event.altKey || event.metaKey) return;
      toolRef.current = null;
      setTool(null);
      setMessage(`The ${tool} is back on the tray.`);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [tool]);

  const changeTool = (next: Tool | null) => {
    const previous = toolRef.current;
    toolRef.current = next;
    setTool(next);
    if (next) {
      painterRef.current?.finishAll();
      setMessage(
        next === "chalk"
          ? "Chalk picked up. Press and move on the board to draw."
          : "Sponge picked up. Press and move on the board to wipe.",
      );
    } else if (previous) {
      setMessage(`The ${previous} is back on the tray.`);
    }
  };

  const toggleTool = (which: Tool) => changeTool(tool === which ? null : which);

  // Either button replaces the first automatic writing if it has not happened yet.
  const wipeBoard = () => {
    startedRef.current = true;
    painterRef.current?.wipe(!prefersReducedMotion());
    setMessage("The board is wiped clean.");
  };

  const writeAgain = () => {
    startedRef.current = true;
    painterRef.current?.writeAgain(!prefersReducedMotion());
    setMessage("Writing on the board again: class Hello, ideas first, then code.");
  };

  const trayClass = (lifted: boolean, away: boolean) =>
    [styles.trayTool, lifted ? styles.lifted : "", away ? styles.away : ""].join(" ");

  return (
    <div ref={rootRef} className={styles.board} data-board={live ? "live" : undefined}>
      <div className={styles.stage}>
        <svg
          className={`${s.figure} ${styles.drawing}`}
          viewBox="0 0 480 400"
          width="480"
          height="400"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient id={slateId} cx="50%" cy="42%" r="75%">
              <stop offset="0" stopColor="#454a44" />
              <stop offset="0.55" stopColor="#3b403b" />
              <stop offset="1" stopColor="#2d312d" />
            </radialGradient>
            <filter id={dustId} x="-5%" y="-20%" width="110%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="4" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.9 1.55" />
              <feComposite in="SourceGraphic" operator="in" />
            </filter>
          </defs>

          <ellipse cx="240" cy="200" rx="216" ry="162" className={s.blob} />
          <circle cx="424" cy="318" r="40" className={s.blobShade} />
          <ellipse cx="240" cy="376" rx="172" ry="8" className={s.shade} />

          {/* easel: back leg, front legs with their print shadow, crossbar */}
          <path d="M240 30 V358" className={`${s.line} ${s.bold}`} />
          <g transform="translate(7 6)">
            <path
              d="M228 28 L112 374 M252 28 L368 374"
              fill="none"
              stroke="var(--art-tint)"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </g>
          <Tube d="M228 28 L112 374" width={9} />
          <Tube d="M252 28 L368 374" width={9} />
          <Tube d="M132 332 H348" width={7} />
          <circle cx="240" cy="27" r="7" className={`${s.line} ${s.fur}`} />

          {/* wooden frame */}
          <rect x="60" y="50" width="352" height="230" rx="10" className={s.tint} transform="translate(8 7)" />
          <rect x="60" y="50" width="352" height="230" rx="10" className={`${s.line} ${s.fur}`} />
          <rect x="68" y="58" width="336" height="214" rx="6" className={`${s.line} ${s.thin}`} />
          <path
            d="M96 54 C124 52 152 56 182 54 M296 55 C326 53 356 56 386 54 M64 116 C62 146 66 176 63 206 M408 98 C410 136 406 168 409 198"
            className={`${s.line} ${s.thin}`}
          />

          {/* slate */}
          <rect
            x={BOARD_X}
            y={BOARD_Y}
            width={BOARD_W}
            height={BOARD_H}
            rx="4"
            fill={`url(#${slateId})`}
            stroke="var(--art-ink-strong)"
            strokeWidth="1.7"
          />
          <g fill={`rgb(${CHALK_RGB})`}>
            <ellipse cx="160" cy="124" rx="62" ry="15" opacity="0.045" transform="rotate(-5 160 124)" />
            <ellipse cx="306" cy="214" rx="70" ry="13" opacity="0.04" />
            <ellipse cx="344" cy="100" rx="38" ry="10" opacity="0.035" />
          </g>

          {/* the finished writing, replaced by the canvas once it is live */}
          <g className={styles.writing} filter={`url(#${dustId})`}>
            {WRITING_LINES.map((line) => (
              <text
                key={line.text}
                x={BOARD_X + line.x}
                y={BOARD_Y + line.baseline}
                className={styles.chalkText}
                fontSize={WRITING_SIZE}
                fill={`rgb(${CHALK_RGB})`}
              >
                {line.text}
              </text>
            ))}
            <path d={STATIC_UNDERLINE} fill="none" stroke={`rgb(${CHALK_RGB})`} strokeWidth="2.3" strokeLinecap="round" />
            <path d={STATIC_HEART} fill="none" stroke={`rgb(${PINK_RGB})`} strokeWidth="2.3" strokeLinejoin="round" />
          </g>

          {/* tray */}
          <rect x="50" y="278" width="372" height="12" rx="3" className={s.tint} transform="translate(7 6)" />
          <rect x="50" y="278" width="372" height="12" rx="3" className={`${s.line} ${s.fur}`} />
          <path d="M58 283 H414" className={`${s.line} ${s.thin}`} />
          <g fill={`rgb(${CHALK_RGB})`} opacity="0.9">
            <circle cx="292" cy="280.5" r="0.9" />
            <circle cx="336" cy="281" r="0.7" />
            <circle cx="160" cy="280.5" r="0.8" />
          </g>

          {/* a stub of pink chalk that stays put */}
          <rect
            x="350"
            y="271"
            width="12"
            height="6"
            rx="2"
            className={s.line}
            style={{ fill: `rgb(${PINK_RGB})` }}
          />

          <Sparkle x={32} y={118} size={7} wait={0.6} />
          <Sparkle x={452} y={62} size={6} wait={1.5} tone="ink" />
        </svg>

        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={label}
          data-tool={tool ?? undefined}
        />

        {/*
          The tools sit in front of the slate: on the tray they overlap its lower
          edge, and while writing or wiping they move over the marks they make.
        */}
        <svg
          className={`${s.figure} ${styles.overlay}`}
          viewBox="0 0 480 400"
          width="480"
          height="400"
          aria-hidden="true"
          focusable="false"
        >
          {/* sponge on the tray */}
          <g className={`${trayClass(tool === "sponge", sweeping)} ${styles.spongeTray}`}>
            <rect x="100" y="257" width="48" height="20" rx="3" className={s.tint} transform="translate(4 3)" />
            <rect x="100" y="268" width="48" height="9" rx="2" className={`${s.line} ${s.dark}`} />
            <rect x="100" y="257" width="48" height="12" rx="3" className={`${s.line} ${s.paper}`} />
            <path d="M110 261 H138" className={`${s.line} ${s.thin}`} />
          </g>

          {/* chalk on the tray */}
          <g className={`${trayClass(tool === "chalk", writing)} ${styles.chalkTray}`}>
            <rect x="306" y="273" width="30" height="7" rx="2.5" className={s.tint} transform="translate(3 2)" />
            <rect x="306" y="270" width="30" height="7" rx="2.5" className={s.line} style={STICK} />
            <path d="M312 270.5 V276.5" className={`${s.line} ${s.thin}`} />
          </g>

          {/* chalk and sponge as they move over the board */}
          <g ref={chalkSpriteRef} className={styles.sprite} visibility="hidden">
            <g transform="rotate(-36)">
              <path
                d="M1 -3.2 L26 -3.6 Q28 0 26 3.6 L1 3.2 Q-1.2 0 1 -3.2 Z"
                className={s.line}
                style={STICK}
              />
              <path d="M7 -3.3 V3.3" className={`${s.line} ${s.thin}`} />
            </g>
          </g>
          <g ref={spongeSpriteRef} className={styles.sprite} visibility="hidden">
            <g transform="rotate(-4)">
              <rect x="-26" y="-12" width="52" height="13" rx="3" className={`${s.line} ${s.paper}`} />
              <rect x="-26" y="0" width="52" height="10" rx="2" className={`${s.line} ${s.dark}`} />
            </g>
          </g>
        </svg>

        {live ? (
          <>
            <button
              type="button"
              className={`${styles.toolButton} ${styles.spongeButton}`}
              aria-pressed={tool === "sponge"}
              aria-label="Pick up the sponge"
              title="Pick up the sponge"
              onClick={() => toggleTool("sponge")}
            />
            <button
              type="button"
              className={`${styles.toolButton} ${styles.chalkButton}`}
              aria-pressed={tool === "chalk"}
              aria-label="Pick up the chalk"
              title="Pick up the chalk"
              onClick={() => toggleTool("chalk")}
            />
          </>
        ) : null}
      </div>

      {live ? (
        <div className={styles.controls}>
          <p className={styles.hint}>
            {tool
              ? `Press and move on the board to ${tool === "chalk" ? "draw" : "wipe"}. Choose the ${tool} again, or press Esc, to put it down.`
              : "Pick up the chalk or the sponge on the tray."}
          </p>
          <button type="button" className={styles.textButton} onClick={wipeBoard}>
            Wipe the board
          </button>
          <button type="button" className={styles.textButton} onClick={writeAgain}>
            Write it again
          </button>
        </div>
      ) : null}

      <p className="visually-hidden" role="status">
        {message}
      </p>
    </div>
  );
}

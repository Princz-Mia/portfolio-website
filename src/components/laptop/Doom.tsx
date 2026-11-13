"use client";

import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { HEIGHT, WIDTH, move, palette, render, snap, spawn, step, turn, type Action } from "./raycast";
import styles from "./LaptopScreen.module.css";

type Outcome = { won: boolean; seconds: number };

export type DoomProps = {
  /** Step mode: one cell or a quarter turn per press, no animation loop. */
  stepMode: boolean;
  /** Called once when the player wins or quits. */
  onExit: (outcome: Outcome) => void;
};

const KEYS: Record<string, Action> = {
  ArrowUp: "forward",
  KeyW: "forward",
  ArrowDown: "back",
  KeyS: "back",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const PAD: { action: Action; label: string; glyph: string }[] = [
  { action: "left", label: "Turn left", glyph: "◀" },
  { action: "forward", label: "Step forward", glyph: "▲" },
  { action: "back", label: "Step back", glyph: "▼" },
  { action: "right", label: "Turn right", glyph: "▶" },
];

const SPEED = 2.2; // cells per second
const TURN_SPEED = 2.4; // radians per second
const TAP_SECONDS = 0.25; // how far one keyboard press or quick tap on the pad moves
const TAP_MS = 150; // pad presses shorter than this count as taps

type Game = ReturnType<typeof createGame>;

/**
 * The game state and its loop. The canvas is redrawn only while a movement key
 * or pad button is held, plus once after each discrete step, so nothing runs
 * while the player stands still.
 */
function createGame(ctx: CanvasRenderingContext2D | null, stepMode: boolean, onExit: (o: Outcome) => void) {
  const colours = palette();
  const image = ctx?.createImageData(WIDTH, HEIGHT) ?? null;
  const pixels = image ? new Uint32Array(image.data.buffer) : null;
  const keys = new Set<Action>();
  const pads = new Set<Action>();
  let player = stepMode ? snap(spawn()) : spawn();
  let frame = 0;
  let last = 0;
  let started = 0;
  let pressedAt = 0;
  let walked = 0;
  let done = false;

  function draw() {
    if (!ctx || !image || !pixels) return;
    render(player, pixels, colours);
    ctx.putImageData(image, 0, 0);
    // The mug, held at the bottom of the view.
    const x = (WIDTH - 20) / 2;
    const y = HEIGHT - 16 + (stepMode ? 0 : Math.round(Math.sin(walked * 7)));
    ctx.fillStyle = "#3f3532";
    ctx.fillRect(x, y, 20, 17);
    ctx.fillRect(x + 20, y + 4, 3, 1);
    ctx.fillRect(x + 22, y + 4, 1, 5);
    ctx.fillRect(x + 20, y + 8, 3, 1);
    ctx.fillStyle = "#f6f1ea";
    ctx.fillRect(x + 1, y + 1, 18, 16);
    ctx.fillStyle = "#a14d59";
    ctx.fillRect(x + 1, y + 6, 18, 3);
  }

  function finish(won: boolean) {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    onExit({ won, seconds: started ? (performance.now() - started) / 1000 : 0 });
  }

  /** Applies the given actions for `seconds` of continuous movement. */
  function advance(active: (a: Action) => boolean, seconds: number) {
    if (!started) started = performance.now();
    const turning = Number(active("right")) - Number(active("left"));
    const walking = Number(active("forward")) - Number(active("back"));
    if (turning) player = turn(player, turning * TURN_SPEED * seconds);
    if (walking) {
      const result = move(player, walking * SPEED * seconds);
      player = result.player;
      walked += SPEED * seconds;
      if (result.won) finish(true);
    }
  }

  function tick(now: number) {
    advance((a) => keys.has(a) || pads.has(a), Math.min(now - last, 50) / 1000);
    last = now;
    if (done) return;
    draw();
    frame = keys.size + pads.size > 0 ? requestAnimationFrame(tick) : 0;
  }

  function hold(set: Set<Action>, action: Action) {
    set.add(action);
    if (frame || done) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  /** One discrete move: a whole cell in step mode, a short nudge otherwise. */
  function nudge(action: Action) {
    if (done) return;
    if (stepMode) {
      if (!started) started = performance.now();
      const result = step(player, action);
      player = result.player;
      if (result.won) return finish(true);
    } else {
      advance((a) => a === action, TAP_SECONDS);
      if (done) return;
    }
    draw();
  }

  return {
    draw,
    nudge,
    quit: () => finish(false),
    holdKey: (action: Action) => hold(keys, action),
    releaseKey: (action: Action) => keys.delete(action),
    releaseKeys: () => keys.clear(),
    releaseAll() {
      keys.clear();
      pads.clear();
    },
    holdPad(action: Action) {
      pressedAt = performance.now();
      hold(pads, action);
    },
    releasePad: (action: Action) => pads.delete(action),
    /** Whether the last pad press was short enough to count as a tap. */
    wasTap: () => performance.now() - pressedAt < TAP_MS,
    stop() {
      done = true;
      cancelAnimationFrame(frame);
    },
  };
}

/** A tiny maze in the drawing's palette, with a pad for touch screens. */
export function Doom({ stepMode, onExit }: DoomProps) {
  const hintId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    onExitRef.current = onExit;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const game = createGame(canvas?.getContext("2d") ?? null, stepMode, (o) => onExitRef.current(o));
    gameRef.current = game;
    game.draw();
    canvas?.focus({ preventScroll: true });
    const releaseAll = () => game.releaseAll();
    document.addEventListener("visibilitychange", releaseAll);
    return () => {
      document.removeEventListener("visibilitychange", releaseAll);
      game.stop();
      gameRef.current = null;
    };
  }, [stepMode]);

  function onKeyDown(e: KeyboardEvent<HTMLCanvasElement>) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === "Escape") {
      e.preventDefault();
      gameRef.current?.quit();
      return;
    }
    const action = KEYS[e.code];
    if (!action) return;
    e.preventDefault();
    if (e.repeat) {
      if (!stepMode) gameRef.current?.holdKey(action);
      return;
    }
    // A fresh press always moves a little at once, so a quick tap that is
    // released before the next frame still does something; holding the key
    // then keeps moving through the frame loop.
    gameRef.current?.nudge(action);
    if (!stepMode) gameRef.current?.holdKey(action);
  }

  function onKeyUp(e: KeyboardEvent<HTMLCanvasElement>) {
    const action = KEYS[e.code];
    if (action) gameRef.current?.releaseKey(action);
  }

  return (
    <div className={styles.game}>
      <div className={styles.view}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={WIDTH}
          height={HEIGHT}
          tabIndex={0}
          role="img"
          aria-label="Tiny Doom-like maze. Arrow keys or W A S D to move, Escape to go back."
          aria-describedby={hintId}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={() => gameRef.current?.releaseKeys()}
        />
      </div>
      <p id={hintId} className={styles.hint}>
        find the red door · arrows/WASD move · Esc back
      </p>
      <div className={styles.controls}>
        <div className={styles.pad}>
          {PAD.map(({ action, label, glyph }) => (
            <button
              key={action}
              type="button"
              className={styles.padButton}
              aria-label={label}
              onPointerDown={(e) => {
                if (stepMode) return;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                gameRef.current?.holdPad(action);
              }}
              onPointerUp={() => gameRef.current?.releasePad(action)}
              onPointerCancel={() => gameRef.current?.releasePad(action)}
              onLostPointerCapture={() => gameRef.current?.releasePad(action)}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => {
                // Keyboard presses and quick taps move a little; long presses
                // have already moved through the loop.
                const game = gameRef.current;
                if (game && (stepMode || e.detail === 0 || game.wasTap())) game.nudge(action);
              }}
            >
              <span aria-hidden="true">{glyph}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.textButton} onClick={() => gameRef.current?.quit()}>
          back to terminal
        </button>
      </div>
    </div>
  );
}

"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import {
  STEP,
  WORLD_H,
  WORLD_W,
  createGame,
  exceptionFor,
  readBest,
  score,
  step,
  writeBest,
  type DukeState,
} from "./duke";
import { drawFrame } from "./dukeDraw";
import styles from "./LaptopScreen.module.css";

/** Where the high score is kept in this browser. */
export const BEST_KEY = "duke-run.best";

export type DukeResult = { score: number; best: number };
export type DukeHandle = {
  /** Stops the game and returns the last score and the best, saving a new best. */
  finish: () => DukeResult;
};

export type DukeRunProps = {
  ref?: Ref<DukeHandle>;
  /** Called when the player leaves: Escape on the game or the quit button. */
  onExit: (result: DukeResult) => void;
  /** Text for the terminal's live region. */
  onStatus: (text: string) => void;
};

type View = "ready" | "playing" | "paused" | "over";
type Action = "jump" | "duck";

/** After a game over, presses this soon are ignored so a held jump does not retry at once. */
const RETRY_DELAY_MS = 400;
/** How long a keyboard press on a pad button holds it down. */
const TAP_MS = 140;

export const DUKE_HINT =
  "space, ↑ or w jump (hold to go higher) · ↓ or s duck · esc back to the terminal";

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The game's action for a key, or null for keys the game leaves to the browser. */
export function dukeAction(
  e: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "altKey" | "metaKey">,
): Action | null {
  if (e.ctrlKey || e.altKey || e.metaKey) return null;
  switch (e.code) {
    case "Space":
    case "ArrowUp":
    case "KeyW":
      return "jump";
    case "ArrowDown":
    case "KeyS":
      return "duck";
  }
  switch (e.key) {
    case " ":
    case "ArrowUp":
    case "w":
    case "W":
      return "jump";
    case "ArrowDown":
    case "s":
    case "S":
      return "duck";
  }
  return null;
}

export function gameOverText(exception: string, points: number, best: number): [string, string] {
  return [
    `Exception in thread "main" ${exception}`,
    `score ${points} · best ${best} · press space or tap to retry`,
  ];
}

type Runtime = {
  press: (action: Action) => void;
  release: (action: Action) => void;
  pause: () => void;
  finish: () => DukeResult;
};

/**
 * Duke runner: a small endless runner on a canvas, played with the keyboard
 * while the canvas has focus, or by tapping. It draws a new frame only while a
 * game is running, and pauses when focus or the tab goes away.
 */
export function DukeRun({ ref, onExit, onStatus }: DukeRunProps) {
  const hintId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const tapsRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const callbacksRef = useRef({ onExit, onStatus });
  const [reduced] = useState(prefersReducedMotion);
  // With reduced motion the game waits for an explicit start.
  const [view, setView] = useState<View>(() => (reduced ? "ready" : "playing"));
  const [best, setBest] = useState(() => readBest(storage(), BEST_KEY));
  const [over, setOver] = useState<[string, string] | null>(null);

  useEffect(() => {
    callbacksRef.current = { onExit, onStatus };
  });

  useImperativeHandle(ref, () => ({
    finish: () => runtimeRef.current?.finish() ?? { score: 0, best },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const taps = tapsRef.current;
    const input = { jump: false, jumpPressed: false, duck: false };
    let mode: View = reduced ? "ready" : "playing";
    let state: DukeState = createGame(1);
    let started = false;
    let bestNow = readBest(storage(), BEST_KEY);
    let finished = false;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let overAt = 0;
    let font = "monospace";

    const draw = () => {
      if (!ctx) return;
      const scale = canvas.width / WORLD_W;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawFrame(ctx, state, { best: bestNow, font, still: mode !== "playing" || reduced });
    };

    const fit = () => {
      const cssWidth = canvas.clientWidth || WORLD_W;
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(cssWidth * ratio));
      const height = Math.max(1, Math.round((cssWidth * WORLD_H * ratio) / WORLD_W));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      font = getComputedStyle(canvas).fontFamily || "monospace";
      draw();
    };

    const halt = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const show = (next: View) => {
      mode = next;
      setView(next);
    };

    const endGame = () => {
      halt();
      const points = score(state);
      if (points > bestNow) {
        bestNow = points;
        writeBest(storage(), BEST_KEY, bestNow);
        setBest(bestNow);
      }
      overAt = performance.now();
      const text = gameOverText(exceptionFor(state.cause), points, bestNow);
      setOver(text);
      show("over");
      draw();
      callbacksRef.current.onStatus(text.join(". "));
    };

    const frame = () => {
      raf = 0;
      // Reads the same clock as `run`, and drops long gaps rather than catching up.
      const now = performance.now();
      acc += Math.min(Math.max(now - last, 0) / 1000, 0.1);
      last = now;
      while (acc >= STEP && state.phase === "playing") {
        state = step(state, STEP, input);
        input.jumpPressed = false;
        acc -= STEP;
      }
      draw();
      if (state.phase === "over") endGame();
      else if (mode === "playing") raf = requestAnimationFrame(frame);
    };

    const run = () => {
      if (raf) return;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    };

    const releaseAll = () => {
      input.jump = false;
      input.jumpPressed = false;
      input.duck = false;
    };

    const start = () => {
      state = createGame((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) | 0);
      started = true;
      finished = false;
      releaseAll();
      setOver(null);
      show("playing");
      run();
    };

    const pause = () => {
      if (mode !== "playing") return;
      halt();
      releaseAll();
      show("paused");
      draw();
      callbacksRef.current.onStatus("duke: paused. press space or tap to resume.");
    };

    const runtime: Runtime = {
      press(action) {
        if (action === "duck") {
          if (mode === "playing") input.duck = true;
          return;
        }
        if (mode === "playing") {
          if (!input.jump) input.jumpPressed = true;
          input.jump = true;
        } else if (mode === "ready") {
          start();
        } else if (mode === "paused") {
          show("playing");
          run();
        } else if (performance.now() - overAt >= RETRY_DELAY_MS) {
          start();
        }
      },
      release(action) {
        if (action === "jump") input.jump = false;
        else input.duck = false;
      },
      pause,
      finish() {
        halt();
        releaseAll();
        const points = started ? score(state) : 0;
        if (!finished && points > bestNow) {
          bestNow = points;
          writeBest(storage(), BEST_KEY, bestNow);
        }
        finished = true;
        return { score: points, best: bestNow };
      },
    };
    runtimeRef.current = runtime;

    const onVisibility = () => {
      if (document.hidden) pause();
    };

    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(fit) : null;
    observer?.observe(canvas);
    window.addEventListener("resize", fit);
    document.addEventListener("visibilitychange", onVisibility);
    fit();
    canvas.focus({ preventScroll: true });
    if (mode === "playing") {
      state = createGame((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) | 0);
      started = true;
      if (document.hidden) pause();
      else run();
    }

    return () => {
      halt();
      observer?.disconnect();
      window.removeEventListener("resize", fit);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const timer of taps) clearTimeout(timer);
      taps.clear();
      runtimeRef.current = null;
    };
  }, [reduced]);

  function onKeyDown(e: KeyboardEvent<HTMLCanvasElement>) {
    if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // Handled here so the dialog does not also close.
      e.preventDefault();
      exit();
      return;
    }
    const action = dukeAction(e);
    if (!action) return;
    e.preventDefault();
    if (e.repeat) return;
    runtimeRef.current?.press(action);
  }

  function onKeyUp(e: KeyboardEvent<HTMLCanvasElement>) {
    // A key let go while a modifier is held still ends its press.
    const action = dukeAction({
      key: e.key,
      code: e.code,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
    });
    if (action) runtimeRef.current?.release(action);
  }

  function onBlur(e: FocusEvent<HTMLCanvasElement>) {
    // The touch buttons keep the game going; anywhere else pauses it.
    const next = e.relatedTarget;
    if (next instanceof Node && padRef.current?.contains(next)) return;
    runtimeRef.current?.pause();
  }

  function exit() {
    const result = runtimeRef.current?.finish() ?? { score: 0, best };
    callbacksRef.current.onExit(result);
  }

  function tap(action: Action) {
    runtimeRef.current?.press(action);
    const timer = setTimeout(() => {
      tapsRef.current.delete(timer);
      runtimeRef.current?.release(action);
    }, TAP_MS);
    tapsRef.current.add(timer);
  }

  const note =
    view === "ready"
      ? [
          ...(reduced ? ["reduced motion is on, so the game waits for you."] : []),
          `press space or tap to start · best ${best}`,
        ]
      : view === "paused"
        ? ["paused · press space or tap to resume"]
        : view === "over" && over
          ? over
          : null;

  return (
    <div className={styles.game}>
      <div className={styles.dukeView}>
        <canvas
          ref={canvasRef}
          className={styles.dukeCanvas}
          width={WORLD_W}
          height={WORLD_H}
          tabIndex={0}
          role="application"
          aria-label="Duke runner"
          aria-describedby={hintId}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={onBlur}
          onPointerDown={(e) => {
            e.currentTarget.focus({ preventScroll: true });
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            runtimeRef.current?.press("jump");
          }}
          onPointerUp={() => runtimeRef.current?.release("jump")}
          onPointerCancel={() => runtimeRef.current?.release("jump")}
          onContextMenu={(e) => e.preventDefault()}
        />
        {note ? (
          <div className={styles.dukeNote} data-testid="duke-note">
            {note.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
      <p id={hintId} className={styles.hint}>
        {DUKE_HINT}
      </p>
      <div ref={padRef} className={styles.pad} role="group" aria-label="Touch controls">
        {(["jump", "duck"] as const).map((action) => (
          <button
            key={action}
            type="button"
            className={`${styles.padButton} ${styles.padWord}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              runtimeRef.current?.press(action);
            }}
            onPointerUp={() => runtimeRef.current?.release(action)}
            onPointerCancel={() => runtimeRef.current?.release(action)}
            onLostPointerCapture={() => runtimeRef.current?.release(action)}
            // Keeps keyboard focus on the game when the pad is clicked with a mouse.
            onMouseDown={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => {
              if (e.detail === 0) tap(action);
            }}
          >
            {action}
          </button>
        ))}
      </div>
      <div className={styles.gameBar}>
        <button type="button" className={styles.quit} onClick={exit}>
          quit to terminal
        </button>
        <span className={styles.credit}>
          best {best} · Duke, the Java mascot (BSD licence), redrawn in line art
        </span>
      </div>
    </div>
  );
}

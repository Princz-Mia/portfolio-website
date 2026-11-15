"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { DOOM_KEYS, createDoom, doomKeyCode, type DoomGame } from "./doomEngine";
import styles from "./LaptopScreen.module.css";

export { loadDoomModule } from "./doomEngine";

/** How a game ended: the quit button, Quit Game in Doom's menu, or a failure to start. */
export type DoomExit = "quit" | "exited" | "crashed";

export type RealDoomProps = {
  /** The compiled engine, shared between games. */
  module: WebAssembly.Module;
  /** Called once the engine is running. */
  onReady: () => void;
  /** Called once when the game ends. */
  onExit: (reason: DoomExit) => void;
};

type PadKey = { id: string; code: number; label: string; glyph?: string };

const PAD: PadKey[] = [
  { id: "left", code: DOOM_KEYS.left, label: "Turn left", glyph: "◀" },
  { id: "up", code: DOOM_KEYS.up, label: "Forward", glyph: "▲" },
  { id: "down", code: DOOM_KEYS.down, label: "Back", glyph: "▼" },
  { id: "right", code: DOOM_KEYS.right, label: "Turn right", glyph: "▶" },
  { id: "fire", code: DOOM_KEYS.fire, label: "fire" },
  { id: "use", code: DOOM_KEYS.use, label: "use" },
  { id: "enter", code: DOOM_KEYS.enter, label: "enter" },
  { id: "menu", code: DOOM_KEYS.escape, label: "menu" },
];

/** How long a keyboard press on a pad button holds its key down. */
const TAP_MS = 120;

/**
 * Real shareware Doom on a canvas. Keys go to the game while the canvas has
 * focus (Escape opens Doom's own menu); the quit button below leaves. Touch
 * screens get a pad. The game pauses while the tab is hidden and is torn down
 * when this unmounts.
 */
export function RealDoom({ module, onReady, onExit }: RealDoomProps) {
  const hintId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DoomGame | null>(null);
  // Engine codes held down, by keyboard key and by pad button, so every one
  // can be released when focus or the tab goes away.
  const keysRef = useRef(new Map<string, number>());
  const padsRef = useRef(new Map<string, number>());
  const tapsRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const callbacksRef = useRef({ onReady, onExit });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onReady, onExit };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const keys = keysRef.current;
    const pads = padsRef.current;
    const taps = tapsRef.current;
    let cancelled = false;
    let game: DoomGame | null = null;

    const releaseAll = () => {
      for (const code of [...keys.values(), ...pads.values()]) game?.keyUp(code);
      keys.clear();
      pads.clear();
    };
    const onVisibility = () => {
      if (document.hidden) releaseAll();
      game?.setPaused(document.hidden);
    };

    createDoom(module, canvas, () => {
      game = null;
      gameRef.current = null;
      if (!cancelled) callbacksRef.current.onExit("exited");
    }).then(
      (created) => {
        if (cancelled) return created.stop();
        try {
          created.start();
        } catch {
          created.stop();
          callbacksRef.current.onExit("crashed");
          return;
        }
        game = created;
        gameRef.current = created;
        if (document.hidden) created.setPaused(true);
        setReady(true);
        callbacksRef.current.onReady();
      },
      () => {
        if (!cancelled) callbacksRef.current.onExit("crashed");
      },
    );

    canvas.focus({ preventScroll: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      for (const timer of taps) clearTimeout(timer);
      taps.clear();
      releaseAll();
      game?.stop();
      game = null;
      gameRef.current = null;
    };
  }, [module]);

  function onKeyDown(e: KeyboardEvent<HTMLCanvasElement>) {
    const keys = keysRef.current;
    const firing = [...keys.values()].includes(DOOM_KEYS.fire);
    const code = doomKeyCode(e, firing);
    if (code === null) return;
    e.preventDefault();
    const id = e.code || e.key;
    if (e.repeat || keys.has(id)) return;
    keys.set(id, code);
    gameRef.current?.keyDown(code);
  }

  function onKeyUp(e: KeyboardEvent<HTMLCanvasElement>) {
    const keys = keysRef.current;
    const id = e.code || e.key;
    const code = keys.get(id);
    if (code === undefined) return;
    keys.delete(id);
    gameRef.current?.keyUp(code);
  }

  function releaseKeys() {
    for (const code of keysRef.current.values()) gameRef.current?.keyUp(code);
    keysRef.current.clear();
  }

  function press(id: string, code: number) {
    if (padsRef.current.has(id)) return;
    padsRef.current.set(id, code);
    gameRef.current?.keyDown(code);
  }

  function release(id: string) {
    const code = padsRef.current.get(id);
    if (code === undefined) return;
    padsRef.current.delete(id);
    gameRef.current?.keyUp(code);
  }

  /** A keyboard press on a pad button: down now, up a moment later. */
  function tap(id: string, code: number) {
    press(id, code);
    const timer = setTimeout(() => {
      tapsRef.current.delete(timer);
      release(id);
    }, TAP_MS);
    tapsRef.current.add(timer);
  }

  return (
    <div className={styles.game}>
      <div className={styles.view}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={640}
          height={400}
          tabIndex={0}
          role="application"
          aria-label="Doom"
          aria-describedby={hintId}
          aria-busy={!ready}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={releaseKeys}
          onPointerDown={(e) => e.currentTarget.focus({ preventScroll: true })}
        />
        {ready ? null : (
          <p className={styles.starting} aria-hidden="true">
            starting doom…
          </p>
        )}
      </div>
      <p id={hintId} className={styles.hint}>
        arrows move · ctrl or x fire · space use · shift run · , . strafe · 1–7 weapons · esc game
        menu · leave with quit to terminal
      </p>
      <div className={styles.pad} role="group" aria-label="Touch controls">
        {PAD.map(({ id, code, label, glyph }) => (
          <button
            key={id}
            type="button"
            className={`${styles.padButton} ${glyph ? "" : styles.padWord}`}
            aria-label={glyph ? label : undefined}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              press(id, code);
            }}
            onPointerUp={() => release(id)}
            onPointerCancel={() => release(id)}
            onLostPointerCapture={() => release(id)}
            // Keeps keyboard focus on the game when the pad is clicked with a mouse.
            onMouseDown={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => {
              if (e.detail === 0) tap(id, code);
            }}
          >
            {glyph ? <span aria-hidden="true">{glyph}</span> : label}
          </button>
        ))}
      </div>
      <div className={styles.gameBar}>
        <button
          type="button"
          className={styles.quit}
          onClick={() => callbacksRef.current.onExit("quit")}
        >
          quit to terminal
        </button>
        <a className={styles.credit} href="/doom/README.txt" target="_blank" rel="noopener">
          DOOM shareware © id Software · engine doom.wasm (GPL-2.0)
        </a>
      </div>
    </div>
  );
}

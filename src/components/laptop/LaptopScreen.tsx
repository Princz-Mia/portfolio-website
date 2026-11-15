"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { ART_SCREEN, ART_VIEWBOX } from "@/components/illustrations/WorkArt";
import { BANNER, PROMPT, run } from "./commands";
import { DukeRun, type DukeHandle, type DukeResult } from "./DukeRun";
import type { DoomExit, RealDoomProps } from "./RealDoom";
import styles from "./LaptopScreen.module.css";

type Mode = "closed" | "terminal" | "loading" | "doom" | "duke";
type Line = { id: number; text: string };
type Game = { RealDoom: ComponentType<RealDoomProps>; module: WebAssembly.Module };

export const MAX_LINES = 200;
const SHORTCUTS = ["whoami", "projects", "help", "clear"];

/**
 * The terminal keeps this size whatever it shows: long output scrolls inside
 * the log and the game scales to fit, so the panel never grows.
 */
export const PANEL_SIZE = {
  width: "min(100vw - 32px, 40rem)",
  height: "min(85dvh, 34rem)",
} as const;

const PANEL_STYLE = {
  "--panel-w": PANEL_SIZE.width,
  "--panel-h": PANEL_SIZE.height,
} as CSSProperties;

const CRASH = "doom: segmentation fault (core dumped)";
const CREDIT = "DOOM shareware © id Software · engine: doom.wasm (GPL-2.0), see /doom/README.txt";

const DUKE_STATUS =
  "Duke runner. Space, up or W jumps; down or S ducks; Escape goes back to the terminal.";

/** What the terminal prints when the Duke runner ends. */
export const dukeLine = ({ score, best }: DukeResult) => `duke: score ${score} (best ${best})`;

const EXIT_MESSAGES: Record<DoomExit, string> = {
  quit: "doom: quit. type doom to play again.",
  exited: "doom exited. thanks for playing.",
  crashed: CRASH,
};

/** A text progress bar, as a terminal would draw it. */
export function progressBar(fraction: number, width = 20): string {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const filled = Math.round(clamped * width);
  const percent = String(Math.floor(clamped * 100)).padStart(3, " ");
  return `[${"#".repeat(filled)}${".".repeat(width - filled)}] ${percent}%`;
}

const pct = (value: number) => `${(value * 100).toFixed(3)}%`;

/** The drawn screen's place in the drawing, as percentages of the drawing's box. */
const SCREEN_BOX: CSSProperties = {
  left: pct((ART_SCREEN.x - ART_VIEWBOX.x) / ART_VIEWBOX.w),
  top: pct((ART_SCREEN.y - ART_VIEWBOX.y) / ART_VIEWBOX.h),
  width: pct(ART_SCREEN.w / ART_VIEWBOX.w),
  height: pct(ART_SCREEN.h / ART_VIEWBOX.h),
  borderRadius: `${pct(ART_SCREEN.rx / ART_SCREEN.w)} / ${pct(ART_SCREEN.rx / ART_SCREEN.h)}`,
};

let doomChunk: Promise<typeof import("./RealDoom")> | null = null;

/** Loads the game's code once; a failed load (for example a stale chunk) can be retried. */
function loadDoomChunk() {
  if (!doomChunk) {
    doomChunk = import("./RealDoom");
    doomChunk.catch(() => {
      doomChunk = null;
    });
  }
  return doomChunk;
}

/** Loads the game's code, then fetches and compiles the engine (about 4.5 MB, once per page). */
async function loadDoom(onProgress: (fraction: number) => void): Promise<Game> {
  const chunk = await loadDoomChunk();
  return { RealDoom: chunk.RealDoom, module: await chunk.loadDoomModule(onProgress) };
}

// Hovering the doom button fetches only the small code chunk, never the engine.
const warmDoom = () => void loadDoomChunk().catch(() => undefined);

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const subscribeNever = () => () => {};

/**
 * Wraps the Work drawing and turns its laptop screen into a door to a small
 * terminal, which can run real shareware Doom and a Duke runner game. Until the page is hydrated it
 * renders only the drawing, so the static page never offers what it cannot do.
 */
export function LaptopScreen({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const ids = useId();
  const titleId = `${ids}-title`;
  const inputId = `${ids}-cmd`;

  const openerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const touchRef = useRef(false);
  const nextId = useRef(0);
  const loadToken = useRef(0);
  const downOnBackdropRef = useRef(false);
  const dukeRef = useRef<DukeHandle>(null);
  // Mirrors `mode` for handlers that can fire twice before a re-render, such as
  // the quit button followed by the dialog's cancel event.
  const modeRef = useRef<Mode>("closed");

  const [mode, setModeState] = useState<Mode>("closed");
  const [lines, setLines] = useState<Line[]>([]);
  const [greeted, setGreeted] = useState(false);
  const [ran, setRan] = useState(false);
  const [input, setInput] = useState("");
  // Read by a live region that stays mounted, so key messages are announced.
  const [status, setStatus] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  // Whole percent of the engine download, drawn as a bar while loading.
  const [progress, setProgress] = useState(0);

  function setMode(next: Mode) {
    modeRef.current = next;
    setModeState(next);
  }

  function append(texts: string[]) {
    const added = texts.map((text) => ({ id: nextId.current++, text }));
    setLines((current) => [...current, ...added].slice(-MAX_LINES));
  }

  // Back in the terminal (on open, after the game, after a failed load), focus
  // the input, or the dialog itself on touch so no on-screen keyboard pops up.
  useEffect(() => {
    if (mode !== "terminal") return;
    const target = touchRef.current ? dialogRef.current : inputRef.current;
    target?.focus({ preventScroll: true });
  }, [mode]);

  // The newest line stays in view; older ones scroll up inside the log.
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lines, mode, progress]);

  function open(e: MouseEvent<HTMLButtonElement>) {
    if (e.detail === 0) touchRef.current = false;
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setMode("terminal");
    if (!greeted) {
      setGreeted(true);
      append(BANNER);
      // Wait a frame so the open dialog is in the accessibility tree before the text changes.
      requestAnimationFrame(() => {
        if (dialogRef.current?.open) setStatus(BANNER.join(" "));
      });
    }
  }

  function backToTerminal(message: string) {
    loadToken.current++;
    append([message]);
    setStatus(message);
    setMode("terminal");
  }

  function startDoom() {
    if (modeRef.current !== "terminal") return;
    setMode("loading");
    setProgress(0);
    setStatus("loading doom");
    const token = ++loadToken.current;
    loadDoom((fraction) => {
      if (token === loadToken.current) setProgress(Math.floor(fraction * 100));
    }).then(
      (loaded) => {
        if (token !== loadToken.current) return;
        setGame(loaded);
        setMode("doom");
      },
      () => {
        if (token === loadToken.current) backToTerminal(CRASH);
      },
    );
  }

  function execute(raw: string) {
    const result = run(raw, { reducedMotion: prefersReducedMotion() });
    if (result.clear) return setLines([]);
    // A game can start only from an idle terminal, so a second one waits for the load to end.
    if ((result.doom || result.duke) && modeRef.current !== "terminal") {
      return append(["doom: still loading (esc to cancel)"]);
    }
    append(result.lines);
    if (result.exit) dialogRef.current?.close();
    else if (result.doom) startDoom();
    else if (result.duke) startDuke();
  }

  function startDuke() {
    if (modeRef.current !== "terminal") return;
    setMode("duke");
    setStatus(DUKE_STATUS);
  }

  function leaveDuke(result?: DukeResult) {
    if (modeRef.current !== "duke") return;
    const final = result ?? dukeRef.current?.finish() ?? { score: 0, best: 0 };
    backToTerminal(dukeLine(final));
  }

  function onReady() {
    setRan(true);
    append([CREDIT]);
    setStatus("Doom is running. Escape opens the game menu; the quit to terminal button leaves.");
  }

  function leaveGame(reason: DoomExit) {
    if (modeRef.current === "doom") backToTerminal(EXIT_MESSAGES[reason]);
  }

  // Escape belongs to Doom's own menu while the game has focus, so the dialog
  // never closes during a game. From the game's buttons, Escape goes back to
  // the terminal; while loading, it cancels the load. In the Duke runner,
  // Escape always goes back to the terminal.
  function onCancel(e: SyntheticEvent<HTMLDialogElement>) {
    if (modeRef.current === "duke") {
      e.preventDefault();
      leaveDuke();
    } else if (modeRef.current === "loading") {
      e.preventDefault();
      backToTerminal("doom: loading cancelled.");
    } else if (modeRef.current === "doom") {
      e.preventDefault();
      const canvas = dialogRef.current?.querySelector("canvas");
      if (!canvas || document.activeElement !== canvas) leaveGame("quit");
    }
  }

  function onClose() {
    // Closing in the middle of a run still leaves the score in the log.
    if (modeRef.current === "duke") {
      const result = dukeRef.current?.finish();
      if (result) append([dukeLine(result)]);
    }
    loadToken.current++;
    setMode("closed");
    setStatus("");
    openerRef.current?.focus({ preventScroll: true });
  }

  // Closes only when the press both started and ended on the backdrop, so a
  // text selection dragged out of the terminal does not close it.
  function onBackdrop(e: MouseEvent<HTMLDialogElement>) {
    const startedOnBackdrop = downOnBackdropRef.current;
    downOnBackdropRef.current = false;
    if (startedOnBackdrop && e.target === e.currentTarget && modeRef.current === "terminal") {
      e.currentTarget.close();
    }
  }

  if (!mounted) return <>{children}</>;

  return (
    <div className={styles.frame}>
      {children}
      <button
        ref={openerRef}
        type="button"
        className={styles.door}
        style={SCREEN_BOX}
        aria-label={`${ran ? "It runs Doom." : "Can it run Doom?"} Open the laptop terminal`}
        onPointerDown={(e) => {
          touchRef.current = e.pointerType !== "mouse";
        }}
        onClick={open}
      >
        <span className={styles.chip} aria-hidden="true">
          {ran ? "it runs Doom ✓" : "can it run Doom? ›"}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        style={PANEL_STYLE}
        aria-labelledby={titleId}
        tabIndex={-1}
        onCancel={onCancel}
        onClose={onClose}
        onPointerDown={(e) => {
          downOnBackdropRef.current = e.target === e.currentTarget;
        }}
        onClick={onBackdrop}
      >
        <div className={styles.screen}>
          <p role="status" className="visually-hidden">
            {status}
          </p>
          <div className={styles.titleBar}>
            <span className={styles.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <h2 id={titleId} className={styles.title}>
              {mode === "doom" || mode === "duke" ? `mia@desk: ~/${mode}` : "mia@desk: ~"}
            </h2>
            <button
              type="button"
              className={styles.close}
              aria-label="Close terminal"
              onClick={() => dialogRef.current?.close()}
            >
              ✕
            </button>
          </div>

          {mode === "doom" && game ? (
            <game.RealDoom module={game.module} onReady={onReady} onExit={leaveGame} />
          ) : mode === "duke" ? (
            <DukeRun ref={dukeRef} onExit={leaveDuke} onStatus={setStatus} />
          ) : (
            <>
              <ol ref={logRef} className={styles.log} role="log" aria-label="Terminal output">
                {lines.map((line) => (
                  <li key={line.id}>{line.text}</li>
                ))}
                {mode === "loading" ? (
                  <li aria-hidden="true">{progressBar(progress / 100)}</li>
                ) : null}
              </ol>
              <form
                className={styles.prompt}
                onSubmit={(e) => {
                  e.preventDefault();
                  execute(input);
                  setInput("");
                }}
              >
                <label htmlFor={inputId} className="visually-hidden">
                  Command
                </label>
                <span className={styles.ps1} aria-hidden="true">
                  {PROMPT}
                </span>
                <input
                  ref={inputRef}
                  id={inputId}
                  className={styles.input}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="send"
                />
              </form>
              <div className={styles.shortcuts}>
                <button
                  type="button"
                  className={`${styles.shortcut} ${styles.doom}`}
                  onPointerEnter={warmDoom}
                  onFocus={warmDoom}
                  onClick={() => execute("doom")}
                >
                  › doom
                </button>
                <button
                  type="button"
                  className={`${styles.shortcut} ${styles.duke}`}
                  onClick={() => execute("duke")}
                >
                  › duke
                </button>
                {SHORTCUTS.map((command) => (
                  <button
                    key={command}
                    type="button"
                    className={styles.shortcut}
                    onClick={() => execute(command)}
                  >
                    {command}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}

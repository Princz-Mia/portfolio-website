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
import type { DoomProps } from "./Doom";
import styles from "./LaptopScreen.module.css";

type Mode = "closed" | "terminal" | "loading" | "doom";
type Line = { id: number; text: string };

const MAX_LINES = 200;
const SHORTCUTS = ["whoami", "projects", "help", "clear"];

const pct = (value: number) => `${(value * 100).toFixed(3)}%`;

/** The drawn screen's place in the drawing, as percentages of the drawing's box. */
const SCREEN_BOX: CSSProperties = {
  left: pct((ART_SCREEN.x - ART_VIEWBOX.x) / ART_VIEWBOX.w),
  top: pct((ART_SCREEN.y - ART_VIEWBOX.y) / ART_VIEWBOX.h),
  width: pct(ART_SCREEN.w / ART_VIEWBOX.w),
  height: pct(ART_SCREEN.h / ART_VIEWBOX.h),
  borderRadius: `${pct(ART_SCREEN.rx / ART_SCREEN.w)} / ${pct(ART_SCREEN.rx / ART_SCREEN.h)}`,
};

let doomChunk: Promise<typeof import("./Doom")> | null = null;

/** Loads the game once; a failed load (for example a stale chunk) can be retried. */
function loadDoom() {
  if (!doomChunk) {
    doomChunk = import("./Doom");
    doomChunk.catch(() => {
      doomChunk = null;
    });
  }
  return doomChunk;
}

const warmDoom = () => void loadDoom().catch(() => undefined);

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const subscribeNever = () => () => {};

/**
 * Wraps the Work drawing and turns its laptop screen into a door to a small
 * terminal, which can run a tiny Doom-like maze. Until the page is hydrated it
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
  // Mirrors `mode` for handlers that can fire twice before a re-render, such as
  // Escape on the canvas followed by the dialog's cancel event.
  const modeRef = useRef<Mode>("closed");

  const [mode, setModeState] = useState<Mode>("closed");
  const [lines, setLines] = useState<Line[]>([]);
  const [greeted, setGreeted] = useState(false);
  const [won, setWon] = useState(false);
  const [input, setInput] = useState("");
  // Read by a live region that stays mounted, so key messages are announced.
  const [status, setStatus] = useState("");
  const [game, setGame] = useState<{ Doom: ComponentType<DoomProps>; stepMode: boolean } | null>(
    null,
  );

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

  useLayoutEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lines, mode]);

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

  function startDoom(stepMode: boolean) {
    setMode("loading");
    const token = ++loadToken.current;
    loadDoom().then(
      ({ Doom }) => {
        if (token !== loadToken.current) return;
        setGame({ Doom, stepMode });
        setMode("doom");
      },
      () => {
        if (token !== loadToken.current) return;
        append(["doom: segmentation fault (core dumped)"]);
        setMode("terminal");
      },
    );
  }

  function execute(raw: string) {
    const reducedMotion = prefersReducedMotion();
    const result = run(raw, { reducedMotion });
    if (result.clear) return setLines([]);
    append(result.lines);
    if (result.exit) dialogRef.current?.close();
    else if (result.doom) startDoom(reducedMotion);
  }

  function leaveGame(outcome: { won: boolean; seconds: number }) {
    if (modeRef.current !== "doom" && modeRef.current !== "loading") return;
    loadToken.current++;
    if (outcome.won) setWon(true);
    const message = outcome.won
      ? `You found the exit in ${outcome.seconds.toFixed(1)}s. Yes, it runs Doom.`
      : "doom: quit. type doom to try again.";
    append([message]);
    setStatus(message);
    setMode("terminal");
  }

  function onCancel(e: SyntheticEvent<HTMLDialogElement>) {
    if (modeRef.current === "doom" || modeRef.current === "loading") {
      e.preventDefault();
      leaveGame({ won: false, seconds: 0 });
    }
  }

  function onClose() {
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
        aria-label={`${won ? "It runs Doom." : "Can it run Doom?"} Open the laptop terminal`}
        onPointerDown={(e) => {
          touchRef.current = e.pointerType !== "mouse";
        }}
        onClick={open}
      >
        <span className={styles.chip} aria-hidden="true">
          {won ? "it runs Doom ✓" : "can it run Doom? ›"}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
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
              mia@desk: ~
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
            <game.Doom stepMode={game.stepMode} onExit={leaveGame} />
          ) : (
            <>
              <ol ref={logRef} className={styles.log} role="log" aria-label="Terminal output">
                {lines.map((line) => (
                  <li key={line.id}>{line.text}</li>
                ))}
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

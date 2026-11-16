"use client";

import { useEffect, useState, type RefObject } from "react";
import { desk } from "@/content";
import { DeskWindow } from "./DeskWindow";
import styles from "./CoffeeWindow.module.css";

type Step = { text: string; wait: number; kind?: "bar" | "error" | "done" };

/** The brew, line by line; `wait` is the pause before the line, in milliseconds. */
export const BREW: Step[] = [
  { text: "$ javac Coffee.java", wait: 250 },
  { text: "$ java Coffee --strength=double", wait: 500 },
  { text: "warming up the JVM…", wait: 500 },
  { text: "brewing", wait: 400, kind: "bar" },
  { text: 'Exception in thread "main" CupEmptyException: refill required', wait: 1500, kind: "error" },
  { text: "    at Mia.code(Desk.java:42)", wait: 150, kind: "error" },
  { text: "retrying with extra beans…", wait: 700 },
  { text: "Brewed! ☕ exit 0xCAFEBABE", wait: 900, kind: "done" },
];

/** Total time the brew takes with motion, in milliseconds. */
export const BREW_MS = BREW.reduce((sum, step) => sum + step.wait, 0);

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The brewing log; it starts over each time the window opens. */
function Brew({ onClose }: { onClose: () => void }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? BREW.length : 0));
  const done = shown >= BREW.length;

  useEffect(() => {
    if (shown >= BREW.length) return;
    const timer = window.setTimeout(() => setShown((n) => n + 1), BREW[shown].wait);
    return () => window.clearTimeout(timer);
  }, [shown]);

  const supportUrl = desk.supportUrl;

  return (
    <>
      <ol className={styles.log} role="log" aria-label="coffee.jar output">
        {BREW.slice(0, shown).map((step) => (
          <li key={step.text} className={step.kind ? styles[step.kind] : undefined}>
            {step.kind === "bar" ? (
              <>
                <span className={styles.track} aria-hidden="true">
                  <span className={styles.fill} />
                </span>
                <span className="visually-hidden">{step.text}</span>
              </>
            ) : (
              step.text
            )}
          </li>
        ))}
      </ol>
      {done ? (
        <div className={styles.outro}>
          {supportUrl ? (
            <>
              <p className={styles.say}>Enjoyed the page? A coffee fuels the next commit.</p>
              <div className={styles.actions}>
                <a className={styles.primary} href={supportUrl} target="_blank" rel="noopener noreferrer">
                  Buy me a coffee <span aria-hidden="true">↗</span>
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
                <button type="button" className={styles.secondary} onClick={onClose}>
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.say}>No tip jar yet: a refill of motivation is on the house.</p>
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={onClose}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

/**
 * The window the coffee mug opens on every third touch: a tiny Java program
 * brews a coffee (and throws on the first try). With a support page set in the
 * desk content it ends with a link to it; without one there is no payment
 * link at all.
 */
export function CoffeeWindow({
  open,
  onClose,
  opener,
}: {
  open: boolean;
  onClose: () => void;
  opener: RefObject<HTMLElement | null>;
}) {
  return (
    <DeskWindow open={open} onClose={onClose} opener={opener} title="coffee.jar" closeLabel="Close coffee.jar">
      {open ? <Brew onClose={onClose} /> : null}
    </DeskWindow>
  );
}

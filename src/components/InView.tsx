"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type InViewProps = {
  children: ReactNode;
  className?: string;
  /**
   * Wait for the intro curtain before starting, for drawings that are on screen
   * at load. Skipped when the curtain is not shown.
   */
  afterIntro?: boolean;
};

/** Milliseconds the intro curtain covers the page; matches globals.css. */
const INTRO_MS = 1350;

/**
 * Marks its subtree with `data-anim="pending"` once JavaScript runs and with
 * `data-anim="in"` the first time it scrolls into view. Illustrations key their
 * entrance animations on these attributes, so without JavaScript they simply
 * render in their finished state.
 */
export function InView({ children, className, afterIntro = false }: InViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"pending" | "in" | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const curtainShown =
      afterIntro &&
      !document.documentElement.classList.contains("intro-seen") &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let timer: number | undefined;
    // Defer so the pending state is applied in its own frame, not during render.
    const frame = requestAnimationFrame(() => setState("pending"));

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          timer = window.setTimeout(() => setState("in"), curtainShown ? INTRO_MS : 0);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [afterIntro]);

  return (
    <div ref={ref} className={className} data-anim={state ?? undefined}>
      {children}
    </div>
  );
}

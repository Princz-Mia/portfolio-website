"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type InViewProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Marks its subtree with `data-anim="pending"` once JavaScript runs and with
 * `data-anim="in"` the first time it scrolls into view. Illustrations key their
 * entrance animations on these attributes, so without JavaScript they simply
 * render in their finished state.
 */
export function InView({ children, className }: InViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"pending" | "in" | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }
    setState("pending");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("in");
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-anim={state ?? undefined}>
      {children}
    </div>
  );
}

import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

type ModelMotifProps = {
  className?: string;
};

/**
 * A quiet abstract motif of elements and transitions. Decorative only: it is not
 * a valid SysML diagram and does not depict any real model.
 */
export function ModelMotif({ className }: ModelMotifProps) {
  const transitions: { d: string; head: string; delay: number }[] = [
    { d: "M16 98 H24", head: "M18 94 L24 98 L18 102", delay: 0 },
    { d: "M88 92 C108 92 108 42 128 42", head: "M122 38 L128 42 L122 46", delay: 0.25 },
    { d: "M88 104 C108 104 108 158 128 158", head: "M122 154 L128 158 L122 162", delay: 0.35 },
    { d: "M192 42 C212 42 212 92 232 92", head: "M226 88 L232 92 L226 96", delay: 0.6 },
    { d: "M192 158 C212 158 212 104 232 104", head: "M226 100 L232 104 L226 108", delay: 0.7 },
    { d: "M296 98 H306", head: "M300 94 L306 98 L300 102", delay: 0.95 },
  ];

  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 324 200"
      width="324"
      height="200"
      aria-hidden="true"
      focusable="false"
    >
      {/* initial pseudo state */}
      <circle cx="10" cy="98" r="4" className={styles.fillInk} />

      {/* elements */}
      <rect x="24" y="80" width="64" height="36" rx="8" className={styles.stroke} />
      <path d="M36 94 H64 M36 102 H54" className={styles.strokeThin} />

      <rect x="128" y="24" width="64" height="36" rx="8" className={styles.stroke} />
      <path d="M140 38 H172 M140 46 H158" className={styles.strokeThin} />

      <rect x="128" y="140" width="64" height="36" rx="8" className={styles.stroke} />
      <path d="M140 154 H168 M140 162 H152" className={styles.strokeThin} />

      <rect
        x="232"
        y="80"
        width="64"
        height="36"
        rx="8"
        className={`${styles.fillTint} ${styles.strokeAccent}`}
      />
      <path d="M244 94 H276 M244 102 H262" className={styles.strokeAccent} opacity="0.6" />

      {/* final pseudo state */}
      <circle cx="313" cy="98" r="6" className={styles.stroke} />
      <circle cx="313" cy="98" r="2.5" className={styles.fillInk} />

      {/* transitions */}
      {transitions.map((t) => (
        <g key={t.d} style={{ "--delay": `${t.delay}s` } as CSSProperties}>
          <path d={t.d} pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
          <path d={t.head} pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
        </g>
      ))}
    </svg>
  );
}

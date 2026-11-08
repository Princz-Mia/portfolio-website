import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

/** A paper plane on its way, trail and all. */
export function ContactArt({ className }: { className?: string }) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 260 200"
      width="260"
      height="200"
      aria-hidden="true"
      focusable="false"
    >
      {/* trail */}
      <g style={delay(0)}>
        <path
          d="M16 150 C22 180 56 182 62 158 C66 140 46 134 42 150 C38 166 64 162 78 150 C96 136 108 128 124 122"
          pathLength={1}
          className={`${styles.strokeAccent} ${styles.draw}`}
        />
      </g>

      {/* plane */}
      <g className={styles.float}>
        <g className={styles.appear} style={delay(0.9)}>
          <path d="M226 56 L132 122 L148 160 Z" className={`${styles.fillPaper2} ${styles.stroke}`} />
          <path d="M226 56 L38 116 L132 122 Z" className={`${styles.fillPaper} ${styles.stroke}`} />
          <path d="M226 56 L132 122" className={styles.stroke} />
          <path d="M132 122 L120 142" className={styles.strokeThin} />
        </g>
      </g>

      {/* horizon */}
      <path d="M12 186 H248" className={styles.strokeThin} />
    </svg>
  );
}

import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

/** A chalkboard on an easel; the lesson writes itself out. */
export function TeachingArt({ className }: { className?: string }) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 260 200"
      width="260"
      height="200"
      aria-hidden="true"
      focusable="false"
    >
      {/* easel */}
      <path d="M52 192 L92 40 M208 192 L168 40 M130 192 V160" className={styles.stroke} />
      <path d="M92 40 L130 32 L168 40" className={styles.stroke} />
      <path d="M78 150 H182" className={styles.strokeThin} />

      {/* board */}
      <rect x="40" y="46" width="180" height="112" rx="3" className={`${styles.fillPaper2} ${styles.stroke}`} />
      <rect x="46" y="52" width="168" height="100" rx="2" className={styles.strokeThin} />

      {/* tray, chalk and eraser */}
      <rect x="36" y="158" width="188" height="7" rx="2" className={`${styles.fillPaper} ${styles.stroke}`} />
      <rect x="150" y="153" width="16" height="4.5" rx="1.5" className={`${styles.fillPaper} ${styles.stroke}`} />
      <rect x="66" y="149" width="28" height="8" rx="1.5" className={`${styles.fillTint} ${styles.strokeAccent}`} />

      {/* chalk writing */}
      <g style={delay(0)}>
        <path d="M62 72 H118" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
      </g>
      <g style={delay(0.25)}>
        <path d="M62 88 H146" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
      </g>
      <g style={delay(0.5)}>
        <path d="M72 102 Q62 112 72 122" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
        <path d="M156 102 Q166 112 156 122" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
      </g>
      <g style={delay(0.7)}>
        <path d="M84 106 H138" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
      </g>
      <g style={delay(0.85)}>
        <path d="M84 118 H120" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
      </g>
      <g style={delay(1.1)}>
        <path d="M174 128 L184 140 L204 116" pathLength={1} className={`${styles.strokeAccentBold} ${styles.draw}`} />
      </g>

      {/* floor */}
      <path d="M20 192 H240" className={styles.strokeThin} />
    </svg>
  );
}

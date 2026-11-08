import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

/** An open book with a mortarboard resting on it; the tassel swings. */
export function AcademicArt({ className }: { className?: string }) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 260 200"
      width="260"
      height="200"
      aria-hidden="true"
      focusable="false"
    >
      {/* page block under the open pages */}
      <path d="M30 150 V158 C62 148 100 148 130 160 C160 148 198 148 230 158 V150" className={styles.stroke} />
      <path d="M34 162 C64 153 100 153 130 165 C160 153 196 153 226 162" className={styles.strokeThin} />

      {/* pages */}
      <path
        d="M130 72 C100 60 60 60 30 70 V150 C60 140 100 140 130 152 Z"
        className={`${styles.fillPaper} ${styles.stroke}`}
      />
      <path
        d="M130 72 C160 60 200 60 230 70 V150 C200 140 160 140 130 152 Z"
        className={`${styles.fillPaper} ${styles.stroke}`}
      />
      <path d="M130 72 V152" className={styles.stroke} />

      {/* text */}
      <g style={delay(0)}>
        <path d="M46 88 C68 82 94 82 116 88" pathLength={1} className={`${styles.strokeThin} ${styles.draw}`} />
      </g>
      <g style={delay(0.15)}>
        <path d="M46 102 C68 96 90 96 110 101" pathLength={1} className={`${styles.strokeThin} ${styles.draw}`} />
      </g>
      <g style={delay(0.3)}>
        <path d="M46 116 C68 110 94 110 116 116" pathLength={1} className={`${styles.strokeThin} ${styles.draw}`} />
      </g>
      <g style={delay(0.45)}>
        <path d="M46 130 C66 124 84 124 100 128" pathLength={1} className={`${styles.strokeAccent} ${styles.draw}`} />
      </g>
      <g style={delay(0.5)}>
        <path d="M146 118 C166 112 190 112 214 118" pathLength={1} className={`${styles.strokeThin} ${styles.draw}`} />
      </g>
      <g style={delay(0.65)}>
        <path d="M146 132 C166 126 184 126 200 130" pathLength={1} className={`${styles.strokeThin} ${styles.draw}`} />
      </g>

      {/* mortarboard */}
      <g className={styles.appear} style={delay(0.4)}>
        <path d="M178 94 L180 108 C192 116 210 112 214 102 L215 90" className={`${styles.fillPaper} ${styles.stroke}`} />
        <path d="M152 72 L212 48 L246 74 L186 98 Z" className={`${styles.fillPaper} ${styles.stroke}`} />
        <path d="M166 76 L212 58" className={styles.strokeThin} />
        <circle cx="200" cy="72" r="2.5" className={styles.fillInk} />
        <g className={styles.sway} style={{ "--origin": "0% 0%" } as CSSProperties}>
          <path d="M200 72 Q216 86 222 110" className={styles.strokeAccent} />
          <path d="M216 110 L213 126 M220 110 L220 128 M224 110 L227 126" className={styles.strokeAccent} />
          <path d="M214 108 H226" className={styles.strokeAccentBold} />
        </g>
      </g>

      {/* desk */}
      <path d="M12 176 H248" className={styles.strokeThin} />
    </svg>
  );
}

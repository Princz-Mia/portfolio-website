import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

/** A drafting compass sketching a system on grid paper. */
export function ProjectsArt({ className }: { className?: string }) {
  const verticals = [55, 80, 105, 130, 155, 180, 205];
  const horizontals = [55, 80, 105, 130, 155];
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 260 200"
      width="260"
      height="200"
      aria-hidden="true"
      focusable="false"
    >
      {/* sheet */}
      <rect x="30" y="30" width="200" height="150" rx="3" className={`${styles.fillPaper} ${styles.stroke}`} />
      <path
        d={verticals.map((x) => `M${x} 30 V180`).join(" ")}
        className={styles.strokeThin}
        opacity="0.25"
      />
      <path
        d={horizontals.map((y) => `M30 ${y} H230`).join(" ")}
        className={styles.strokeThin}
        opacity="0.25"
      />

      {/* sketch on the sheet */}
      <g style={delay(0)}>
        <rect x="56" y="56" width="42" height="24" rx="3" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
      </g>
      <g style={delay(0.3)}>
        <path d="M98 68 H118 V118 H128" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
        <path d="M123 114 L128 118 L123 122" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
      </g>
      <g style={delay(0.6)}>
        <rect x="128" y="106" width="44" height="24" rx="3" pathLength={1} className={`${styles.strokeAccent} ${styles.draw}`} />
      </g>
      <path d="M64 64 H90 M64 72 H80 M136 114 H164 M136 122 H152" className={styles.strokeThin} />

      {/* the arc being drawn, centred on the needle */}
      <g style={delay(0.9)}>
        <path
          d="M206 124 A44 44 0 0 1 162 168"
          pathLength={1}
          className={`${styles.strokeAccent} ${styles.draw}`}
        />
      </g>

      {/* compass */}
      <g className={styles.appear} style={delay(0.2)}>
        <path d="M178 62 L162 124" className={styles.strokeBold} />
        <path d="M178 62 L206 124" className={styles.strokeBold} />
        <path d="M168 100 Q182 94 198 104" className={styles.strokeThin} />
        <circle cx="178" cy="60" r="4.5" className={`${styles.fillPaper} ${styles.stroke}`} />
        <path d="M178 55 V44" className={styles.stroke} />
        <circle cx="178" cy="42" r="2.5" className={styles.fillInk} />
        <path d="M202 116 L206 124" className={styles.strokeAccentBold} />
      </g>

      {/* desk edge */}
      <path d="M12 190 H248" className={styles.strokeThin} />
    </svg>
  );
}

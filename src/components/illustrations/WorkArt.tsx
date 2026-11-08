import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

/** A rack of services feeding a small cluster: the shape of backend work. */
export function WorkArt({ className }: { className?: string }) {
  const units = [50, 80, 110];
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 260 200"
      width="260"
      height="200"
      aria-hidden="true"
      focusable="false"
    >
      {/* rack */}
      <rect x="14" y="40" width="102" height="104" rx="7" className={styles.stroke} />
      {units.map((y, index) => (
        <g key={y} style={delay(index * 0.12)} className={styles.appear}>
          <rect x="24" y={y} width="82" height="22" rx="4" className={styles.stroke} />
          <path d={`M46 ${y + 8} H96 M46 ${y + 15} H78`} className={styles.strokeThin} />
          <circle
            cx="34"
            cy={y + 11}
            r="2.5"
            className={`${styles.fillAccent} ${styles.pulse}`}
            style={{ animationDelay: `${index * 0.9}s` }}
          />
        </g>
      ))}
      <path d="M40 144 V152 M90 144 V152 M30 152 H100" className={styles.strokeThin} />

      {/* pipes to the cluster */}
      <g style={delay(0.4)}>
        <path
          d="M116 92 H142 C154 92 154 70 166 70 H178"
          pathLength={1}
          className={`${styles.stroke} ${styles.draw}`}
        />
        <path
          d="M116 92 H142 C154 92 154 122 166 122 H178"
          pathLength={1}
          className={`${styles.stroke} ${styles.draw}`}
        />
      </g>
      <path
        d="M116 92 H142 C154 92 154 70 166 70 H178 M116 92 H142 C154 92 154 122 166 122 H178"
        className={`${styles.strokeAccent} ${styles.flow}`}
        opacity="0.9"
      />

      {/* hexagon cluster */}
      <g style={delay(0.9)} className={styles.appear}>
        <path
          d="M212 70 L204 83.9 L188 83.9 L180 70 L188 56.1 L204 56.1 Z"
          className={`${styles.fillPaper} ${styles.stroke}`}
        />
        <path
          d="M212 122 L204 135.9 L188 135.9 L180 122 L188 108.1 L204 108.1 Z"
          className={`${styles.fillPaper} ${styles.stroke}`}
        />
        <path
          d="M244 96 L236 109.9 L220 109.9 L212 96 L220 82.1 L236 82.1 Z"
          className={`${styles.fillTint} ${styles.strokeAccent}`}
        />
        <path d="M207 80 L217 88 M207 112 L217 104" className={styles.stroke} />
        <circle cx="196" cy="70" r="2.5" className={styles.fillInk} />
        <circle cx="196" cy="122" r="2.5" className={styles.fillInk} />
        <circle cx="228" cy="96" r="2.5" className={styles.fillAccent} />
      </g>

      {/* ground */}
      <path d="M10 166 H250" className={styles.strokeThin} />
    </svg>
  );
}

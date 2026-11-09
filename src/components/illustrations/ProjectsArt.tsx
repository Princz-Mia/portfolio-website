import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

type Candle = { x: number; open: number; close: number; high: number; low: number };

/** A price chart from the trading project: candles, and the line they make. */
export function ProjectsArt({ className }: { className?: string }) {
  const candles: Candle[] = [
    { x: 70, open: 200, close: 180, high: 170, low: 212 },
    { x: 104, open: 180, close: 196, high: 172, low: 206 },
    { x: 138, open: 196, close: 162, high: 150, low: 202 },
    { x: 172, open: 162, close: 170, high: 150, low: 184 },
    { x: 206, open: 170, close: 134, high: 124, low: 178 },
    { x: 240, open: 134, close: 148, high: 126, low: 160 },
    { x: 274, open: 148, close: 116, high: 104, low: 156 },
    { x: 308, open: 116, close: 128, high: 100, low: 140 },
    { x: 342, open: 128, close: 96, high: 86, low: 134 },
  ];
  const line = candles.map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${(c.open + c.close) / 2}`).join(" ");

  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 400 300"
      width="400"
      height="300"
      aria-hidden="true"
      focusable="false"
    >
      {/* axes */}
      <path d="M48 60 V246 H370" className={styles.stroke} />
      <path d="M48 100 H370 M48 150 H370 M48 200 H370" className={styles.strokeThin} opacity="0.35" />
      <path d="M42 100 H48 M42 150 H48 M42 200 H48" className={styles.stroke} />

      {/* candles */}
      {candles.map((c, index) => {
        const up = c.close < c.open;
        const top = Math.min(c.open, c.close);
        const height = Math.max(4, Math.abs(c.open - c.close));
        return (
          <g key={c.x} className={styles.appear} style={delay(0.1 + index * 0.08)}>
            <path d={`M${c.x} ${c.high} V${c.low}`} className={styles.stroke} />
            <rect
              x={c.x - 8}
              y={top}
              width="16"
              height={height}
              className={up ? `${styles.fillPaper} ${styles.stroke}` : `${styles.fillInk} ${styles.stroke}`}
            />
          </g>
        );
      })}

      {/* the line through them */}
      <g style={delay(0.9)}>
        <path d={line} pathLength={1} className={`${styles.strokeAccent} ${styles.draw}`} />
      </g>
      <circle cx="342" cy="112" r="4" className={`${styles.fillAccent} ${styles.appear}`} style={delay(1.9)} />
    </svg>
  );
}

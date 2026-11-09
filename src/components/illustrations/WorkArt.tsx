import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

function hexagon(cx: number, cy: number, r: number): string {
  const h = r * 0.866;
  return `M${cx + r} ${cy} L${cx + r / 2} ${cy + h} L${cx - r / 2} ${cy + h} L${cx - r} ${cy} L${cx - r / 2} ${cy - h} L${cx + r / 2} ${cy - h} Z`;
}

/** A honeycomb of services: a few of them alive and talking to each other. */
export function WorkArt({ className }: { className?: string }) {
  const r = 40;
  const dx = 63;
  const dy = 36.4;
  const cells: [number, number][] = [
    [200, 170],
    [200 - dx, 170 - dy],
    [200 + dx, 170 - dy],
    [200 - dx, 170 + dy],
    [200 + dx, 170 + dy],
    [200, 170 - 2 * dy],
    [200, 170 + 2 * dy],
  ];
  const alive = [0, 2, 3, 6];

  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 400 340"
      width="400"
      height="340"
      aria-hidden="true"
      focusable="false"
    >
      {cells.map(([cx, cy], index) => (
        <g key={`${cx}-${cy}`} style={delay(index * 0.08)}>
          <path d={hexagon(cx, cy, r)} pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
        </g>
      ))}
      <g style={delay(0.7)}>
        <path
          d={`M${cells[2][0]} ${cells[2][1]} L${cells[0][0]} ${cells[0][1]} L${cells[3][0]} ${cells[3][1]} M${cells[0][0]} ${cells[0][1]} L${cells[6][0]} ${cells[6][1]}`}
          pathLength={1}
          className={`${styles.strokeThin} ${styles.draw}`}
        />
      </g>
      <path
        d={`M${cells[2][0]} ${cells[2][1]} L${cells[0][0]} ${cells[0][1]} L${cells[3][0]} ${cells[3][1]} M${cells[0][0]} ${cells[0][1]} L${cells[6][0]} ${cells[6][1]}`}
        className={`${styles.strokeAccent} ${styles.flow}`}
      />
      {alive.map((index, order) => (
        <circle
          key={index}
          cx={cells[index][0]}
          cy={cells[index][1]}
          r="4"
          className={`${index === 0 ? styles.fillAccent : styles.fillInk} ${styles.appear}`}
          style={delay(0.8 + order * 0.1)}
        />
      ))}
    </svg>
  );
}

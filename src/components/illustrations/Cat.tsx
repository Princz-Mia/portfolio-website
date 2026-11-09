import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

type CatProps = {
  className?: string;
};

/** A cat curled up asleep, drawn in a few calm lines. The tail tip stirs. */
export function Cat({ className }: CatProps) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 260 180"
      width="260"
      height="180"
      role="img"
      aria-labelledby="cat-title"
      focusable="false"
    >
      <title id="cat-title">Line drawing of a cat curled up asleep</title>

      {/* tail, wrapped along the front */}
      <g className={styles.swayTail} style={{ "--origin": "100% 50%" } as CSSProperties}>
        <path d="M60 128 C40 142 48 164 84 160 C120 156 160 152 198 148" className={styles.strokeBold} />
      </g>

      {/* body */}
      <path
        d="M58 112 C50 72 96 48 142 52 C190 56 222 76 224 108 C226 134 204 150 168 152 C120 154 66 150 58 112 Z"
        className={`${styles.fillPaper} ${styles.stroke}`}
      />
      {/* curl line */}
      <path d="M96 110 C110 90 150 84 176 96" className={styles.strokeThin} />

      {/* head */}
      <circle cx="186" cy="96" r="32" className={`${styles.fillPaper} ${styles.stroke}`} />
      <path d="M164 74 L166 44 L186 66" className={`${styles.fillPaper} ${styles.stroke}`} />
      <path d="M200 66 L216 44 L214 74" className={`${styles.fillPaper} ${styles.stroke}`} />
      <path d="M168 70 L169 54 M210 70 L210 54" className={styles.strokeThin} />

      {/* face, eyes shut */}
      <path d="M172 98 Q178 104 184 98 M190 98 Q196 104 202 98" className={styles.stroke} />
      <path d="M184 108 H190 L187 112 Z" className={styles.fillAccent} />
      <path d="M187 112 Q184 117 179 115 M187 112 Q190 117 195 115" className={styles.stroke} />
      <path d="M166 106 L144 104 M166 110 L146 116 M208 106 L230 104 M208 110 L228 116" className={styles.strokeThin} />

      {/* ground */}
      <path d="M34 166 H236" className={styles.strokeThin} />
    </svg>
  );
}

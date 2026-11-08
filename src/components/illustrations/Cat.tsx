import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

type CatProps = {
  className?: string;
};

/** A cat sitting up and looking at you. Its tail sways and it blinks now and then. */
export function Cat({ className }: CatProps) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 200 220"
      width="200"
      height="220"
      role="img"
      aria-labelledby="cat-title"
      focusable="false"
    >
      <title id="cat-title">Line drawing of a cat sitting and looking at you</title>

      {/* tail */}
      <g className={styles.swayTail} style={{ "--origin": "0% 80%" } as CSSProperties}>
        <path
          d="M144 196 C178 200 190 174 174 160 C162 150 148 164 158 174"
          className={styles.strokeBold}
        />
      </g>

      {/* body */}
      <path
        d="M62 206 C48 170 54 134 86 118 C98 112 112 112 124 118 C156 134 160 170 146 206 Z"
        className={`${styles.fillPaper} ${styles.stroke}`}
      />
      {/* chest */}
      <path d="M92 136 L96 142 L100 136 L104 142 L108 136 L112 142 L116 136" className={styles.strokeThin} />
      {/* legs and paws */}
      <path d="M86 156 C84 172 84 190 86 206 M122 156 C124 172 124 190 122 206" className={styles.stroke} />
      <path d="M70 206 Q86 196 100 206 M108 206 Q122 196 138 206" className={styles.stroke} />
      <path d="M82 204 V208 M90 203 V208 M118 203 V208 M126 204 V208" className={styles.strokeThin} />

      {/* ears */}
      <path d="M74 62 L66 24 L96 50" className={`${styles.fillPaper} ${styles.stroke}`} />
      <path d="M134 62 L142 24 L112 50" className={`${styles.fillPaper} ${styles.stroke}`} />
      <path d="M78 58 L73 38 L90 52 Z" className={styles.fillTint} />
      <path d="M130 58 L135 38 L118 52 Z" className={styles.fillTint} />

      {/* head */}
      <circle cx="104" cy="84" r="36" className={`${styles.fillPaper} ${styles.stroke}`} />
      {/* forehead stripes */}
      <path d="M96 54 L98 66 M104 52 V66 M112 54 L110 66" className={styles.strokeThin} />
      {/* cheeks */}
      <path d="M70 92 Q74 100 82 104 M138 92 Q134 100 126 104" className={styles.strokeThin} />

      {/* eyes */}
      <g className={styles.blink}>
        <ellipse cx="90" cy="84" rx="7" ry="8" className={styles.fillDark} />
        <ellipse cx="118" cy="84" rx="7" ry="8" className={styles.fillDark} />
        <circle cx="92.5" cy="80.5" r="2.2" className={styles.fillPaper} />
        <circle cx="120.5" cy="80.5" r="2.2" className={styles.fillPaper} />
      </g>

      {/* nose and mouth */}
      <path d="M100.5 96 H107.5 L104 100.5 Z" className={styles.fillAccent} />
      <path d="M104 100.5 Q100 107 94 103.5 M104 100.5 Q108 107 114 103.5" className={styles.stroke} />

      {/* whiskers */}
      <path
        d="M80 95 L52 90 M80 100 L52 102 M128 95 L156 90 M128 100 L156 102"
        className={styles.strokeThin}
      />

      {/* collar and bell */}
      <path d="M82 122 Q104 136 126 122" className={styles.strokeAccentBold} />
      <circle cx="104" cy="131" r="3.5" className={`${styles.fillAccent}`} />
      <circle cx="104" cy="131" r="1.2" className={styles.fillPaper} />

      {/* ground */}
      <path d="M44 208 H190" className={styles.strokeThin} />
    </svg>
  );
}

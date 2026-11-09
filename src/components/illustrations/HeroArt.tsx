import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

/** A cat, sitting in profile, batting at an atom whose electrons keep orbiting. */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 420 360"
      width="420"
      height="360"
      role="img"
      aria-labelledby="hero-art-title"
      focusable="false"
    >
      <title id="hero-art-title">Line drawing of a cat batting at an atom</title>

      {/* atom */}
      <g className={styles.orbit} style={{ "--origin": "50% 50%" } as CSSProperties}>
        <g style={delay(0.2)}>
          <ellipse cx="76" cy="186" rx="46" ry="15" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
        </g>
        <g style={delay(0.35)}>
          <ellipse cx="76" cy="186" rx="46" ry="15" transform="rotate(60 76 186)" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
        </g>
        <g style={delay(0.5)}>
          <ellipse cx="76" cy="186" rx="46" ry="15" transform="rotate(120 76 186)" pathLength={1} className={`${styles.stroke} ${styles.draw}`} />
        </g>
        <circle cx="122" cy="186" r="3" className={styles.fillInk} />
        <circle cx="53" cy="172" r="3" transform="rotate(60 76 186)" className={styles.fillInk} />
        <circle cx="99" cy="172" r="3" transform="rotate(120 76 186)" className={styles.fillInk} />
      </g>
      <circle cx="76" cy="186" r="5.5" className={styles.fillAccent} />

      {/* cat */}
      <g className={styles.appear} style={delay(0.1)}>
        {/* tail */}
        <g className={styles.swayTail} style={{ "--origin": "0% 50%" } as CSSProperties}>
          <path d="M284 318 C322 318 340 288 324 266 C310 250 290 266 302 282" className={styles.stroke} />
        </g>
        {/* body and head, one outline */}
        <path
          d="M118 150 C124 136 130 124 138 118 L150 76 L170 112 C174 113 178 114 182 116 L190 84 L206 124 C214 128 220 134 226 142 C262 170 290 232 290 300 C290 322 282 334 270 338 L178 338 C172 320 172 290 170 260 C166 230 150 200 132 178 C126 168 120 160 118 150 Z"
          className={`${styles.fillPaper} ${styles.stroke}`}
        />
        {/* haunch and inner front leg */}
        <path d="M268 338 C274 308 262 284 238 282" className={styles.strokeThin} />
        <path d="M200 338 C198 312 200 290 206 272" className={styles.strokeThin} />
        <path d="M186 338 V333 M194 338 V333 M250 338 V333 M258 338 V333" className={styles.strokeThin} />
        {/* raised paw reaching for the atom */}
        <path d="M172 242 C152 230 132 220 116 210 C108 205 104 212 112 216 C118 219 124 216 126 212" className={`${styles.fillPaper} ${styles.stroke}`} />
        {/* face */}
        <path d="M138 146 Q146 138 154 146" className={styles.stroke} />
        <path d="M118 150 L125 149" className={styles.stroke} />
        <path d="M122 152 Q125 158 131 156" className={styles.stroke} />
        <path d="M130 160 L96 154 M130 164 L96 166 M130 168 L100 178" className={styles.strokeThin} />
        <path d="M144 112 L148 100 M160 122 L158 110" className={styles.strokeThin} />
      </g>

      {/* ground */}
      <path d="M100 342 H330" className={styles.strokeThin} />
    </svg>
  );
}

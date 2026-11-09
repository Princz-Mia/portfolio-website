import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

type BannerProps = {
  className?: string;
};

/**
 * A war banner in the Horde's colours: red cloth on a spiked standard, with a
 * jagged black ring and an angular, pointed emblem inside it. Drawn by hand as an
 * homage to the faction's crest; it is not the official artwork.
 */
export function Banner({ className }: BannerProps) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 220 300"
      width="220"
      height="300"
      role="img"
      aria-labelledby="banner-title"
      focusable="false"
    >
      <title id="banner-title">A red war banner with a jagged black crest, in the style of the Horde</title>

      {/* standard */}
      <path d="M36 32 V292" className={styles.strokeBold} />
      <path d="M36 4 L26 30 H46 Z" className={styles.fillDark} />
      <path d="M36 50 H198" className={styles.strokeBold} />
      <path d="M196 44 L214 50 L196 56 Z" className={styles.fillDark} />
      <path d="M70 50 L74 38 L78 50 M110 50 L114 36 L118 50 M150 50 L154 38 L158 50" className={styles.fillDark} />

      {/* cloth */}
      <g className={styles.sway} style={{ "--origin": "50% 0%" } as CSSProperties}>
        <path d="M60 50 V58 M172 50 V58" className={styles.stroke} />
        <path
          d="M50 58 H182 V212 L166 234 L152 214 L138 242 L120 216 L102 246 L86 218 L70 238 L50 214 Z"
          className={`${styles.fillAccent} ${styles.strokeDeep}`}
        />
        <path d="M50 62 H182 V74 H50 Z" className={styles.fillDark} />
        <path d="M72 84 V196 M160 84 V196" className={styles.strokePaper} opacity="0.18" />

        {/* crest: jagged ring */}
        <path
          d="M162 146 L152.1 157.7 L153.2 173 L138.3 176.7 L130.2 189.7 L116 184 L101.8 189.7 L93.7 176.7 L78.8 173 L79.9 157.7 L70 146 L79.9 134.3 L78.8 119 L93.7 115.3 L101.8 102.3 L116 108 L130.2 102.3 L138.3 115.3 L153.2 119 L152.1 134.3 Z"
          className={styles.ring}
        />
        {/* crest: pointed arch with a spike beneath */}
        <path d="M116 106 L150 180 L136 180 L116 138 L96 180 L82 180 Z" className={styles.fillDark} />
        <path d="M109 154 L116 198 L123 154 Z" className={styles.fillDark} />
      </g>

      {/* ground */}
      <path d="M14 294 H120" className={styles.strokeThin} />
    </svg>
  );
}

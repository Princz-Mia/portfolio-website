import type { CSSProperties } from "react";
import styles from "./illustrations.module.css";

type BannerProps = {
  className?: string;
};

/**
 * A Horde-inspired war banner: a spear-topped pole, a spiked crossbar and a
 * tattered red cloth with a dark angular crest. The crest is original artwork; it
 * evokes the faction without reproducing its official mark.
 */
export function Banner({ className }: BannerProps) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 200 260"
      width="200"
      height="260"
      role="img"
      aria-labelledby="banner-title"
      focusable="false"
    >
      <title id="banner-title">A tattered red war banner with a dark crest, in the style of the Horde</title>

      {/* pole with spearhead */}
      <path d="M40 30 V250" className={styles.strokeBold} />
      <path d="M40 4 L31 28 H49 Z" className={styles.fillDark} />
      <path d="M34 36 H46" className={styles.stroke} />

      {/* crossbar with spiked ends */}
      <path d="M40 48 H176" className={styles.strokeBold} />
      <path d="M174 42 L192 48 L174 54 Z" className={styles.fillDark} />
      <path d="M88 48 L92 36 L96 48 M132 48 L136 36 L140 48" className={styles.fillDark} />
      <path d="M62 48 V56 M150 48 V56" className={styles.stroke} />

      {/* cloth */}
      <g className={styles.sway} style={{ "--origin": "50% 0%" } as CSSProperties}>
        <path
          d="M56 56 H156 V196 L146 214 L136 198 L124 226 L108 202 L96 230 L82 206 L70 222 L56 198 Z"
          className={`${styles.fillAccent} ${styles.strokeDeep}`}
        />
        <path d="M56 60 H156 V72 H56 Z" className={styles.fillDeep} />
        <path d="M72 80 V184 M140 80 V184" className={styles.strokePaper} opacity="0.2" />
        <path d="M64 188 H148" className={styles.strokePaper} opacity="0.35" />

        {/* crest: a jagged ring around an angular, tusked emblem */}
        <path
          d="M106 90 L119 100.6 L135.7 102.3 L137.4 119 L148 132 L137.4 145 L135.7 161.7 L119 163.4 L106 174 L93 163.4 L76.3 161.7 L74.6 145 L64 132 L74.6 119 L76.3 102.3 L93 100.6 Z"
          className={styles.fillDeep}
        />
        <circle cx="106" cy="132" r="28" className={styles.fillAccent} />
        <path d="M106 108 L126 122 L121 150 L106 160 L91 150 L86 122 Z" className={styles.fillDark} />
        <path d="M106 124 L115 136 L106 148 L97 136 Z" className={styles.fillAccent} />
        <path d="M91 150 L82 162 L98 156 Z M121 150 L130 162 L114 156 Z" className={styles.fillDark} />
        <path d="M86 122 L76 116 L90 114 Z M126 122 L136 116 L122 114 Z" className={styles.fillDark} />
      </g>

      {/* ground */}
      <path d="M18 252 H118" className={styles.strokeThin} />
    </svg>
  );
}

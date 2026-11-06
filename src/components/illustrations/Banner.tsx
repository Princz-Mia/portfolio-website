import styles from "./illustrations.module.css";

type BannerProps = {
  className?: string;
};

/**
 * An original fantasy war banner in the site's oxblood. It alludes to the Horde
 * without reproducing any official mark.
 */
export function Banner({ className }: BannerProps) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 160 220"
      width="160"
      height="220"
      role="img"
      aria-labelledby="banner-title"
      focusable="false"
    >
      <title id="banner-title">A fantasy war banner in oxblood hanging from a pole</title>

      {/* pole and crossbar */}
      <path d="M24 12 V212" className={styles.stroke} />
      <circle cx="24" cy="9" r="4" className={styles.fillInk} />
      <path d="M24 36 H142" className={styles.stroke} />
      <circle cx="143" cy="36" r="3" className={styles.fillInk} />
      {/* cords */}
      <path d="M40 40 L34 56 M130 40 L136 56" className={styles.strokeThin} />

      {/* cloth */}
      <path
        d="M38 40 H132 V166 L85 198 L38 166 Z"
        className={`${styles.fillAccent} ${styles.strokeDeep}`}
      />
      {/* fold */}
      <path d="M58 44 V174" className={styles.strokePaper} opacity="0.25" />
      {/* stripes */}
      <path d="M46 150 H124 M46 156 H124" className={styles.strokePaper} opacity="0.7" />

      {/* emblem: ring with a diamond and two horns */}
      <circle cx="85" cy="98" r="24" className={styles.strokePaper} />
      <path d="M85 84 L97 98 L85 112 L73 98 Z" className={styles.fillPaper} />
      <path d="M62 112 Q60 90 74 80 M108 112 Q110 90 96 80" className={styles.strokePaper} />

      {/* ground */}
      <path d="M8 214 H64" className={styles.strokeThin} />
    </svg>
  );
}

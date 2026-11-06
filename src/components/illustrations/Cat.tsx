import styles from "./illustrations.module.css";

type CatProps = {
  className?: string;
};

/** A sleeping cat in the same line-art language as the rest of the site. */
export function Cat({ className }: CatProps) {
  return (
    <svg
      className={`${styles.figure} ${className ?? ""}`}
      viewBox="0 0 200 160"
      width="200"
      height="160"
      role="img"
      aria-labelledby="cat-title"
      focusable="false"
    >
      <title id="cat-title">Line drawing of a cat curled up asleep</title>

      {/* body */}
      <path
        d="M30 118 C28 84 66 62 110 66 C150 70 176 90 174 118 C172 136 150 142 110 142 C70 142 32 142 30 118 Z"
        className={styles.stroke}
      />
      {/* tail */}
      <path
        d="M36 132 C14 136 6 110 24 102 C38 96 48 110 40 120"
        className={styles.stroke}
      />
      {/* front paw */}
      <path d="M116 130 Q128 138 142 130" className={styles.stroke} />
      <path d="M124 132 V137 M130 134 V139 M136 132 V137" className={styles.strokeThin} />

      {/* head */}
      <circle cx="138" cy="84" r="24" className={`${styles.fillPaper} ${styles.stroke}`} />
      {/* ears */}
      <path d="M121 68 L117 42 L135 61" className={`${styles.fillPaper} ${styles.stroke}`} />
      <path d="M142 61 L160 42 L156 68" className={`${styles.fillPaper} ${styles.stroke}`} />
      <path d="M123 60 L121 50 M154 60 L156 50" className={styles.strokeThin} />

      {/* face */}
      <path d="M125 86 Q130 91 135 86" className={styles.stroke} />
      <path d="M142 86 Q147 91 152 86" className={styles.stroke} />
      <path d="M135 94 L141 94 L138 98 Z" className={styles.fillInk} />
      <path d="M138 98 Q135 103 131 101 M138 98 Q141 103 145 101" className={styles.stroke} />
      {/* whiskers */}
      <path
        d="M118 94 L100 90 M118 99 L100 102 M158 94 L176 90 M158 99 L176 102"
        className={styles.strokeThin}
      />

      {/* collar */}
      <path d="M120 103 Q138 115 156 103" className={styles.strokeAccent} />
      <circle cx="138" cy="112" r="3" className={styles.fillAccent} />

      {/* ground */}
      <path d="M18 146 H182" className={styles.strokeThin} />
    </svg>
  );
}

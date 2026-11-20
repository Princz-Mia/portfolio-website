import type { NavItem } from "@/lib/nav";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  name: string;
  items: NavItem[];
};

/**
 * The site's mark: the bongo cat's head in miniature, headphones on. It blinks
 * now and then and twitches its ears when the wordmark is hovered or focused.
 */
function CatMark() {
  return (
    <svg className={styles.mark} viewBox="0 0 32 28" width="32" height="28" aria-hidden="true" focusable="false">
      <g className={styles.ears}>
        <path d="M8.2 9.6 L9.4 2.6 L14.2 7.4" className={styles.ear} />
        <path d="M23.8 9.6 L22.6 2.6 L17.8 7.4" className={styles.ear} />
      </g>
      <path
        d="M5 17.6 C5 10.6 10 7.4 16 7.4 C22 7.4 27 10.6 27 17.6 C27 23.4 22.2 26.4 16 26.4 C9.8 26.4 5 23.4 5 17.6 Z"
        className={styles.head}
      />
      <path d="M5.6 15.2 C5.6 2.4 26.4 2.4 26.4 15.2" className={styles.band} />
      <rect x="2.6" y="13.4" width="4.6" height="7.4" rx="2.3" className={styles.cup} />
      <rect x="24.8" y="13.4" width="4.6" height="7.4" rx="2.3" className={styles.cup} />
      <g className={styles.eyes}>
        <circle cx="12.6" cy="17" r="1.45" />
        <circle cx="19.4" cy="17" r="1.45" />
      </g>
      <path d="M15 19.6 H17 L16 20.8 Z" className={styles.nose} />
      <path d="M13.8 21.4 Q15 22.8 16 21.2 Q17 22.8 18.2 21.4" className={styles.mouth} />
    </svg>
  );
}

/**
 * Sticky header. The navigation is always visible and wraps on small screens,
 * so it needs no script and no disclosure widget. A hairline along the bottom
 * fills as the page is read, where the browser supports scroll timelines.
 */
export function SiteHeader({ name, items }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <a href="#top" className={styles.wordmark}>
          <CatMark />
          <span className={styles.name}>{name}</span>
        </a>
        <nav aria-label="Main" className={styles.nav}>
          <ul className="plain-list">
            {items.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <span className={styles.progress} aria-hidden="true" />
    </header>
  );
}

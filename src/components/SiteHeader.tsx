import type { NavItem } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  name: string;
  items: NavItem[];
};

/**
 * The small four-pointed sparkle the drawings use, set after the name like a
 * flourish. It twinkles when the wordmark is hovered or focused.
 */
function SparkleMark() {
  return (
    <svg className={styles.sparkle} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M8 0.5 L9.9 6.1 L15.5 8 L9.9 9.9 L8 15.5 L6.1 9.9 L0.5 8 L6.1 6.1 Z" />
    </svg>
  );
}

/**
 * Sticky header: the wordmark, the navigation and the theme switch. The
 * navigation is always visible and wraps on small screens, so it needs no
 * script and no disclosure widget. A hairline along the bottom
 * fills as the page is read, where the browser supports scroll timelines.
 */
export function SiteHeader({ name, items }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <a href="#top" className={styles.wordmark}>
          <span className={styles.name}>{name}</span>
          <SparkleMark />
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
        <ThemeToggle className={styles.toggle} />
      </div>
      <span className={styles.progress} aria-hidden="true" />
    </header>
  );
}

import type { NavItem } from "@/lib/nav";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  name: string;
  items: NavItem[];
};

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
          <span className={styles.monogram} aria-hidden="true">
            MP
          </span>
          {name}
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

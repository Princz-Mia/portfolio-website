import type { NavItem } from "@/lib/nav";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  name: string;
  items: NavItem[];
};

/**
 * The navigation is always visible and wraps on small screens, so it needs no
 * script and no disclosure widget to work.
 */
export function SiteHeader({ name, items }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <a href="#top" className={styles.wordmark}>
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
    </header>
  );
}

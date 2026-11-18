import type { SiteConfig } from "@/content";
import styles from "./SiteFooter.module.css";

export function SiteFooter({ site }: { site: SiteConfig }) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.bar}`}>
        <p className={styles.copy}>
          © {year} {site.name}
        </p>
        <ul className={`plain-list ${styles.links}`}>
          <li>
            <a href={`mailto:${site.email}`}>Email</a>
          </li>
          <li>
            <a href={site.linkedin.href} rel="me">
              {site.linkedin.label}
            </a>
          </li>
          <li>
            <a href={site.github.href} rel="me">
              {site.github.label}
            </a>
          </li>
          {site.teachingSiteUrl ? (
            <li>
              <a href={site.teachingSiteUrl}>Teaching</a>
            </li>
          ) : null}
          <li>
            <a href="#top">Back to top</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

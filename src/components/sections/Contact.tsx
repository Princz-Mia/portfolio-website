import type { SiteConfig } from "@/content";
import { Section } from "@/components/Section";
import { ContactArt } from "@/components/illustrations/ContactArt";
import styles from "./Contact.module.css";

type ContactProps = {
  site: SiteConfig;
  number: string;
  /** Illustration side; the page alternates it from section to section. */
  side: "left" | "right";
};

export function Contact({ site, number, side }: ContactProps) {
  return (
    <Section
      id="contact"
      number={number}
      label="Contact"
      title="Reach out"
      lede="Email is the most reliable way to reach me."
      art={<ContactArt />}
      side={side}
    >
      <p className={`${styles.emailLine} reveal`}>
        <a className={styles.email} href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </p>
      <ul className={`plain-list ${styles.links} reveal`}>
        <li>
          <a href={site.linkedin.href} rel="me">
            {site.linkedin.label}
            <span className="visually-hidden"> profile</span>
          </a>
        </li>
        <li>
          <a href={site.github.href} rel="me">
            {site.github.label}
            <span className="visually-hidden"> profile</span>
          </a>
        </li>
      </ul>
    </Section>
  );
}

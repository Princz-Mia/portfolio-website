import type { SiteConfig } from "@/content";
import { Section } from "@/components/Section";
import { ContactArt } from "@/components/illustrations/ContactArt";
import styles from "./Contact.module.css";

type ContactProps = {
  site: SiteConfig;
  number: string;
};

export function Contact({ site, number }: ContactProps) {
  return (
    <Section
      id="contact"
      number={number}
      title="Contact"
      lede="Email is the most reliable way to reach me."
      art={<ContactArt />}
    >
      <p className={styles.emailLine}>
        <a className={styles.email} href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </p>
      <ul className={`plain-list ${styles.links}`}>
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

import type { Personal as PersonalContent } from "@/content";
import { Section } from "@/components/Section";
import { PersonalArt } from "@/components/illustrations/PersonalArt";
import styles from "./Personal.module.css";

type PersonalProps = {
  personal: PersonalContent;
  number: string;
};

export function Personal({ personal, number }: PersonalProps) {
  return (
    <Section
      id="off-the-clock"
      number={number}
      title="Off the clock"
      lede="Movies, games, friends and cats."
      art={<PersonalArt />}
    >
      <div className={`flow measure ${styles.text}`}>
        {personal.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {personal.links.length > 0 ? (
        <ul className={`plain-list ${styles.links}`}>
          {personal.links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

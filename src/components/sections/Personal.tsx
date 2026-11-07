import type { Personal as PersonalContent } from "@/content";
import { Section } from "@/components/Section";
import { Cat } from "@/components/illustrations/Cat";
import { Banner } from "@/components/illustrations/Banner";
import styles from "./Personal.module.css";

type PersonalProps = {
  personal: PersonalContent;
  number: string;
};

export function Personal({ personal, number }: PersonalProps) {
  return (
    <Section
      id="elsewhere"
      number={number}
      title="Elsewhere"
      lede="What fills the time between work and study."
    >
      <div className={styles.layout}>
        <div className={`flow measure ${styles.text}`}>
          {personal.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className={styles.art}>
          <Cat className={styles.cat} />
          <Banner className={styles.banner} />
        </div>
      </div>
    </Section>
  );
}

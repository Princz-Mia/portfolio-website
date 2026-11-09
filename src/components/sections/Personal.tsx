import type { Personal as PersonalContent } from "@/content";
import { Section } from "@/components/Section";
import { PersonalArt } from "@/components/illustrations/PersonalArt";
import { RichText } from "@/lib/richText";
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
          <p key={paragraph}>
            <RichText text={paragraph} />
          </p>
        ))}
      </div>
    </Section>
  );
}

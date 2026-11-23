import type { Personal as PersonalContent } from "@/content";
import { Section } from "@/components/Section";
import { PersonalArt } from "@/components/illustrations/PersonalArt";
import { PersonalScene } from "@/components/personal/PersonalScene";
import { RichText } from "@/lib/richText";
import styles from "./Personal.module.css";

type PersonalProps = {
  personal: PersonalContent;
  number: string;
  /** Illustration side; the page alternates it from section to section. */
  side: "left" | "right";
};

export function Personal({ personal, number, side }: PersonalProps) {
  return (
    <Section
      id="off-the-clock"
      number={number}
      label="Hobbies"
      title="Off the clock"
      lede="Movies, games, friends and cats."
      art={
        <PersonalScene>
          <PersonalArt />
        </PersonalScene>
      }
      side={side}
    >
      <div className={`flow measure ${styles.text} reveal`}>
        {personal.paragraphs.map((paragraph) => (
          <p key={paragraph}>
            <RichText text={paragraph} />
          </p>
        ))}
      </div>
    </Section>
  );
}

import type { Teaching as TeachingContent } from "@/content";
import { Section } from "@/components/Section";
import { Chalkboard } from "@/components/teaching/Chalkboard";
import { RichText } from "@/lib/richText";
import styles from "./Teaching.module.css";

type TeachingProps = {
  teaching: TeachingContent;
  teachingSiteUrl: string | null;
  email: string;
  number: string;
};

export function Teaching({ teaching, teachingSiteUrl, email, number }: TeachingProps) {
  return (
    <Section
      id="teaching"
      number={number}
      title="Teaching"
      lede="Java for university students, and private tutoring."
      art={<Chalkboard />}
      side="left"
    >
      <div className={`flow measure ${styles.text} reveal`}>
        {teaching.paragraphs.map((paragraph) => (
          <p key={paragraph}>
            <RichText text={paragraph} />
          </p>
        ))}
      </div>
      <TeachingAction
        teachingSiteUrl={teachingSiteUrl}
        email={email}
        siteLinkLabel={teaching.siteLinkLabel}
        contactPrompt={teaching.contactPrompt}
      />
    </Section>
  );
}

type TeachingActionProps = {
  teachingSiteUrl: string | null;
  email: string;
  siteLinkLabel: string;
  contactPrompt: string;
};

/**
 * Links to the separately hosted teaching site when one is configured, and offers
 * an email contact otherwise. Never a placeholder link.
 */
export function TeachingAction({
  teachingSiteUrl,
  email,
  siteLinkLabel,
  contactPrompt,
}: TeachingActionProps) {
  if (teachingSiteUrl) {
    return (
      <p className={styles.action}>
        <a className="button" href={teachingSiteUrl}>
          {siteLinkLabel}
        </a>
      </p>
    );
  }

  return (
    <div className={styles.action}>
      <p className={`measure ${styles.prompt}`}>{contactPrompt}</p>
      <p>
        <a className="button" href={`mailto:${email}?subject=Teaching`}>
          Email me about teaching
        </a>
      </p>
    </div>
  );
}

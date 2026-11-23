import type { Academic as AcademicContent } from "@/content";
import { Section } from "@/components/Section";
import { ResearchOutputs } from "@/components/ResearchOutputs";
import { AcademicArt } from "@/components/illustrations/AcademicArt";
import { RichText } from "@/lib/richText";
import styles from "./Academic.module.css";

type AcademicProps = {
  academic: AcademicContent;
  /** Section number, given by the page so the numbering stays consecutive. */
  number: string;
  /** Illustration side; the page alternates it from section to section. */
  side: "left" | "right";
};

export function Academic({ academic, number, side }: AcademicProps) {
  return (
    <Section
      id="academic"
      number={number}
      label="Academic work"
      title="Education"
      lede="M.Sc. studies at BME in software engineering and distributed systems."
      art={<AcademicArt />}
      side={side}
    >
      <div className={`flow measure ${styles.intro} reveal`}>
        {academic.intro.map((paragraph) => (
          <p key={paragraph}>
            <RichText text={paragraph} />
          </p>
        ))}
      </div>

      <div className={`${styles.education} reveal`}>
        <h3 className={styles.educationTitle}>Degrees</h3>
        <ol className={`plain-list ${styles.degrees}`}>
          {academic.education.map((entry) => (
            <li key={entry.degree} className={styles.degree}>
              <div className={styles.degreeHead}>
                <p className="eyebrow">
                  <span className={entry.status === "in progress" ? "accent" : undefined}>
                    {entry.status === "in progress" ? "In progress" : "Completed"}
                  </span>
                  {entry.period ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      {entry.period}
                    </>
                  ) : null}
                </p>
                <h4 className={styles.degreeName}>{entry.degree}</h4>
                <p className={styles.institution}>{entry.institution}</p>
              </div>
              <ul className="dash-list">
                {entry.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <ResearchOutputs outputs={academic.outputs} />
    </Section>
  );
}

import type { Academic as AcademicContent } from "@/content";
import { Section } from "@/components/Section";
import { ResearchOutputs } from "@/components/ResearchOutputs";
import { AcademicArt } from "@/components/illustrations/AcademicArt";
import { RichText } from "@/lib/richText";
import styles from "./Academic.module.css";

type AcademicProps = {
  academic: AcademicContent;
  /** Section number depends on whether the projects section is shown. */
  number: string;
};

export function Academic({ academic, number }: AcademicProps) {
  return (
    <Section
      id="academic"
      number={number}
      title="Academic work"
      lede="Master's studies at BME: software engineering and distributed systems, with an eye on modeling and verification."
      art={<AcademicArt />}
      side="right"
    >
      <div className={`flow measure ${styles.intro} reveal`}>
        {academic.intro.map((paragraph) => (
          <p key={paragraph}>
            <RichText text={paragraph} />
          </p>
        ))}
      </div>

      <div className={`${styles.education} reveal`}>
        <h3 className={styles.educationTitle}>Education</h3>
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

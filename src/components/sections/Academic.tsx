import type { Academic as AcademicContent } from "@/content";
import { Section } from "@/components/Section";
import { ResearchOutputs } from "@/components/ResearchOutputs";
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
      lede="Master's studies at BME, with a focus on modeling and verification."
    >
      <div className={`flow measure ${styles.intro}`}>
        {academic.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <ol className={`plain-list ${styles.focus}`}>
        {academic.focus.map((item, index) => (
          <li key={item.name} className={styles.focusItem}>
            <p className={`eyebrow ${styles.focusIndex}`}>
              <span className="accent">{String(index + 1).padStart(2, "0")}</span>
            </p>
            <h3 className={styles.focusName}>{item.name}</h3>
            <p className={styles.focusText}>{item.description}</p>
          </li>
        ))}
      </ol>

      <div className={styles.education}>
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

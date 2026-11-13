import type { Role, Technical } from "@/content";
import { Section } from "@/components/Section";
import { Highlights } from "@/components/Highlights";
import { WorkArt } from "@/components/illustrations/WorkArt";
import { LaptopScreen } from "@/components/laptop/LaptopScreen";
import styles from "./Experience.module.css";

type ExperienceProps = {
  roles: Role[];
  technical: Technical;
};

/** The short name in parentheses, e.g. "TGF" from "Test Governance Framework (TGF)". */
function shortName(name: string): string | undefined {
  return /\(([^)]+)\)\s*$/.exec(name)?.[1];
}

export function Experience({ roles, technical }: ExperienceProps) {
  const technologies = technical.groups.filter((g) => g.kind === "technology");
  const practices = technical.groups.filter((g) => g.kind === "practice");

  return (
    <Section
      id="work"
      number="01"
      title="Work"
      lede="Backend services, the pipelines that ship them, and the habits that keep them maintainable."
      art={
        <LaptopScreen>
          <WorkArt />
        </LaptopScreen>
      }
      side="right"
    >
      <div className={styles.roles}>
        {roles.map((role) => (
          <article key={`${role.organisation}-${role.title}`} className={styles.role}>
            <header className={`${styles.roleHead} reveal`}>
              <div>
                <h3 className={styles.org}>{role.organisation}</h3>
                <p className={styles.roleTitle}>{role.title}</p>
              </div>
              {role.period ? <p className={styles.period}>{role.period}</p> : null}
            </header>
            <p className={`measure ${styles.summary} reveal`}>{role.summary}</p>
            <ol className={`plain-list ${styles.chapters}`}>
              {role.chapters.map((chapter, index) => {
                const short = shortName(chapter.name);
                return (
                  <li key={chapter.name} className={`${styles.chapter} reveal`}>
                    <span className={styles.marker} aria-hidden="true">
                      {String(role.chapters.length - index).padStart(2, "0")}
                    </span>
                    <h4 className={styles.chapterName}>{chapter.name}</h4>
                    <p className={`measure ${styles.chapterSummary}`}>{chapter.summary}</p>
                    <Highlights
                      items={chapter.highlights}
                      visible={3}
                      moreLabel={short ? `from ${short}` : undefined}
                    />
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>

      <div className={`${styles.technical} reveal`}>
        <h3 className={styles.technicalTitle}>Technical background</h3>
        <p className={`measure ${styles.note}`}>{technical.note}</p>
        <dl className={styles.groups}>
          {technologies.map((group) => (
            <div key={group.name} className={styles.group}>
              <dt>{group.name}</dt>
              <dd>{group.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
        {practices.length > 0 ? (
          <dl className={`${styles.groups} ${styles.practices}`}>
            {practices.map((group) => (
              <div key={group.name} className={styles.group}>
                <dt>{group.name}</dt>
                <dd>{group.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </Section>
  );
}

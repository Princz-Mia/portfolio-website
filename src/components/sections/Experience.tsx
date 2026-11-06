import type { Role, Technical } from "@/content";
import { Section } from "@/components/Section";
import styles from "./Experience.module.css";

type ExperienceProps = {
  roles: Role[];
  technical: Technical;
};

export function Experience({ roles, technical }: ExperienceProps) {
  const technologies = technical.groups.filter((g) => g.kind === "technology");
  const practices = technical.groups.filter((g) => g.kind === "practice");

  return (
    <Section
      id="work"
      number="01"
      title="Work"
      lede="Backend systems, the pipelines that ship them, and the habits that keep them maintainable."
    >
      <div className={styles.roles}>
        {roles.map((role) => (
          <article key={`${role.organisation}-${role.title}`} className={styles.role}>
            <header className={styles.roleHead}>
              <div>
                <h3 className={styles.org}>{role.organisation}</h3>
                <p className={styles.roleTitle}>{role.title}</p>
              </div>
              {role.period ? <p className="eyebrow">{role.period}</p> : null}
            </header>
            <p className={`measure ${styles.summary}`}>{role.summary}</p>
            <ul className={`dash-list measure ${styles.highlights}`}>
              {role.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className={styles.technical}>
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

import type { Project } from "@/content";
import { Section } from "@/components/Section";
import styles from "./Projects.module.css";

type ProjectsProps = {
  projects: Project[];
};

/**
 * Selected engineering work. Renders nothing when there are no projects, so the
 * section never shows an empty state or a placeholder.
 */
export function Projects({ projects }: ProjectsProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <Section
      id="projects"
      number="02"
      title="Selected projects"
      lede="Work with public source, described as it stands: the problem, my part in it, and the decisions that shaped it."
    >
      <div className={styles.list}>
        {projects.map((project) => (
          <article key={project.slug} className={styles.project} id={`project-${project.slug}`}>
            <header className={styles.head}>
              <p className="eyebrow">
                {project.context}
                <span aria-hidden="true"> · </span>
                <span className={styles.status}>{project.status.label}</span>
              </p>
              <h3 className={styles.name}>{project.name}</h3>
              <p className={styles.tagline}>{project.tagline}</p>
            </header>

            <div className={styles.columns}>
              <div className={`flow ${styles.column}`}>
                <h4 className={styles.label}>The problem</h4>
                <p>{project.problem}</p>
                <h4 className={styles.label}>My part</h4>
                <p>{project.contribution}</p>
              </div>
              <div className={styles.column}>
                <h4 className={styles.label}>Decisions worth noting</h4>
                <ul className="dash-list">
                  {project.decisions.map((decision) => (
                    <li key={decision}>{decision}</li>
                  ))}
                </ul>
              </div>
            </div>

            <footer className={styles.meta}>
              <p className={styles.statusNote}>{project.status.note}</p>
              <p className={styles.stack}>
                <span className="visually-hidden">Stack: </span>
                {project.stack.join(" · ")}
              </p>
              {project.links.length > 0 ? (
                <ul className={`plain-list ${styles.links}`}>
                  {project.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>
                        {link.label}
                        <span className="visually-hidden"> ({project.name})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </footer>
          </article>
        ))}
      </div>
    </Section>
  );
}

import type { Profile, SiteConfig } from "@/content";
import { ModelMotif } from "@/components/illustrations/ModelMotif";
import styles from "./Intro.module.css";

type IntroProps = {
  site: SiteConfig;
  profile: Profile;
  hasProjects: boolean;
};

export function Intro({ site, profile, hasProjects }: IntroProps) {
  return (
    <section className={styles.intro} aria-labelledby="intro-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.text}>
          <h1 id="intro-title" className={styles.heading}>
            <span className={styles.name}>{site.name}</span>
            <span className={styles.headline}>{profile.headline}</span>
          </h1>
          <div className={`flow ${styles.lede}`}>
            {profile.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className={styles.actions}>
            <a
              className="button button--primary"
              href={hasProjects ? "#projects" : "#work"}
            >
              {hasProjects ? "Selected projects" : "What I work on"}
            </a>
            <a className="button" href="#contact">
              Get in touch
            </a>
          </div>
        </div>

        <div className={styles.aside} role="group" aria-label="At a glance">
          <ModelMotif className={styles.motif} />
          <dl className={styles.facts}>
            {profile.facts.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

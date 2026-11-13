import type { CSSProperties } from "react";
import type { Profile, SiteConfig } from "@/content";
import { InView } from "@/components/InView";
import { BongoCat } from "@/components/illustrations/BongoCat";
import { RichText } from "@/lib/richText";
import styles from "./Intro.module.css";

type IntroProps = {
  site: SiteConfig;
  profile: Profile;
  hasProjects: boolean;
};

/** Stagger index for the hero's entrance. */
const order = (i: number) => ({ "--i": i }) as CSSProperties;

export function Intro({ site, profile, hasProjects }: IntroProps) {
  return (
    <section className={styles.intro} aria-labelledby="intro-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.text}>
          <p className={`eyebrow ${styles.item} ${styles.hello}`} style={order(0)}>
            <span className={styles.wave} aria-hidden="true" />
            Hello, I&rsquo;m
          </p>
          <h1 id="intro-title" className={`${styles.name} ${styles.item}`} style={order(1)}>
            {site.name}
          </h1>
          <p className={`${styles.headline} ${styles.item}`} style={order(2)}>
            {profile.headline}
          </p>
          <div className={`flow ${styles.lede}`}>
            {profile.intro.map((paragraph, index) => (
              <p key={paragraph} className={styles.item} style={order(3 + index)}>
                <RichText text={paragraph} />
              </p>
            ))}
          </div>
          <div className={`${styles.actions} ${styles.item}`} style={order(3 + profile.intro.length)}>
            <a className="button button--primary" href={hasProjects ? "#projects" : "#work"}>
              {hasProjects ? "Selected projects" : "What I work on"}
              <span className="button__arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a className="button" href="#contact">
              Get in touch
            </a>
          </div>
        </div>

        <div className={`${styles.artCol} ${styles.artItem}`}>
          <InView className={styles.art} afterIntro>
            <BongoCat />
          </InView>
        </div>

        <dl className={styles.facts}>
          {profile.facts.map((fact, index) => (
            <div
              key={fact.label}
              className={`${styles.fact} ${styles.item}`}
              style={order(5 + index)}
            >
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

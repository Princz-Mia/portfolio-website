import type { CSSProperties } from "react";
import type { Profile, SiteConfig } from "@/content";
import { InView } from "@/components/InView";
import { BongoCat } from "@/components/illustrations/BongoCat";
import { RichText } from "@/lib/richText";
import styles from "./Intro.module.css";

type IntroProps = {
  site: SiteConfig;
  profile: Profile;
  /** No longer used by the hero; accepted so existing callers keep compiling. */
  hasProjects?: boolean;
};

type HeroLinkKey = "linkedin" | "github" | "teaching" | "cv";

type HeroLink = { key: HeroLinkKey; label: string; href: string };

/** The CV page, which shows the PDF in any browser and offers it for download. */
export const CV_PAGE = "/cv/";

/**
 * The hero's links, in order. The teaching site and the CV appear only once
 * their addresses are set, so the hero never shows a dead link.
 */
export function buildHeroLinks(site: SiteConfig): HeroLink[] {
  const links: HeroLink[] = [
    { key: "linkedin", label: site.linkedin.label, href: site.linkedin.href },
    { key: "github", label: site.github.label, href: site.github.href },
  ];
  if (site.teachingSiteUrl) {
    links.push({ key: "teaching", label: "Teaching site", href: site.teachingSiteUrl });
  }
  if (site.cvUrl) {
    links.push({ key: "cv", label: "CV", href: CV_PAGE });
  }
  return links;
}

/** Small line glyphs for the hero links, drawn in the site's own hand. */
function HeroIcon({ name }: { name: HeroLinkKey }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === "linkedin" ? (
        <>
          {/* "in" in a rounded square */}
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 10.5V16.5" />
          <circle cx="8" cy="7.6" r="0.5" fill="currentColor" />
          <path d="M11.5 16.5V10.5M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1 1 2.1 2.5v3.6" />
        </>
      ) : name === "github" ? (
        <>
          {/* a branch leaving the main line and merging back */}
          <circle cx="7" cy="5.5" r="2" />
          <circle cx="7" cy="18.5" r="2" />
          <circle cx="17" cy="8" r="2" />
          <path d="M7 7.5v9M17 10c0 3.5-3 4.5-8.6 6.9" />
        </>
      ) : name === "teaching" ? (
        <>
          {/* a small chalkboard on its stand */}
          <rect x="3.5" y="4" width="17" height="11.5" rx="1.5" />
          <path d="M7 9.5h5M7 12h8M8.5 15.5 7 20M15.5 15.5 17 20" />
        </>
      ) : (
        <>
          {/* a page with a folded corner and a few lines */}
          <path d="M6 3h8.5L19 7.5V21H6z" />
          <path d="M14.5 3v4.5H19M9 12h7M9 15h7M9 18h4" />
        </>
      )}
    </svg>
  );
}

/** Stagger index for the hero's entrance. */
const order = (i: number) => ({ "--i": i }) as CSSProperties;

export function Intro({ site, profile }: IntroProps) {
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
          <ul
            className={`plain-list ${styles.actions} ${styles.item}`}
            style={order(3 + profile.intro.length)}
            aria-label="Find me elsewhere"
          >
            {buildHeroLinks(site).map((link, index) => (
              <li key={link.key}>
                <a
                  className={index === 0 ? "button button--primary" : "button"}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HeroIcon name={link.key} />
                  {link.label}{" "}
                  <span className="visually-hidden">
                    (opens in a new tab)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${styles.artCol} ${styles.artItem}`}>
          <InView className={styles.art} afterIntro>
            <BongoCat />
          </InView>
        </div>
      </div>
    </section>
  );
}

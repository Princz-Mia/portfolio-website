import type { ReactNode } from "react";
import { InView } from "@/components/InView";
import styles from "./Section.module.css";

type SectionProps = {
  id: string;
  number: string;
  title: string;
  lede?: string;
  /** The section's illustration, shown large beside the content. */
  art?: ReactNode;
  /** Which side the illustration sits on; alternate between sections. */
  side?: "left" | "right";
  children: ReactNode;
};

/**
 * A section with its content in seven of twelve columns and its illustration in
 * the other six, so the two overlap by one column. The illustration stays in
 * view while long content scrolls. On narrow screens the drawing sits above the
 * heading.
 */
export function Section({
  id,
  number,
  title,
  lede,
  art,
  side = "right",
  children,
}: SectionProps) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      className={styles.section}
      data-side={side}
      aria-labelledby={headingId}
    >
      <div className={`container ${styles.grid}`}>
        {art ? (
          <div className={styles.artCol}>
            <InView className={styles.art}>{art}</InView>
          </div>
        ) : null}
        <div className={styles.content}>
          <header className={`${styles.head} reveal`}>
            <p className={`eyebrow ${styles.eyebrow}`}>
              <span className="accent">{number}</span>
              <span className={styles.rule} aria-hidden="true" />
              <span>{title}</span>
            </p>
            <h2 id={headingId} className={styles.title}>
              {title}
            </h2>
            {lede ? <p className={styles.lede}>{lede}</p> : null}
          </header>
          <div className={styles.body}>{children}</div>
        </div>
      </div>
    </section>
  );
}

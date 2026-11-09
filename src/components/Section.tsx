import type { ReactNode } from "react";
import { InView } from "@/components/InView";
import styles from "./Section.module.css";

type SectionProps = {
  id: string;
  number: string;
  title: string;
  lede?: string;
  /** Pale illustration drawn behind the section, towards its right edge. */
  art?: ReactNode;
  children: ReactNode;
};

/**
 * Editorial section: a numbered heading column on the left (sticky on wide
 * screens) and the content on the right, with the section's drawing sitting
 * faintly behind it. Stacks on narrow screens.
 */
export function Section({ id, number, title, lede, art, children }: SectionProps) {
  const headingId = `${id}-title`;
  return (
    <section id={id} className={styles.section} aria-labelledby={headingId}>
      {art ? (
        <InView className={styles.backdrop}>
          {art}
        </InView>
      ) : null}
      <div className={`container ${styles.grid}`}>
        <header className={styles.head}>
          <p className="eyebrow">
            <span className="accent">{number}</span>
            <span aria-hidden="true"> — </span>
            <span>{title}</span>
          </p>
          <h2 id={headingId} className={styles.title}>
            {title}
          </h2>
          {lede ? <p className={styles.lede}>{lede}</p> : null}
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </section>
  );
}

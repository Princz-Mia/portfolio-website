import type { ResearchOutput } from "@/content";
import styles from "./ResearchOutputs.module.css";

type ResearchOutputsProps = {
  outputs: ResearchOutput[];
};

/**
 * Publications, TDK work, thesis and talks. Renders nothing while the list is
 * empty: no counters, no "coming soon".
 */
export function ResearchOutputs({ outputs }: ResearchOutputsProps) {
  if (outputs.length === 0) {
    return null;
  }

  return (
    <div className={styles.block}>
      <h3 className={styles.title}>Research outputs</h3>
      <ol className={`plain-list ${styles.list}`}>
        {outputs.map((output) => (
          <li key={`${output.title}-${output.date}`} className={styles.item}>
            <p className="eyebrow">
              {output.type}
              <span aria-hidden="true"> · </span>
              {output.status}
              <span aria-hidden="true"> · </span>
              <time>{output.date}</time>
            </p>
            <h4 className={styles.itemTitle}>{output.title}</h4>
            <p className={styles.summary}>{output.summary}</p>
            {output.links && output.links.length > 0 ? (
              <ul className={`plain-list ${styles.links}`}>
                {output.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>
                      {link.label}
                      <span className="visually-hidden"> ({output.title})</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

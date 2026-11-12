import styles from "./Highlights.module.css";

type HighlightsProps = {
  items: string[];
  /** How many items are shown before the rest fold away. */
  visible?: number;
  /** Used in the toggle label, e.g. "from TGF". */
  moreLabel?: string;
};

/**
 * A list whose first few items are always shown and whose rest sit behind a
 * native disclosure, so the page stays scannable while the detail is one click
 * away. Works without JavaScript.
 */
export function Highlights({ items, visible = 3, moreLabel }: HighlightsProps) {
  const shown = items.slice(0, visible);
  const rest = items.slice(visible);

  return (
    <div className={styles.wrap}>
      <ul className={`dash-list measure ${styles.list}`}>
        {shown.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {rest.length > 0 ? (
        <details className={styles.more}>
          <summary className={styles.summary}>
            <span className={styles.icon} aria-hidden="true" />
            <span className={styles.closed}>
              {rest.length} more{moreLabel ? ` ${moreLabel}` : ""}
            </span>
            <span className={styles.open}>Show less</span>
          </summary>
          <ul className={`dash-list measure ${styles.list} ${styles.extra}`}>
            {rest.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

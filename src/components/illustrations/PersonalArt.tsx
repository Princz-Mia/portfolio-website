import { Banner } from "./Banner";
import { Cat } from "./Cat";
import styles from "./PersonalArt.module.css";

/** The cat and the banner, side by side on one ground line. */
export function PersonalArt({ className }: { className?: string }) {
  return (
    <div className={`${styles.row} ${className ?? ""}`}>
      <Cat className={styles.cat} />
      <Banner className={styles.banner} />
    </div>
  );
}

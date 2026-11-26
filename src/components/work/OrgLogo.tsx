import type { OrgLogoKey } from "@/content";
import styles from "./OrgLogo.module.css";

/**
 * Employer marks, drawn inline so they stay crisp and need no extra request.
 * Path data from Simple Icons (CC0, https://simpleicons.org); the marks
 * themselves are trademarks of their owners.
 */
const LOGOS: Record<OrgLogoKey, { path: string; color: string }> = {
  ericsson: {
    color: "#0082f0",
    path: "M20.76 1.593A2.36 2.36 0 0 0 19.572.225c-.54-.27-1.188-.336-2.256.02L5.187 4.29c-1.068.357-1.548.795-1.818 1.338a2.36 2.36 0 0 0 1.059 3.174c.54.27 1.188.336 2.256-.021l12.129-4.044c1.068-.354 1.548-.795 1.818-1.338a2.35 2.35 0 0 0 .13-1.806zm0 7.485a2.36 2.36 0 0 0-1.188-1.368c-.54-.27-1.188-.336-2.256.021L5.187 11.775c-1.068.357-1.548.795-1.818 1.338a2.36 2.36 0 0 0 1.059 3.174c.54.27 1.188.336 2.256-.021l12.129-4.041c1.068-.357 1.548-.795 1.818-1.341a2.35 2.35 0 0 0 .13-1.806zm0 7.488a2.36 2.36 0 0 0-1.188-1.368c-.54-.27-1.188-.336-2.256.021L5.187 19.263c-1.068.357-1.548.795-1.818 1.338a2.36 2.36 0 0 0 1.059 3.174c.54.27 1.188.336 2.256-.02l12.129-4.045c1.068-.354 1.548-.795 1.818-1.338a2.35 2.35 0 0 0 .13-1.806z",
  },
};

/** A small badge with the employer's mark. Decorative: the name sits beside it. */
export function OrgLogo({ name }: { name: OrgLogoKey }) {
  const logo = LOGOS[name];
  return (
    <span className={styles.badge} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" focusable="false" style={{ color: logo.color }}>
        <path d={logo.path} fill="currentColor" />
      </svg>
    </span>
  );
}

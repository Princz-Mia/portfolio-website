import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main" className={`container ${styles.page}`}>
      <p className="eyebrow">
        <span className="accent">404</span>
        <span aria-hidden="true"> — </span>
        Not found
      </p>
      <h1 className={styles.title}>There is nothing at this address.</h1>
      <p className={styles.text}>
        The page may have moved when the site was redesigned, or the link may be
        mistyped. Everything that is here lives on the front page.
      </p>
      <p>
        <Link className="button button--primary" href="/">
          Go to the front page
        </Link>
      </p>
      <p className={styles.small}>
        If you were looking for something specific, email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </main>
  );
}

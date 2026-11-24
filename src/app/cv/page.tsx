import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/content";
import { CvViewer } from "@/components/cv/CvViewer";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./cv.module.css";

export const metadata: Metadata = {
  title: "CV",
  description: `The CV of ${site.name}, ${site.role.toLowerCase()}.`,
};

/** The file name a downloaded copy is saved under. */
const DOWNLOAD_NAME = "Mia-Princz-CV.pdf";

/**
 * The CV as its own page. Some browsers (Chrome on Android, embedded browsers)
 * have no PDF viewer and download a linked PDF straight away; drawing it here
 * makes it open the same way everywhere, with a download button beside it.
 */
export default function CvPage() {
  if (!site.cvUrl) {
    notFound();
  }

  return (
    <>
      <header className={styles.bar}>
        <div className={`container ${styles.barInner}`}>
          <Link className={styles.back} href="/">
            <span aria-hidden="true">←</span> {site.name}
          </Link>
          <div className={styles.actions}>
            <a className="button button--primary" href={site.cvUrl} download={DOWNLOAD_NAME}>
              Download PDF
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className={`container ${styles.main}`}>
        <h1 className="visually-hidden">CV of {site.name}</h1>
        <CvViewer src={site.cvUrl} label={`${site.name}'s CV`} />
        <noscript>
          <style>{"[data-cv-viewer]{display:none}"}</style>
          <p className={styles.noscript}>
            Showing the CV here needs JavaScript. <a href={site.cvUrl}>Open the PDF</a> instead.
          </p>
        </noscript>
      </main>
    </>
  );
}

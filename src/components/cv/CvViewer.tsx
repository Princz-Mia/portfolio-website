"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import styles from "./CvViewer.module.css";

/** A clickable area over a page, in percent of the page's size. */
type PageLink = {
  href: string;
  /** Accessible name: the link's visible text, then where it goes. */
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

type PageView = {
  number: number;
  /** Page size in PDF points, used for the aspect ratio. */
  width: number;
  height: number;
  links: PageLink[];
  /** The page's text line by line, for screen readers; the canvas is only pixels. */
  lines: string[];
};

/** Pages are drawn this wide (in CSS pixels) and scaled down by CSS on smaller screens. */
const RENDER_WIDTH = 900;

/** After this long without a document, show the fallback links instead of waiting. */
const LOAD_TIMEOUT_MS = 20_000;

/**
 * pdf.js's legacy build, which polyfills the newer JavaScript the default build
 * relies on, so older Android WebViews and in-app browsers can run it too.
 * The worker is given as a URL rather than a Worker so that pdf.js handles a
 * worker that fails to start itself (it falls back to running on the page).
 */
async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).href;
  return pdfjs;
}

/** Only web and mail links are carried over from the PDF. */
const isSafeHref = (href: string) => /^(https?:|mailto:)/i.test(href);

/** Section titles in the CV are set in capitals, e.g. "EXPERIENCE". */
const isHeading = (line: string) => /^[A-Z][A-Z &]{2,}$/.test(line);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out loading the PDF")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

type CvViewerProps = {
  /** URL of the PDF to show. */
  src: string;
  /** Short description of the document, e.g. "Mia Princz's CV". */
  label: string;
};

/**
 * Draws a PDF with pdf.js so it opens the same way in every browser, including
 * the ones that have no built-in PDF viewer and would otherwise download it.
 */
export function CvViewer({ src, label }: CvViewerProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState<PageView[]>([]);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const canvases = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Load the document and read each page's size, links and text.
  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (cancelled) return;
        loadingTask = pdfjs.getDocument({ url: src });
        const doc = await withTimeout(loadingTask.promise, LOAD_TIMEOUT_MS);
        if (cancelled) return;

        const views: PageView[] = [];
        for (let number = 1; number <= doc.numPages; number += 1) {
          const page = await doc.getPage(number);
          const viewport = page.getViewport({ scale: 1 });
          const [annotations, content] = await Promise.all([
            page.getAnnotations(),
            page.getTextContent(),
          ]);
          const items = content.items.filter((item) => "str" in item);

          const links: PageLink[] = [];
          for (const annotation of annotations) {
            const href: unknown = annotation.url;
            if (annotation.subtype !== "Link" || typeof href !== "string" || !isSafeHref(href)) {
              continue;
            }
            const [ax, ay, bx, by] = annotation.rect as number[];
            const [minX, minY, maxX, maxY] = [
              Math.min(ax, bx),
              Math.min(ay, by),
              Math.max(ax, bx),
              Math.max(ay, by),
            ];
            const visible = items
              .filter(
                (item) =>
                  item.str.trim() !== "" &&
                  item.transform[4] >= minX - 1 &&
                  item.transform[4] <= maxX + 1 &&
                  item.transform[5] >= minY - 2 &&
                  item.transform[5] <= maxY + 2,
              )
              .map((item) => item.str.trim())
              .join(" ");
            const target = href.replace(/^mailto:/i, "");
            const [x1, y1] = viewport.convertToViewportPoint(ax, ay) as number[];
            const [x2, y2] = viewport.convertToViewportPoint(bx, by) as number[];
            links.push({
              href,
              label: visible && visible !== target ? `${visible}, ${target}` : target,
              left: (Math.min(x1, x2) / viewport.width) * 100,
              top: (Math.min(y1, y2) / viewport.height) * 100,
              width: (Math.abs(x2 - x1) / viewport.width) * 100,
              height: (Math.abs(y2 - y1) / viewport.height) * 100,
            });
          }

          const lines = items
            .map((item) => item.str + (item.hasEOL ? "\n" : ""))
            .join("")
            .split("\n")
            .map((line) => line.replace(/\s+/g, " ").trim())
            .filter(Boolean);

          views.push({ number, width: viewport.width, height: viewport.height, links, lines });
        }
        if (cancelled) return;

        docRef.current = doc;
        setPages(views);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      docRef.current = null;
      void loadingTask?.destroy();
    };
  }, [src]);

  // Draw the pages once their canvases exist.
  useEffect(() => {
    const doc = docRef.current;
    if (!doc || pages.length === 0) return;
    let cancelled = false;
    const tasks: { cancel: () => void }[] = [];

    (async () => {
      try {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        for (const view of pages) {
          const canvas = canvases.current.get(view.number);
          if (!canvas || cancelled) continue;
          const page = await doc.getPage(view.number);
          if (cancelled) return;
          const viewport = page.getViewport({ scale: (RENDER_WIDTH * pixelRatio) / view.width });
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const task = page.render({ canvas, viewport });
          tasks.push(task);
          await task.promise;
        }
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      for (const task of tasks) task.cancel();
    };
  }, [pages]);

  if (status === "error") {
    return (
      <p className={styles.message} role="alert">
        The CV could not be displayed here.{" "}
        <a href={src}>Open the PDF directly</a> or use the download button.
      </p>
    );
  }

  return (
    <div className={styles.viewer} data-cv-viewer="" aria-busy={status === "loading"}>
      {status === "loading" ? (
        <p className={styles.message} role="status">
          Loading the CV…
        </p>
      ) : null}
      {pages.map((view) => (
        <section
          key={view.number}
          className={styles.page}
          style={{ aspectRatio: `${view.width} / ${view.height}` }}
          aria-label={`${label}, page ${view.number} of ${pages.length}`}
        >
          <canvas
            ref={(node) => {
              if (node) canvases.current.set(view.number, node);
              else canvases.current.delete(view.number);
            }}
            className={styles.canvas}
            aria-hidden="true"
          />
          {view.links.map((link, index) => (
            <a
              key={`${link.href}-${index}`}
              className={styles.link}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={link.label}
              style={{
                left: `${link.left}%`,
                top: `${link.top}%`,
                width: `${link.width}%`,
                height: `${link.height}%`,
              }}
            />
          ))}
          <div className="visually-hidden">
            {view.lines.map((line, index) =>
              isHeading(line) ? <h2 key={index}>{line}</h2> : <p key={index}>{line}</p>,
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

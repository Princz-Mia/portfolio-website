"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { CatPhoto } from "@/content";
import styles from "./CatPhotos.module.css";

type CatPhotosProps = {
  photos: CatPhoto[];
  /** Where the photos fly out from: the cat's position in viewport pixels. */
  from: { x: number; y: number };
  /** Called once the dialog has closed, by the button, Escape or the backdrop. */
  onClose: () => void;
};

/** Tilt of each polaroid in degrees, fanned out around the middle one. */
function tilt(index: number, count: number) {
  const spread = Math.min(7, 28 / Math.max(count - 1, 1));
  const middle = (count - 1) / 2;
  return (index - middle) * spread + (index % 2 === 0 ? -1.5 : 1.5);
}

/**
 * The cat photo surprise: a modal dialog in which polaroid-style photos fly out
 * from the cat and settle in a loose fan. Mounted only while open; it opens
 * itself as a modal, puts focus on the close button and reports closing.
 */
export function CatPhotos({ photos, from, onClose }: CatPhotosProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const titleId = `${useId()}-title`;
  // While the photos fly in, the scroller stops clipping them (when they all
  // fit, so nothing spills out of the panel).
  const [flying, setFlying] = useState(true);
  const landed = useRef(0);

  // Each photo starts at the cat: its offset is the cat's point minus the
  // centre of its own slot. Offsets ignore transforms, so the fly-out's own
  // starting transform does not skew the measurement.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const list = listRef.current;
    if (!scroller || !list) return;
    const box = list.getBoundingClientRect();
    for (const item of Array.from(list.children) as HTMLElement[]) {
      const x = box.left + item.offsetLeft - list.offsetLeft + item.offsetWidth / 2;
      const y = box.top + item.offsetTop - list.offsetTop + item.offsetHeight / 2;
      item.style.setProperty("--fx", `${Math.round(from.x - x)}px`);
      item.style.setProperty("--fy", `${Math.round(from.y - y)}px`);
    }
    if (list.offsetHeight > scroller.clientHeight) setFlying(false);
  }, [from.x, from.y]);

  // Fallback in case an animationend never arrives (for example in a
  // background tab).
  useEffect(() => {
    const timer = window.setTimeout(() => setFlying(false), 750 + photos.length * 90 + 250);
    return () => window.clearTimeout(timer);
  }, [photos.length]);

  const onLanded = () => {
    landed.current += 1;
    if (landed.current >= photos.length) setFlying(false);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const close = () => dialogRef.current?.close();

  // A click on the dimmed backdrop lands on the dialog element itself.
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={onDialogClick}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            You found the cats
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={close}
          >
            Close
          </button>
        </header>
        <div
          ref={scrollerRef}
          className={styles.scroller}
          data-flying={flying ? "true" : undefined}
          role="region"
          aria-label="Cat photos"
          tabIndex={0}
        >
          <ul ref={listRef} className={styles.list} onAnimationEnd={onLanded}>
            {photos.map((photo, index) => (
              <li
                key={photo.src}
                className={styles.polaroid}
                style={
                  {
                    "--i": index,
                    "--r": `${tilt(index, photos.length).toFixed(1)}deg`,
                    "--lift": `${index % 2 === 0 ? 0 : 10}px`,
                  } as CSSProperties
                }
              >
                <figure className={styles.figure}>
                  {/* Plain img: the site is a static export with unoptimised images. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    className={styles.photo}
                  />
                  {photo.caption ? (
                    <figcaption className={styles.caption}>{photo.caption}</figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}

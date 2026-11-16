"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { ART_VIEWBOX, MUG_BOX, NOTE_BOX } from "@/components/illustrations/WorkArt";
import { CoffeeWindow } from "./CoffeeWindow";
import { LichKingEgg, useLichKing } from "./LichKingEgg";
import { StickyNoteWindow } from "./StickyNoteWindow";
import egg from "./LichKingEgg.module.css";
import styles from "./DeskScene.module.css";

/** Said, in turn, by the mug when it is touched. */
export const HOT_WORDS = ["hot!", "ouch!", "careful!"] as const;
/** Every this many touches, the mug opens its window. */
export const TOUCHES_PER_COFFEE = 3;

const pct = (value: number) => `${(value * 100).toFixed(3)}%`;

/** A drawing-units box as percentages of the drawing's box. */
const place = (box: { x: number; y: number; w: number; h: number }): CSSProperties => ({
  left: pct((box.x - ART_VIEWBOX.x) / ART_VIEWBOX.w),
  top: pct((box.y - ART_VIEWBOX.y) / ART_VIEWBOX.h),
  width: pct(box.w / ART_VIEWBOX.w),
  height: pct(box.h / ART_VIEWBOX.h),
});

const MUG_STYLE = place(MUG_BOX);
/**
 * The note's target, turned like the note. It is held by its bottom edge, so
 * on small screens, where the 24px minimum makes it a little larger than the
 * note, it grows upwards, away from the screen.
 */
const NOTE_STYLE: CSSProperties = {
  ...place(NOTE_BOX),
  top: undefined,
  bottom: pct(1 - (NOTE_BOX.y + NOTE_BOX.h - ART_VIEWBOX.y) / ART_VIEWBOX.h),
  rotate: `${NOTE_BOX.rotate}deg`,
};
/** The mug's word floats up from just above its rim. */
const HOT_STYLE: CSSProperties = {
  left: pct((MUG_BOX.x + MUG_BOX.w / 2 - 6 - ART_VIEWBOX.x) / ART_VIEWBOX.w),
  bottom: pct(1 - (MUG_BOX.y - 6 - ART_VIEWBOX.y) / ART_VIEWBOX.h),
};

const subscribeNever = () => () => {};

/**
 * Wraps the Work drawing and makes three of its objects touchable: the Lich
 * King figure (five quick pokes wake it), the coffee mug (hot! every third
 * touch opens a little coffee window) and the sticky note on the laptop (it
 * opens up close, with a password on it). The scene's data attributes drive
 * the drawing's reactions. Until the page is hydrated only the drawing
 * renders.
 */
export function DeskScene({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const lich = useLichKing();
  const [touches, setTouches] = useState(0);
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const mugRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLButtonElement>(null);

  const touchMug = () => {
    const next = touches + 1;
    setTouches(next);
    if (next % TOUCHES_PER_COFFEE === 0) setCoffeeOpen(true);
  };

  return (
    <div
      className={`${egg.wrap} ${styles.scene}`}
      data-lich={lich.state}
      data-poke={lich.poke ?? undefined}
      data-mug={touches === 0 ? undefined : touches % 2 === 1 ? "a" : "b"}
    >
      {children}
      {mounted ? (
        <>
          <LichKingEgg state={lich.state} onPoke={lich.onPoke} />

          {/* In the drawing's order: the figure, the note on the lid, the mug. */}
          <button
            ref={noteRef}
            type="button"
            className={`${styles.hotspot} ${styles.noteButton}`}
            style={NOTE_STYLE}
            aria-label="Read the sticky note"
            onClick={() => setNoteOpen(true)}
          />

          <button
            ref={mugRef}
            type="button"
            className={`${styles.hotspot} ${styles.mugButton}`}
            style={MUG_STYLE}
            aria-label="Touch the coffee mug"
            onClick={touchMug}
          />
          {touches > 0 ? (
            <span key={touches} className={styles.hot} style={HOT_STYLE} aria-hidden="true">
              {HOT_WORDS[(touches - 1) % HOT_WORDS.length]}
            </span>
          ) : null}

          <CoffeeWindow open={coffeeOpen} onClose={() => setCoffeeOpen(false)} opener={mugRef} />
          <StickyNoteWindow open={noteOpen} onClose={() => setNoteOpen(false)} opener={noteRef} />
        </>
      ) : null}
    </div>
  );
}

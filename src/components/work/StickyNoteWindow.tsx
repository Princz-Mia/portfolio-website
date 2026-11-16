"use client";

import type { RefObject } from "react";
import { desk } from "@/content";
import { DeskWindow } from "./DeskWindow";
import styles from "./StickyNoteWindow.module.css";

/**
 * The sticky note on the laptop, up close: a hand-written reminder with the
 * password for the terminal's locked folder.
 */
export function StickyNoteWindow({
  open,
  onClose,
  opener,
}: {
  open: boolean;
  onClose: () => void;
  opener: RefObject<HTMLElement | null>;
}) {
  return (
    <DeskWindow
      open={open}
      onClose={onClose}
      opener={opener}
      title="note to self"
      closeLabel="Close the note"
      variant="note"
    >
      <div className={styles.hand}>
        <p className={styles.line}>don&apos;t forget:</p>
        <p className={styles.line}>
          password: <span className={styles.password}>{desk.notePassword}</span>
        </p>
        <p className={styles.line}>
          (you really do) <span className={styles.heart} aria-hidden="true">♥</span>
        </p>
      </div>
    </DeskWindow>
  );
}

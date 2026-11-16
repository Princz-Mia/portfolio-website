"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import styles from "./DeskWindow.module.css";

type DeskWindowProps = {
  open: boolean;
  /** Called whenever the window closes: its close button, Escape or the backdrop. */
  onClose: () => void;
  title: string;
  /** Accessible name of the close button in the title bar. */
  closeLabel: string;
  /** Gets the focus back when the window closes. */
  opener: RefObject<HTMLElement | null>;
  /** A window like the laptop's terminal, or a big sticky note. */
  variant?: "window" | "note";
  children: ReactNode;
};

/**
 * A small modal window for the desk's secrets, in the same look as the laptop
 * terminal: a native dialog with a title bar, three dots, a title and a close
 * button. Escape closes it, as does a click that starts and ends on the
 * backdrop; the focus then goes back to the drawing's object that opened it.
 */
export function DeskWindow({
  open,
  onClose,
  title,
  closeLabel,
  opener,
  variant = "window",
  children,
}: DeskWindowProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const downOnBackdropRef = useRef(false);
  const titleId = `${useId()}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.window} ${variant === "note" ? styles.note : ""}`}
      aria-labelledby={titleId}
      onClose={() => {
        onClose();
        opener.current?.focus({ preventScroll: true });
      }}
      onPointerDown={(e) => {
        downOnBackdropRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const startedOnBackdrop = downOnBackdropRef.current;
        downOnBackdropRef.current = false;
        if (startedOnBackdrop && e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.titleBar}>
          {variant === "window" ? (
            <span className={styles.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          ) : null}
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={closeLabel}
            onClick={() => dialogRef.current?.close()}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

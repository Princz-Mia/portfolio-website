"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { sounds } from "@/content";
import { ART_VIEWBOX, LICH_BOX } from "@/components/illustrations/WorkArt";
import { sayLichKingLine } from "./speech";
import styles from "./LichKingEgg.module.css";

export const LICH_QUOTE = "Warriors of the frozen wastes, rise!";

/** Pokes needed, close together, to wake the figure. */
const POKES_TO_WAKE = 5;
/** How close together the pokes must be, in milliseconds. */
const POKE_WINDOW_MS = 3000;
/** How long the figure stays awake, in milliseconds. */
export const AWAKE_MS = 4500;

const pct = (value: number) => `${(value * 100).toFixed(3)}%`;

/** The figure's place in the drawing, as percentages of the drawing's box. */
const POKE_BOX: CSSProperties = {
  left: pct((LICH_BOX.x - ART_VIEWBOX.x) / ART_VIEWBOX.w),
  top: pct((LICH_BOX.y - ART_VIEWBOX.y) / ART_VIEWBOX.h),
  width: pct(LICH_BOX.w / ART_VIEWBOX.w),
  height: pct(LICH_BOX.h / ART_VIEWBOX.h),
};

/**
 * The bubble sits just above the figure, starting at its left edge so it stays
 * clear of the strip of the drawing that lies under the text column on wide
 * screens, with its tail over the helm.
 */
const BUBBLE_BOX = {
  left: POKE_BOX.left,
  bottom: pct(1 - (LICH_BOX.y - 6 - ART_VIEWBOX.y) / ART_VIEWBOX.h),
  "--tail": `${((35 / ART_VIEWBOX.w) * 100).toFixed(3)}cqw`,
} as CSSProperties;

const subscribeNever = () => () => {};

type LichState = "rest" | "awake";

/**
 * Wraps the Work drawing and lays a poke target over its Lich King figure. Each
 * poke wobbles the figure; five quick pokes wake it: its eyes burn ice blue, it
 * raises Frostmourne to the sky and calls out its line, then it settles back.
 * Until the page is hydrated only the drawing renders.
 */
export function LichKingEgg({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [state, setState] = useState<LichState>("rest");
  const [poke, setPoke] = useState<"a" | "b" | null>(null);
  const pokesRef = useRef<number[]>([]);
  const awakeRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const stopSoundRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
      awakeRef.current = false;
      stopSoundRef.current?.();
      stopSoundRef.current = null;
    },
    [],
  );

  const onPoke = () => {
    setPoke((current) => (current === "a" ? "b" : "a"));
    if (awakeRef.current) return;

    const now = Date.now();
    const recent = pokesRef.current.filter((at) => now - at < POKE_WINDOW_MS);
    recent.push(now);
    pokesRef.current = recent;
    if (recent.length < POKES_TO_WAKE) return;

    pokesRef.current = [];
    awakeRef.current = true;
    setState("awake");
    stopSoundRef.current?.();
    stopSoundRef.current = sayLichKingLine(LICH_QUOTE, sounds.lichKingQuote);

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      awakeRef.current = false;
      setState("rest");
      setPoke(null);
    }, AWAKE_MS);
  };

  const awake = state === "awake";

  return (
    <div className={styles.wrap} data-lich={state} data-poke={poke ?? undefined}>
      {children}
      {mounted ? (
        <>
          <button
            type="button"
            className={styles.poke}
            style={POKE_BOX}
            aria-label="Poke the Lich King figure"
            onClick={onPoke}
          />
          <p
            className={styles.bubble}
            style={BUBBLE_BOX}
            role="status"
            data-show={awake ? "" : undefined}
          >
            {awake ? LICH_QUOTE : ""}
          </p>
        </>
      ) : null}
    </div>
  );
}

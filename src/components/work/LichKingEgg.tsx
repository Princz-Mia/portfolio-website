"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { sounds } from "@/content";
import { ART_VIEWBOX, LICH_BOX, LICH_HEAD_X } from "@/components/illustrations/WorkArt";
import { sayLichKingLine } from "./speech";
import styles from "./LichKingEgg.module.css";

export const LICH_QUOTE = "Warriors of the frozen wastes, rise!";

/** Pokes needed, close together, to wake the figure. */
const POKES_TO_WAKE = 5;
/** How close together the pokes must be, in milliseconds. */
const POKE_WINDOW_MS = 3000;
/**
 * The shortest time the figure stays awake, in milliseconds: a little longer
 * than the recorded line (6.7 seconds). If the recording is still playing then,
 * the figure waits for it to end.
 */
export const AWAKE_MS = 7400;
/** The longest time the figure stays awake, should a recording never end. */
export const MAX_AWAKE_MS = 15000;

export type LichState = "rest" | "awake";
export type LichKing = {
  state: LichState;
  /** Alternates on every poke, to restart the wobble. */
  poke: "a" | "b" | null;
  onPoke: () => void;
};

const pct = (value: number) => `${(value * 100).toFixed(3)}%`;

/** The figure's place in the drawing, as percentages of the drawing's box. */
const POKE_BOX: CSSProperties = {
  left: pct((LICH_BOX.x - ART_VIEWBOX.x) / ART_VIEWBOX.w),
  top: pct((LICH_BOX.y - ART_VIEWBOX.y) / ART_VIEWBOX.h),
  width: pct(LICH_BOX.w / ART_VIEWBOX.w),
  height: pct(LICH_BOX.h / ART_VIEWBOX.h),
};

/**
 * The bubble sits just above the throne, starting at its left edge so it stays
 * clear of the strip of the drawing that lies under the text column on wide
 * screens, with its tail over the helm.
 */
const BUBBLE_BOX = {
  left: POKE_BOX.left,
  bottom: pct(1 - (LICH_BOX.y - 4 - ART_VIEWBOX.y) / ART_VIEWBOX.h),
  "--tail": `${((LICH_HEAD_X / ART_VIEWBOX.w) * 100).toFixed(3)}cqw`,
} as CSSProperties;

/**
 * The Lich King figure's state. Each poke wobbles it; five quick pokes wake
 * it: it stands up from the throne, raises Frostmourne and says its line, then
 * sits back down once both the line and at least AWAKE_MS are over.
 */
export function useLichKing(): LichKing {
  const [state, setState] = useState<LichState>("rest");
  const [poke, setPoke] = useState<"a" | "b" | null>(null);
  const pokesRef = useRef<number[]>([]);
  const awakeRef = useRef(false);
  const minDoneRef = useRef(false);
  const soundDoneRef = useRef(false);
  const tokenRef = useRef(0);
  const minTimerRef = useRef<number | undefined>(undefined);
  const maxTimerRef = useRef<number | undefined>(undefined);
  const stopSoundRef = useRef<(() => void) | null>(null);

  const clearTimers = () => {
    window.clearTimeout(minTimerRef.current);
    window.clearTimeout(maxTimerRef.current);
    minTimerRef.current = undefined;
    maxTimerRef.current = undefined;
  };

  const sleep = useCallback(() => {
    tokenRef.current += 1;
    clearTimers();
    awakeRef.current = false;
    stopSoundRef.current?.();
    stopSoundRef.current = null;
    setState("rest");
    setPoke(null);
  }, []);

  useEffect(
    () => () => {
      tokenRef.current += 1;
      clearTimers();
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
    minDoneRef.current = false;
    soundDoneRef.current = false;
    const token = ++tokenRef.current;
    setState("awake");

    const settleIfDone = () => {
      if (token === tokenRef.current && minDoneRef.current && soundDoneRef.current) sleep();
    };

    clearTimers();
    minTimerRef.current = window.setTimeout(() => {
      minDoneRef.current = true;
      settleIfDone();
    }, AWAKE_MS);
    maxTimerRef.current = window.setTimeout(() => {
      if (token === tokenRef.current) sleep();
    }, MAX_AWAKE_MS);

    stopSoundRef.current?.();
    stopSoundRef.current = sayLichKingLine(LICH_QUOTE, sounds.lichKingQuote, () => {
      if (token !== tokenRef.current) return;
      soundDoneRef.current = true;
      settleIfDone();
    });
  };

  return { state, poke, onPoke };
}

/** The poke target over the figure and the speech bubble above it. */
export function LichKingEgg({ state, onPoke }: Pick<LichKing, "state" | "onPoke">) {
  const awake = state === "awake";
  return (
    <>
      <button
        type="button"
        className={styles.poke}
        style={POKE_BOX}
        aria-label="Poke the Lich King figure"
        onClick={onPoke}
      />
      <p className={styles.bubble} style={BUBBLE_BOX} role="status" data-show={awake ? "" : undefined}>
        {awake ? LICH_QUOTE : ""}
      </p>
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "@/content";
import { sayLichKingLine } from "./speech";

export const LICH_QUOTE = "Warriors of the frozen wastes, rise!";

/** Pokes needed, close together, to wake the figure. */
export const POKES_TO_WAKE = 5;
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
  /** Counts a poke; returns true when this poke woke the figure. */
  onPoke: () => boolean;
};

/**
 * The Lich King figure's state. Each poke wobbles it; five quick pokes wake
 * it: it stands up from the throne, raises Frostmourne and says its line (the
 * recording, or the browser's voice where there is none), then sits back down
 * once both the line and at least AWAKE_MS are over, or after MAX_AWAKE_MS.
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
    if (awakeRef.current) return false;

    const now = Date.now();
    const recent = pokesRef.current.filter((at) => now - at < POKE_WINDOW_MS);
    recent.push(now);
    pokesRef.current = recent;
    if (recent.length < POKES_TO_WAKE) return false;

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
    return true;
  };

  return { state, poke, onPoke };
}

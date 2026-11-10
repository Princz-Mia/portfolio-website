import type { CSSProperties } from "react";
import s from "./illustrations.module.css";

/** Inline style carrying an animation delay for entrance classes. */
export const delay = (seconds: number) =>
  ({ "--delay": `${seconds}s` }) as CSSProperties;

/** Inline style carrying a transform origin for sway classes. */
export const origin = (value: string) =>
  ({ "--origin": value }) as CSSProperties;

/** A four-pointed sparkle that twinkles. */
export function Sparkle({
  x,
  y,
  size = 8,
  wait = 0,
  tone = "accent",
}: {
  x: number;
  y: number;
  size?: number;
  wait?: number;
  tone?: "accent" | "ink";
}) {
  const k = size;
  const q = size * 0.28;
  const d = `M${x} ${y - k} L${x + q} ${y - q} L${x + k} ${y} L${x + q} ${y + q} L${x} ${y + k} L${x - q} ${y + q} L${x - k} ${y} L${x - q} ${y - q} Z`;
  return (
    <path
      d={d}
      className={`${tone === "accent" ? s.accent : s.inkFill} ${s.twinkle}`}
      style={delay(wait)}
    />
  );
}

/**
 * A thick outlined stroke: an ink line with a narrower fill-coloured line on top.
 * Used for tails and wooden poles.
 */
export function Tube({
  d,
  width,
  fill = "fur",
}: {
  d: string;
  width: number;
  fill?: "fur" | "shade" | "paper";
}) {
  const inner =
    fill === "fur"
      ? "var(--art-fur)"
      : fill === "shade"
        ? "var(--art-shade)"
        : "var(--paper)";
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="var(--art-ink)"
        strokeWidth={width}
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke={inner}
        strokeWidth={width - 3.4}
        strokeLinecap="round"
      />
    </g>
  );
}

export { s };

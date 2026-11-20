"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { Sparkle, s } from "./parts";
import b from "./BongoCat.module.css";

// Based on Caroline Artz's bongo cat pen: https://codepen.io/carolineartz/pen/qBOEzQa

/** How the cat currently feels, mirrored on the root as `data-mood`. */
export type Mood = "calm" | "happy" | "giddy" | "grumpy";

/** How long the eyes stay closed after a pet. */
const HAPPY_MS = 500;
/** Pets further apart than this start a new streak. */
const STREAK_MS = 1200;
/** Pets in one streak before the eyes squeeze shut. */
const GIDDY_AT = 3;
/** Pets in one streak before the cat has had enough. */
const GRUMPY_AT = 5;
/** How long the cat stays grumpy. */
const GRUMPY_MS = 2000;

/** The drawing's coordinate system; the pet button is placed against it. */
const VIEW = { x: -12, y: -60, width: 820, height: 430 };
/**
 * Outline of the visible head, ears and headphones that the pet button responds
 * to, in drawing units: from the far cup, over the far ear and the band, past the
 * near ear and down the near cup, then around the raised front paw and along the
 * chin above the keyboard.
 */
const HEAD_OUTLINE: readonly (readonly [number, number])[] = [
  [336, 132],
  [338, 96],
  [352, 74],
  [394, 58],
  [434, 76],
  [500, 74],
  [572, 100],
  [628, 110],
  [640, 124],
  [650, 160],
  [650, 212],
  [594, 214],
  [592, 178],
  [526, 178],
  [524, 228],
  [334, 216],
];

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

/** Places the button over the outline's bounding box and clips it to the outline. */
function hitArea(outline: typeof HEAD_OUTLINE): CSSProperties {
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const width = Math.max(...xs) - left;
  const height = Math.max(...ys) - top;
  const corners = outline
    .map(([x, y]) => `${percent((x - left) / width)} ${percent((y - top) / height)}`)
    .join(", ");

  return {
    left: percent((left - VIEW.x) / VIEW.width),
    top: percent((top - VIEW.y) / VIEW.height),
    width: percent(width / VIEW.width),
    height: percent(height / VIEW.height),
    "--pet-shape": `polygon(${corners})`,
  } as CSSProperties;
}

const petButtonBox = hitArea(HEAD_OUTLINE);

const moodMessages: Record<Mood, string> = {
  calm: "",
  happy: "Purr.",
  giddy: "Purr purr purr!",
  grumpy: "That is quite enough petting. The cat is grumpy for a moment.",
};

const cx = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const round = (n: number) => Math.round(n * 10) / 10;

/* Line weights tuned for this drawing's scale, layered on the shared styles. */
const line = cx(s.line, b.w);
const strong = cx(s.line, s.strong, b.w);
const bold = cx(s.line, s.strong, b.wBold);
const thin = cx(s.line, s.thin, b.wThin);
const hair = cx(s.line, b.wHair);
const accentLine = cx(s.accentLine, b.w);

/* Shapes reused for the offset print shadows. */
const HEAD =
  "M280.4,221 L280,240 L664,296 L664.2,283.6 a171.4,171.4,0,0,0-9.2-40.5,174,174,0,0,0-28.7-50.5,163.3,163.3,0,0,0,3.2-73.8c-11.6-1.9-42,14.2-44.5,17.5-19.6-24-88.5-52.7-153.7-48.1A78.8,78.8,0,0,0,398,67.1c-9.8,2.9-19,29.7-19.4,33.7a320,320,0,0,0-31.7,23.6c-14,11.8-28.9,24.4-42.5,44.3A173,173,0,0,0,280.4,221Z";
const DESK = "25.3,158.5 783.2,293 513,354.9";
const LAPTOP_BASE = "103.2,263.6 258.9,219.3 636.5,294.4 452.1,339";
/** Rows of keys on the laptop deck. */
const KEYS = [
  "369.6 265.6 255.3 244.3 255.5 243.5 264.7 241.9 380.9 262.3 380.8 263.1",
  "235.9 256.4 219.8 253.2 219.9 252.5 228.7 251 245.3 253.4 245.1 254.2",
  "473.1 303.7 248.4 258.9 248.6 258.1 257.7 256.6 486.2 300.4 486 301.3",
  "410.3 300.2 202.7 257.5 202.9 256.8 211.4 255.3 422.4 297.1 422.2 298",
  "448.5 308.1 427 303.7 427.3 302.8 439.2 301.4 461.2 304.9 461 305.8",
  "200.1 264.7 186 261.7 186.2 261 194.5 259.5 208.9 261.8 208.8 262.5",
  "221.1 269.1 206.6 266.1 206.8 265.3 215.4 263.9 230.3 266.2 230.1 267",
  "361.4 298.9 230 271 230.2 270.3 239.2 268.9 372.7 295.9 372.5 296.7",
  "442.8 279.2 383.7 268.2 383.9 267.3 395.1 265.7 455.4 275.9 455.2 276.7",
  "524.6 294.4 458.6 282.1 458.8 281.2 471.3 279.7 538.6 291 538.4 291.9",
  "424.7 312.4 374.6 301.7 374.8 300.9 385.9 299.5 437 309.3 436.8 310.2",
  "409.1 277.3 397.6 278.8 397.4 279.6 498.4 299.1 511.8 296.7 512 295.8",
  "394.2 274.5 394.4 273.6 246.7 246.5 237.7 248.1 237.5 248.8 382.8 276.8",
];

/**
 * The two pointed ears, traced from the head outline so they line up with it
 * exactly. They are drawn again on top of the headband, so the band passes
 * behind them and both ears stay in full view; the speakers go over their
 * bases. Each has a closed shape for the fill (closed along its base, inside the
 * head) and an open outline.
 */
const EARS = [
  {
    side: "far",
    fill: "M431.3,88.2 A78.8,78.8,0,0,0,398,67.1 C388.2,70 379,96.8 378.6,100.8 Z",
    edge: "M431.3,88.2 A78.8,78.8,0,0,0,398,67.1 C388.2,70 379,96.8 378.6,100.8",
    inner: "M418.4,85.6 Q408,74 399.4,74.6 Q393.2,80 389.6,94.4 Z",
  },
  {
    side: "near",
    fill: "M632.2,146 A163.3,163.3,0,0,0,629.5,118.8 C617.9,116.9 587.5,133 585,136.3 Z",
    edge: "M632.2,146 A163.3,163.3,0,0,0,629.5,118.8 C617.9,116.9 587.5,133 585,136.3",
    inner: "M624.8,140.6 Q625.6,130 623.2,125.2 Q610.4,127 598.6,135.4 Z",
  },
] as const;

type Point = [number, number];

/**
 * The headset from the old site, traced from its drawing: two speakers, each
 * three nested shapes (the shell, the cushion and the outer face, which turns
 * towards the outside of the head), and a band in two strokes that meet over the
 * middle of the head. The far speaker sits against the head at the base of the
 * far ear, the near one on the side of the head below the near ear.
 */
const FAR_SPEAKER = [
  "M400.7,80.2c-14.1-20.8-40.2.3-50.7,15-8.7,12.2-9.7,30.3,2.8,37.3,5.4-9,11.8-15.6,21-26.2A214.1,214.1,0,0,1,400.7,80.2Z",
  "M381.5,79.4c-6.6-7.5-9.6-5.8-12.3-5.5-16.3,1.3-32,20.3-27.8,33.9a21.8,21.8,0,0,0,5.9,8.5c1.7-2.6,3.5-5.1,5.4-7.7A150.7,150.7,0,0,1,381.5,79.4Z",
  "M367.3,77.8a13.1,13.1,0,0,0-5.1-1.8c-8.5-.9-18.7,7.5-18.4,16.1a12.8,12.8,0,0,0,2.6,7c3.1-3.3,6.3-6.8,9.6-10.2S363.6,81.3,367.3,77.8Z",
] as const;
const NEAR_SPEAKER = [
  "M609.5,137.3c-17.1,6.3-20.7,51.4-4.5,67.3,1.4,1.5,5.5,5.5,11.3,5.9,8.2.5,14.5-6.3,16.9-8.9,10.1-11,11.5-27.5,8.1-40.1-1.4-4.8-3.9-14-12.7-19.9C627.4,140.8,617.7,134.3,609.5,137.3Z",
  "M626.5,196.1c2.7-.4,5.9-2.6,9.3-6,6.6-6.6,6.8-16.6,5.8-24s-4.2-16.1-11.3-19.7a18.7,18.7,0,0,0-10.9-1.9C614,149.3,615.3,192.6,626.5,196.1Z",
  "M631.6,151c-4.5,3.3-.5,27.1,3.8,28.2s6.9-6.6,6.2-13.1S637.4,153.5,631.6,151Z",
] as const;

/**
 * How far the far speaker is moved from its traced spot, so it rests snugly
 * against the head at the base of the far ear instead of standing off beside it.
 */
const FAR_NUDGE: Point = [4, 4];

/**
 * The band, traced too. The far half ends on top of the far speaker, following
 * it wherever it is nudged. The near half keeps the traced arc over the crown and
 * carries on down the side of the head the way a real band bends: it leaves the
 * arc without a kink, follows the same curve, drawing in a little as the head
 * narrows towards its side, and slips behind the near ear (drawn over it) to end
 * on top of the speaker's shell, just inside its outline, so the ear and the
 * speaker together cover the join with no gap and no overshoot.
 */
const BAND = [
  `M527,43.6c-15.9-4.6-57-14.1-104,2.3a166.9,166.9,0,0,0,${round(-60.9 + FAR_NUDGE[0])},${round(37.3 + FAR_NUDGE[1])}`,
  "M616,141C607,117 593.4,82.5 563.6,62.4A155.5,155.5,0,0,0,515,40.6",
] as const;

/** The accent pad on the crown of the band, turned with it. */
const PAD = { x: 486.7, y: 36.9, angle: 2.8 };

/** The laptop screen's corners: far top, near top, near bottom, far bottom. */
const SCREEN_CORNERS: readonly Point[] = [
  [93.8, 63.3],
  [284.1, 73],
  [335.9, 230.5],
  [146.2, 197.6],
];
const SCREEN = SCREEN_CORNERS.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * Code is laid out in a flat grid of 100 by 100 units, u along a line from the
 * screen's left edge and v down from its top edge. Lines start at the right edge
 * (u = 100), the side the cat reads from, and run towards the left. The screen
 * is drawn in perspective, so this is the projective map that takes the grid's
 * corners exactly onto the screen's corners: lines of equal v fan from the slope
 * of the top edge to the slope of the bottom edge, and every point of the grid
 * lands inside the screen.
 */
const toScreen = (() => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = SCREEN_CORNERS;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1;
  const bx = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  return (u: number, v: number): Point => {
    const sx = u / 100;
    const sy = v / 100;
    const w = g * sx + h * sy + 1;
    return [(a * sx + bx * sy + x0) / w, (d * sx + e * sy + y0) / w];
  };
})();

/** Line spacing, first line, margin before each line (from the right edge), indent and token gap, in grid units. */
const LINE_GAP = 9;
const FIRST_LINE = 9.5;
const MARGIN = 7;
const INDENT = 7;
const TOKEN_GAP = 3;

/** Lines that fit on the screen at once; the bottom one is being typed. */
const ROWS = 10;
/** Seconds per line: scroll up, then type the new bottom line. */
const STEP_S = 1.2;
/** Seconds the scroll takes at the start of each step. */
const SCROLL_S = 0.18;
/** Typing speed in grid units per second, gaps between tokens included. */
const TYPE_RATE = 90;

/** The visible band of lines, in grid units: half a line above the first and below the last. */
const ROWS_TOP = FIRST_LINE - LINE_GAP * 0.55;
const ROWS_BOTTOM = FIRST_LINE + (ROWS - 1) * LINE_GAP + LINE_GAP * 0.55;
const ROWS_CLIP = [
  toScreen(2, ROWS_TOP),
  toScreen(98, ROWS_TOP),
  toScreen(98, ROWS_BOTTOM),
  toScreen(2, ROWS_BOTTOM),
]
  .map(([x, y]) => `${round(x)},${round(y)}`)
  .join(" ");

/** One screenful-plus of code: indentation level, token lengths, highlighted token. */
const LINES: { indent: number; tokens: number[]; accent?: number }[] = [
  { indent: 0, tokens: [14, 9, 16] },
  { indent: 1, tokens: [12, 22], accent: 0 },
  { indent: 2, tokens: [10, 6, 20] },
  { indent: 2, tokens: [16, 12], accent: 1 },
  { indent: 3, tokens: [24, 10] },
  { indent: 2, tokens: [4] },
  { indent: 1, tokens: [4] },
  { indent: 0, tokens: [] },
  { indent: 1, tokens: [12, 18, 8], accent: 0 },
  { indent: 2, tokens: [20, 14] },
  { indent: 2, tokens: [8, 24], accent: 1 },
  { indent: 1, tokens: [4] },
];

/** Seconds for the whole program to scroll past once. */
const LOOP_S = LINES.length * STEP_S;

/**
 * Where the loop opens: late in the first step, after its bottom line has typed
 * itself and before the next scroll. At that moment the screen shows lines 0 to
 * ROWS - 1 at rest, which is also the still drawing, so nothing shifts when the
 * animation starts.
 */
const OPEN_S = STEP_S - 0.2;

/** The loop's timing, for tests and anything that wants to follow along. */
export const SCREEN_LOOP = {
  rows: ROWS,
  lines: LINES.length,
  gap: LINE_GAP,
  first: FIRST_LINE,
  stepS: STEP_S,
  scrollS: SCROLL_S,
  loopS: LOOP_S,
  openS: OPEN_S,
} as const;

/**
 * Every token of the program, laid out once along its line in grid units. A line
 * starts at the right margin, indented leftwards, and its tokens follow one
 * another towards the left edge; `u` is where a token starts, its right end.
 */
const TOKENS = LINES.flatMap(({ indent, tokens, accent }, row) => {
  const start = 100 - MARGIN - indent * INDENT;
  let u = start;
  return tokens.map((length, index) => {
    const token = {
      key: `${row}-${index}`,
      row,
      u: u,
      length,
      /** Grid units typed on the line before this token begins. */
      after: start - u,
      accent: index === accent,
    };
    u -= length + TOKEN_GAP;
    return token;
  });
});

/**
 * Where one token is on screen at some moment: (x1, y1) is where it starts, at
 * its right end, and (x2, y2) the end it grows towards while typed; `null` while
 * it is not shown.
 */
export type TokenSpot = { x1: number; y1: number; x2: number; y2: number } | null;

const easeOut = (x: number) => 1 - (1 - x) ** 3;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * The screen at `t` seconds into the loop. Each step the lines scroll up by one
 * (eased), the top line slides out past the top edge, and the new bottom line
 * types itself from its start at the right edge towards the left, at a steady
 * pace. A line's slot counts from the top: slot ROWS is the line being typed
 * this step, lower slots are finished and higher ones have not been reached yet.
 */
export function screenAt(t: number): TokenSpot[] {
  const time = mod(t, LOOP_S);
  const step = Math.floor(time / STEP_S);
  const phase = time - step * STEP_S;
  const scrolled = easeOut(Math.min(phase / SCROLL_S, 1));
  const typed = Math.max(0, phase - SCROLL_S) * TYPE_RATE;

  return TOKENS.map(({ row, u, length, after }) => {
    const slot = mod(row - step + 1, LINES.length);
    const position = slot - scrolled;
    if (slot > ROWS || position <= -1) {
      return null;
    }
    const shown = slot < ROWS ? length : Math.min(length, typed - after);
    if (shown <= 0) {
      return null;
    }
    const v = FIRST_LINE + position * LINE_GAP;
    const [x1, y1] = toScreen(u, v);
    const [x2, y2] = toScreen(u - shown, v);
    const r = (n: number) => Math.round(n * 100) / 100;
    return { x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2) };
  });
}

/** The screen in the still drawing, which is also where the loop opens. */
const STILL = screenAt(OPEN_S);

const spotKey = (spot: TokenSpot) =>
  spot ? `${spot.x1} ${spot.y1} ${spot.x2} ${spot.y2}` : "";

type NoteKind = "single" | "pair";
type Tone = "accent" | "ink";

/** Notes that drift up from the headphones while the cat plays. */
const NOTES: {
  x: number;
  y: number;
  kind: NoteKind;
  tone: Tone;
  dx: number;
  turn: number;
  wait: number;
}[] = [
  { x: 362, y: 64, kind: "single", tone: "accent", dx: -36, turn: -18, wait: 0 },
  { x: 380, y: 70, kind: "pair", tone: "ink", dx: 24, turn: 14, wait: 1.5 },
  { x: 352, y: 66, kind: "single", tone: "ink", dx: -14, turn: 22, wait: 3 },
  { x: 650, y: 132, kind: "pair", tone: "accent", dx: 38, turn: 16, wait: 0.75 },
  { x: 664, y: 140, kind: "single", tone: "ink", dx: 16, turn: -20, wait: 2.25 },
  { x: 648, y: 128, kind: "single", tone: "accent", dx: 50, turn: 24, wait: 3.75 },
];

/** A music note drawn with its lowest note head at the origin. */
function Note({ kind, tone }: { kind: NoteKind; tone: Tone }) {
  const stroke = tone === "accent" ? accentLine : strong;
  const head = cx(stroke, tone === "accent" ? s.accent : s.inkFill);
  const beam = cx(
    tone === "accent" ? s.accentLine : cx(s.line, s.strong),
    b.wBold,
  );

  if (kind === "pair") {
    return (
      <g>
        <path d="M0 -1 V-38 M33 5 V-31" className={stroke} />
        <path d="M0 -38 L33 -31" className={beam} />
        <ellipse cx="-7" cy="0" rx="7.4" ry="5.2" transform="rotate(-22 -7 0)" className={head} />
        <ellipse cx="26" cy="6" rx="7.4" ry="5.2" transform="rotate(-22 26 6)" className={head} />
      </g>
    );
  }

  return (
    <g>
      <path d="M0 -1 V-42 C2 -34 12 -31 13 -21 C13.5 -17 12.5 -14 11 -12" className={stroke} />
      <ellipse cx="-7" cy="0" rx="7.4" ry="5.2" transform="rotate(-22 -7 0)" className={head} />
    </g>
  );
}

/** Eye centres; the head is tilted by about eight degrees. */
const EYES = [
  { x: 371, y: 170 },
  { x: 480, y: 184 },
] as const;
const TILT = 8;

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "happy") {
    return (
      <g>
        {EYES.map(({ x, y }) => (
          <path
            key={x}
            d={`M${x - 8} ${y + 3} Q${x} ${y - 8} ${x + 8} ${y + 3}`}
            transform={`rotate(${TILT} ${x} ${y})`}
            className={bold}
          />
        ))}
      </g>
    );
  }

  if (mood === "giddy") {
    const [left, right] = EYES;
    return (
      <g>
        <path
          d={`M${left.x - 6} ${left.y - 7} L${left.x + 6} ${left.y} L${left.x - 6} ${left.y + 7}`}
          transform={`rotate(${TILT} ${left.x} ${left.y})`}
          className={bold}
        />
        <path
          d={`M${right.x + 6} ${right.y - 7} L${right.x - 6} ${right.y} L${right.x + 6} ${right.y + 7}`}
          transform={`rotate(${TILT} ${right.x} ${right.y})`}
          className={bold}
        />
      </g>
    );
  }

  if (mood === "grumpy") {
    return (
      <g>
        {EYES.map(({ x, y }) => (
          <g key={x} transform={`rotate(${TILT} ${x} ${y})`}>
            <path
              d={`M${x - 7.5} ${y - 1} L${x + 7.5} ${y - 1} A7.5 6.5 0 0 1 ${x - 7.5} ${y - 1} Z`}
              className={s.dark}
            />
            <path d={`M${x - 9} ${y - 1.5} H${x + 9}`} className={strong} />
          </g>
        ))}
        {/* brows pulled down towards the nose */}
        <path d="M355 147 L386 158 M464 171 L494 163" className={bold} />
      </g>
    );
  }

  return (
    <g>
      {EYES.map(({ x, y }) => (
        <g key={x} className={s.blink}>
          <ellipse
            cx={x}
            cy={y}
            rx="6.5"
            ry="8"
            transform={`rotate(${TILT} ${x} ${y})`}
            className={s.dark}
          />
          <circle cx={x - 2} cy={y - 3.5} r="2.2" className={s.paper} />
        </g>
      ))}
    </g>
  );
}

/** One raised and one resting pose for a paw; CSS swaps them while tapping. */
function Paw({
  down,
  up,
  toes,
  pad,
  leadsWithUp,
  paused,
}: {
  down: string;
  up: string;
  /** Centres of the three toe beans on the raised paw. */
  toes: [number, number][];
  /** Centre of the main pad on the raised paw. */
  pad: [number, number];
  leadsWithUp: boolean;
  /** Holds the tapping on its current frame; it carries on from there. */
  paused: boolean;
}) {
  return (
    <g data-loop="paw" data-paused={paused ? "" : undefined}>
      <path d={down} className={cx(line, s.fur, leadsWithUp ? b.tapB : b.tapA)} />
      <g className={cx(b.pawUp, leadsWithUp ? b.tapA : b.tapB)}>
        <path d={up} className={cx(line, s.fur)} />
        <g className={b.pads}>
          {toes.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" className={s.accent} />
          ))}
          <ellipse
            cx={pad[0]}
            cy={pad[1]}
            rx="5.6"
            ry="7"
            transform={`rotate(-28 ${pad[0]} ${pad[1]})`}
            className={s.accent}
          />
        </g>
      </g>
    </g>
  );
}

const subscribeNothing = () => () => {};

/** False while rendering on the server and hydrating, true once mounted. */
function useMounted() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/**
 * The cat from the old site: headphones on, paws drumming on a laptop while code
 * types and scrolls up the screen and notes drift up. Petting its head closes its
 * eyes; too many pets in a row make it grumpy for a moment: it stops drumming and
 * typing until it calms down, then carries on where it left off, while the music
 * in its headphones (and so the notes) never stops.
 */
export function BongoCat() {
  const titleId = useId();
  const mounted = useMounted();
  const [mood, setMood] = useState<Mood>("calm");
  const [shakes, setShakes] = useState(0);
  const [petted, setPetted] = useState(false);

  const streak = useRef(0);
  const timers = useRef<{
    eyes?: number;
    streak?: number;
    grumpy?: number;
  }>({});

  useEffect(() => {
    const pending = timers.current;
    return () => {
      window.clearTimeout(pending.eyes);
      window.clearTimeout(pending.streak);
      window.clearTimeout(pending.grumpy);
    };
  }, []);

  const pet = () => {
    if (mood === "grumpy") {
      return;
    }
    const t = timers.current;
    setPetted(true);
    setShakes((count) => count + 1);

    streak.current += 1;
    window.clearTimeout(t.streak);
    window.clearTimeout(t.eyes);

    if (streak.current >= GRUMPY_AT) {
      streak.current = 0;
      setMood("grumpy");
      t.grumpy = window.setTimeout(() => setMood("calm"), GRUMPY_MS);
      return;
    }

    setMood(streak.current >= GIDDY_AT ? "giddy" : "happy");
    t.eyes = window.setTimeout(() => setMood("calm"), HAPPY_MS);
    t.streak = window.setTimeout(() => {
      streak.current = 0;
    }, STREAK_MS);
  };

  const grumpy = mood === "grumpy";
  // Alternating between two identical animations restarts the shake on every pet.
  const shake = shakes === 0 ? undefined : shakes % 2 ? b.shakeA : b.shakeB;

  return (
    <div className={b.root} data-mood={mood}>
      <div className={b.stage}>
        <svg
          className={cx(s.figure, b.scene)}
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}
          width={VIEW.width}
          height={VIEW.height}
          role="img"
          aria-labelledby={titleId}
          focusable="false"
        >
          <title id={titleId}>
            Line drawing of a cat with headphones tapping away on a laptop
          </title>

          {/* backdrop */}
          <circle cx="512" cy="160" r="146" className={s.blob} />
          <circle cx="118" cy="34" r="58" className={s.blobShade} />

          {/* head, headphones and ears */}
          <g className={cx(b.shakes, shake)}>
            <path d={HEAD} className={s.tint} transform="translate(7 6)" />
            <path d={HEAD} className={cx(line, s.fur)} />
            <ellipse
              cx="422"
              cy="187"
              rx="36"
              ry="21"
              transform={`rotate(${TILT} 422 187)`}
              className={s.paper}
            />
            <ellipse
              cx="354"
              cy="187"
              rx="9"
              ry="5"
              transform={`rotate(${TILT} 354 187)`}
              className={s.tint}
            />
            <ellipse
              cx="496"
              cy="202"
              rx="10"
              ry="5.5"
              transform={`rotate(${TILT} 496 202)`}
              className={s.tint}
            />
            <Eyes mood={mood} />
            <path d="M414 170.5 Q421.5 166 429 171.5 L421.5 178.5 Z" className={s.accent} />
            <path
              d="M396.6,178.6c.4.9,2.7,6.5,8.5,8.4s13.4-1.2,17.2-7.9c-.9,7.5,3.8,14.3,10.4,16a14.4,14.4,0,0,0,15-5.7"
              className={strong}
            />
            <path d="M510 196 L552 191 M511 204 L553 209" className={thin} />

            <Headset />
          </g>

          {/* notes from the far cup */}
          <Notes side="far" />

          {/* desk */}
          <polygon points={DESK} className={s.paper} />
          <polygon points="25.3,158.5 783.2,293 783.2,305 25.3,164" className={s.tint} />
          <path d="M25.3 158.5 L783.2 293" className={strong} />

          {/* laptop deck */}
          <polygon points={LAPTOP_BASE} className={s.tint} transform="translate(8 7)" />
          <polygon points={LAPTOP_BASE} className={cx(line, s.paper)} />
          {KEYS.map((points) => (
            <polygon key={points} points={points} className={cx(hair, s.shade)} />
          ))}
          <circle cx="282" cy="296" r="3" className={s.accent} />

          {/* paw behind the screen */}
          <Paw
            leadsWithUp={false}
            paused={grumpy}
            down="M289.1,181.7c-12.1,9.8-20.6,20.7-20.7,32.1-0.2,9,3.8,20.4,13.3,25.2s20.1,0.6,29.6-3.4c13.4-5.7,23.9-14.6,29.4-21.5"
            up="M327.3,170c-0.4-1.4-6.3-18.8-23.5-23.5-0.8-0.2-18.6-4.7-28.9,6.3-8.4,9.1-6,22.5-4.6,30.2a54.3,54.3,0,0,0,8.1,19.9"
            toes={[
              [298.6, 156],
              [287.2, 160.6],
              [278.6, 172],
            ]}
            pad={[297.4, 176.4]}
          />

          {/* screen and lid */}
          <polygon points={SCREEN} className={cx(line, s.shade)} />
          <Screen paused={grumpy} />
          <polygon points="103.2,263.6 452.1,339 360.8,12.4 2,2" className={line} />

          {/* paw in front of the lid */}
          <Paw
            leadsWithUp
            paused={grumpy}
            down="M534.1,231.4c-19.7,6-32.9,18.4-34.2,29.1a30.1,30.1,0,0,0,1.7,14.1,24.8,24.8,0,0,0,6.1,8.8c6,5.1,16.8,4,38-3.9a288.7,288.7,0,0,0,46.5-22.1"
            up="M586.6,208.8c-.6-2.3-4.2-15.6-17.2-22.2-2.7-1.3-12.8-6.4-23.6-1.8s-14.6,16.5-14.8,18.4c-1.2,9-.7,18.4,2.4,26.1,2.4,6,7.5,17.2,9.7,20.2"
            toes={[
              [562.6, 196],
              [551.8, 201.4],
              [542.6, 212],
            ]}
            pad={[561.4, 216.8]}
          />

          {/* notes from the near cup */}
          <Notes side="near" />

          {grumpy ? (
            <g>
              <g transform="translate(470 16)">
                <path
                  d="M-10 -3 Q-3 -3 -3 -10 M3 -10 Q3 -3 10 -3 M10 3 Q3 3 3 10 M-3 10 Q-3 3 -10 3"
                  className={cx(b.mark, s.accentLine, b.wBold)}
                />
              </g>
              <g transform="translate(684 104) rotate(8)">
                <text className={cx(b.mark, b.markText)}>#$!</text>
              </g>
            </g>
          ) : null}

          <g className={b.sparkles}>
            <Sparkle x={742} y={58} size={11} wait={0} />
            <Sparkle x={262} y={-28} size={8} wait={0.9} tone="ink" />
            <Sparkle x={780} y={212} size={8} wait={1.7} tone="ink" />
            <Sparkle x={56} y={292} size={10} wait={1.2} />
          </g>
        </svg>

        {mounted ? (
          <button
            type="button"
            className={b.pet}
            style={petButtonBox}
            aria-label="Pet the cat"
            onClick={pet}
          />
        ) : null}
      </div>

      <p className={b.hint} data-gone={petted ? "" : undefined} aria-hidden="true">
        {mounted ? "psst: pet the cat" : null}
      </p>
      {mounted ? (
        <p className="visually-hidden" aria-live="polite">
          {moodMessages[mood]}
        </p>
      ) : null}
    </div>
  );
}

/** One speaker: shell, cushion and outer face, over a tinted print shadow. */
function Speaker({ paths }: { paths: readonly [string, string, string] }) {
  const [shell, cushion, face] = paths;
  return (
    <g>
      <path d={shell} className={s.tint} transform="translate(6 5)" />
      <path d={shell} className={cx(strong, s.dark)} />
      <path d={cushion} className={cx(line, s.shade)} />
      <path d={face} className={cx(thin, s.paper)} />
    </g>
  );
}

/**
 * The headset from the old site: the band arcs over the head and passes behind
 * both ears, which stay in full view, and ends on top of each speaker. The
 * speakers are drawn last, over the band ends and over the base of each ear, as
 * on the old site: the far speaker's tip covers the foot of the far ear rather
 * than the ear cutting across the speaker.
 */
function Headset() {
  return (
    <g>
      {BAND.map((d) => (
        <path key={d} d={d} className={b.band} />
      ))}
      <rect
        x={PAD.x - 11}
        y={PAD.y - 4.5}
        width="22"
        height="9"
        rx="4.5"
        transform={`rotate(${PAD.angle} ${PAD.x} ${PAD.y})`}
        className={cx(strong, s.accent)}
      />
      {EARS.map(({ side, fill, edge, inner }) => (
        <g key={side} data-part="ear" data-side={side}>
          <path d={fill} className={s.fur} />
          <path d={inner} className={s.tint} />
          <path d={edge} className={line} />
        </g>
      ))}
      <g data-part="speaker" data-side="far" transform={`translate(${FAR_NUDGE[0]} ${FAR_NUDGE[1]})`}>
        <Speaker paths={FAR_SPEAKER} />
      </g>
      <g data-part="speaker" data-side="near">
        <Speaker paths={NEAR_SPEAKER} />
      </g>
    </g>
  );
}

/**
 * Code on the laptop screen, scrolling like a terminal: each step the lines move
 * up by one, the top line slides out past the top margin and the new bottom line
 * types itself from its start at the right edge towards the left. The screen is
 * in perspective, which a CSS or SVG transform cannot follow, so while the
 * drawing is in view a small frame loop places each token with `screenAt`. It
 * only writes attributes that changed, holds its place while paused, and stops
 * when the drawing is off screen, the tab is hidden or motion is reduced.
 * Without it the screen keeps the still frame rendered on the server.
 */
function Screen({ paused }: { paused: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const screenClip = `${id}-screen`;
  const rowsClip = `${id}-rows`;
  const group = useRef<SVGGElement>(null);
  const hold = useRef(paused);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    hold.current = paused;
    wake.current();
  }, [paused]);

  useEffect(() => {
    const root = group.current;
    if (!root || typeof window.requestAnimationFrame !== "function") {
      return;
    }

    const lines = Array.from(root.querySelectorAll("line"));
    const written = STILL.map(spotKey);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let time = OPEN_S;
    let frame = 0;
    let last: number | null = null;
    let onScreen = true;

    const draw = () => {
      screenAt(time).forEach((spot, index) => {
        const key = spotKey(spot);
        const node = lines[index];
        if (!node || key === written[index]) {
          return;
        }
        written[index] = key;
        if (!spot) {
          node.setAttribute("visibility", "hidden");
          return;
        }
        node.setAttribute("x1", String(spot.x1));
        node.setAttribute("y1", String(spot.y1));
        node.setAttribute("x2", String(spot.x2));
        node.setAttribute("y2", String(spot.y2));
        node.removeAttribute("visibility");
      });
    };

    const tick = (now: number) => {
      frame = 0;
      if (last !== null) {
        // A long gap (a hidden tab, a busy frame) moves on by one frame at most.
        time = mod(time + Math.min(now - last, 100) / 1000, LOOP_S);
      }
      last = now;
      draw();
      update();
    };

    const update = () => {
      if (motion.matches && time !== OPEN_S) {
        time = OPEN_S;
        draw();
      }
      // The InView wrapper marks the drawing once it has scrolled into view.
      const live =
        root.closest("[data-anim]")?.getAttribute("data-anim") === "in" &&
        !motion.matches &&
        onScreen &&
        !document.hidden &&
        !hold.current;
      if (live) {
        if (!frame) {
          frame = window.requestAnimationFrame(tick);
        }
        return;
      }
      window.cancelAnimationFrame(frame);
      frame = 0;
      last = null;
    };

    // The wrapper only gains its attribute after mount, so watch every ancestor.
    const attributes = new MutationObserver(update);
    for (let node = root.parentElement; node; node = node.parentElement) {
      attributes.observe(node, { attributes: true, attributeFilter: ["data-anim"] });
    }

    let visibility: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      visibility = new IntersectionObserver((entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        update();
      });
      visibility.observe(root);
    }

    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    wake.current = update;
    update();

    return () => {
      wake.current = () => {};
      window.cancelAnimationFrame(frame);
      attributes.disconnect();
      visibility?.disconnect();
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <g clipPath={`url(#${screenClip})`}>
      <defs>
        <clipPath id={screenClip}>
          <polygon points={SCREEN} />
        </clipPath>
        <clipPath id={rowsClip}>
          {/* exactly ROWS lines, with half a line of margin above and below */}
          <polygon points={ROWS_CLIP} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${rowsClip})`}>
        <g ref={group} data-loop="screen" data-paused={paused ? "" : undefined}>
          {TOKENS.map(({ key, accent }, index) => {
            const spot = STILL[index];
            return (
              <line
                key={key}
                x1={spot?.x1 ?? 0}
                y1={spot?.y1 ?? 0}
                x2={spot?.x2 ?? 0}
                y2={spot?.y2 ?? 0}
                visibility={spot ? undefined : "hidden"}
                className={cx(b.code, accent && b.codeAccent)}
              />
            );
          })}
        </g>
      </g>
    </g>
  );
}

/**
 * The notes for one headphone cup: one still note that shows when nothing moves,
 * and a few that rise and fade in a staggered loop once the drawing is in view.
 */
function Notes({ side }: { side: "far" | "near" }) {
  const live = side === "far" ? NOTES.slice(0, 3) : NOTES.slice(3);
  return (
    <g data-loop="notes">
      {side === "far" ? (
        <g className={b.noteStill} transform="translate(332 36) rotate(-14)">
          <Note kind="single" tone="accent" />
        </g>
      ) : (
        <g className={b.noteStill} transform="translate(668 104) rotate(12)">
          <Note kind="pair" tone="ink" />
        </g>
      )}
      {live.map((note) => (
        <g key={`${note.x}-${note.y}`} transform={`translate(${note.x} ${note.y})`}>
          <g
            className={b.noteLive}
            style={
              {
                "--dx": `${note.dx}px`,
                "--turn": `${note.turn}deg`,
                "--delay": `${note.wait}s`,
              } as CSSProperties
            }
          >
            <Note kind={note.kind} tone={note.tone} />
          </g>
        </g>
      ))}
    </g>
  );
}

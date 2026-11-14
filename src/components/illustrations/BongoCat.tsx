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
 * Outline of the visible head and headphones that the pet button responds to,
 * in drawing units: from the far cup, over the band, down past the near cup,
 * then around the raised front paw and along the chin above the keyboard.
 */
const HEAD_OUTLINE: readonly (readonly [number, number])[] = [
  [334, 96],
  [372, 54],
  [392, 34],
  [470, 18],
  [556, 20],
  [632, 70],
  [650, 118],
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
 * The headphone cups, each centred over an ear and tilted with the head so it
 * covers the ear snugly. `turn` is in degrees; the near cup faces the viewer more.
 */
type Cup = { x: number; y: number; rx: number; ry: number; turn: number };
const FAR_CUP: Cup = { x: 402, y: 85, rx: 23, ry: 31, turn: -10 };
const NEAR_CUP: Cup = { x: 613, y: 152, rx: 31, ry: 40, turn: 12 };

/** How far above a cup's top the band ends, hidden inside the yoke. */
const BAND_TUCK = 4;

/** Where the band meets a cup: just inside the yoke on top of it. */
function bandEnd({ x, y, ry, turn }: Cup): [number, number] {
  const angle = (turn * Math.PI) / 180;
  const reach = ry + BAND_TUCK;
  return [x + reach * Math.sin(angle), y - reach * Math.cos(angle)];
}

/**
 * One continuous arc over the head from yoke to yoke. Each end leaves its cup
 * along the cup's own axis, so the band runs straight into both yokes.
 */
const BAND = (() => {
  const [x0, y0] = bandEnd(FAR_CUP);
  const [x3, y3] = bandEnd(NEAR_CUP);
  const lift = (cup: Cup, length: number): [number, number] => {
    const angle = (cup.turn * Math.PI) / 180;
    return [length * Math.sin(angle), -length * Math.cos(angle)];
  };
  const [dx1, dy1] = lift(FAR_CUP, 50);
  const [dx2, dy2] = lift(NEAR_CUP, 80);
  const r = (n: number) => Math.round(n * 10) / 10;
  const [x1, y1, x2, y2] = [x0 + dx1, y0 + dy1, x3 + dx2, y3 + dy2];
  // The midpoint and direction of the curve, where the accent pad sits.
  const mx = (x0 + 3 * x1 + 3 * x2 + x3) / 8;
  const my = (y0 + 3 * y1 + 3 * y2 + y3) / 8;
  const angle = (Math.atan2(y3 + y2 - y1 - y0, x3 + x2 - x1 - x0) * 180) / Math.PI;
  return {
    d: `M${r(x0)} ${r(y0)} C${r(x1)} ${r(y1)} ${r(x2)} ${r(y2)} ${r(x3)} ${r(y3)}`,
    pad: { x: r(mx), y: r(my), angle: r(angle) },
  };
})();

/** The laptop screen's corners, clockwise from the far top corner. */
const SCREEN = "93.8,63.3 284.1,73 335.9,230.5 146.2,197.6";

/**
 * The screen faces the cat, so its text runs from the near edge (the right of the
 * drawing) towards the far edge. Code is laid out in a flat grid of 100 by 100
 * units, with u along a line from where it starts and v down the screen, and
 * this matrix lays that grid onto the screen.
 */
const SCREEN_GRID = "matrix(-1.9 -0.213 0.521 1.459 283.95 78.8)";

/** Line spacing, first line, margin before each line, indent and token gap, in grid units. */
const LINE_GAP = 9;
const FIRST_LINE = 8;
const MARGIN = 7;
const INDENT = 7;
const TOKEN_GAP = 3;

/** Lines that fit on the screen at once; the bottom one is being typed. */
const ROWS = 10;
/** Seconds per line: scroll up, then type the new bottom line. */
const STEP_S = 1.2;
/** Seconds the scroll takes at the start of each step. */
const SCROLL_S = 0.18;
/** Extra delay per grid unit already typed on the line. */
const PER_UNIT_S = 0.011;

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
 * itself and before the next scroll. At that moment the screen shows rows 0 to
 * ROWS - 1 at rest, exactly like the still drawing, so nothing shifts when the
 * animation starts.
 */
const OPEN_S = STEP_S - 0.2;

/**
 * The loop's timing, shared with the stylesheet through custom properties so the
 * scroll, the easing of each step and the typing always agree with LINES.
 */
export const SCREEN_LOOP = {
  rows: ROWS,
  lines: LINES.length,
  gap: LINE_GAP,
  stepS: STEP_S,
  scrollS: SCROLL_S,
  loopS: LOOP_S,
  openS: OPEN_S,
} as const;

const SCREEN_VARS = {
  "--loop": `${LOOP_S}s`,
  "--step": `${STEP_S}s`,
  "--steps": LINES.length,
  "--gap": LINE_GAP,
  "--shift": LINES.length * LINE_GAP,
  "--open": `${-OPEN_S}s`,
} as CSSProperties;

type Token = { key: string; u1: number; u2: number; v: number; accent: boolean; delay: string };

/**
 * Every token on the screen, laid out once. The program is drawn one and a bit
 * times so that, after scrolling a full program's height, the screen looks
 * exactly as it did at the start and the loop restarts without a jump. Row -1, a
 * copy of the last line just above the top edge, is the line that slides out at
 * the start of the loop, so the wrap scrolls like every other step. Each token
 * types itself when its line reaches the bottom of the screen; its delay is
 * negative so the loop opens on a full screen.
 */
const TOKENS: Token[] = (() => {
  const tokens: Token[] = [];
  const count = LINES.length;
  for (let row = -1; row < count + ROWS - 1; row += 1) {
    const { indent, tokens: lengths, accent } = LINES[(row + count) % count];
    // The step at which this row sits in the bottom slot and gets typed.
    const step = (((row - (ROWS - 1)) % count) + count) % count;
    let u = MARGIN + indent * INDENT;
    lengths.forEach((length, index) => {
      const offset = (u - MARGIN - indent * INDENT) * PER_UNIT_S;
      const start = step * STEP_S + SCROLL_S + offset;
      tokens.push({
        key: `${row}-${index}`,
        u1: u,
        u2: u + length,
        v: FIRST_LINE + row * LINE_GAP,
        accent: index === accent,
        delay: `${(start - LOOP_S - OPEN_S).toFixed(3)}s`,
      });
      u += length + TOKEN_GAP;
    });
  }
  return tokens;
})();

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
}: {
  down: string;
  up: string;
  /** Centres of the three toe beans on the raised paw. */
  toes: [number, number][];
  /** Centre of the main pad on the raised paw. */
  pad: [number, number];
  leadsWithUp: boolean;
}) {
  return (
    <g data-loop="paw">
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
 * eyes; too many pets in a row make it grumpy for a moment, which pauses the
 * whole scene until it calms down and carries on where it left off.
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

          {/* head and headphones */}
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
          <Screen />
          <polygon points="103.2,263.6 452.1,339 360.8,12.4 2,2" className={line} />

          {/* paw in front of the lid */}
          <Paw
            leadsWithUp
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

          {mood === "grumpy" ? (
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

/** One headphone cup with its yoke, tilted with the head. */
function CupShape({ cup, outward }: { cup: Cup; outward: 1 | -1 }) {
  const { x, y, rx, ry, turn } = cup;
  return (
    <g transform={`rotate(${turn} ${x} ${y})`}>
      {/* the yoke the band slides into */}
      <rect
        x={x - 7.5}
        y={y - ry - 11}
        width="15"
        height="17"
        rx="5"
        className={cx(strong, s.shade)}
      />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} className={cx(strong, s.dark)} />
      {/* the outer face, turned towards the outside of the head */}
      <ellipse
        cx={x + outward * rx * 0.3}
        cy={y}
        rx={rx * 0.58}
        ry={ry * 0.78}
        className={cx(line, s.shade)}
      />
      <ellipse
        cx={x + outward * rx * 0.5}
        cy={y - ry * 0.08}
        rx={rx * 0.16}
        ry={ry * 0.4}
        className={cx(thin, s.tint)}
      />
    </g>
  );
}

/**
 * Over-ear headphones: a cup over each ear and one band arching over the head,
 * its ends tucked into the yokes on top of the cups.
 */
function Headset() {
  const { pad } = BAND;
  return (
    <g>
      {[FAR_CUP, NEAR_CUP].map(({ x, y, rx, ry, turn }) => (
        <ellipse
          key={x}
          cx={x}
          cy={y}
          rx={rx}
          ry={ry}
          transform={`translate(6 5) rotate(${turn} ${x} ${y})`}
          className={s.tint}
        />
      ))}
      <path d={BAND.d} className={b.band} />
      <path d={BAND.d} className={b.bandFill} />
      <rect
        x={pad.x - 12}
        y={pad.y - 5}
        width="24"
        height="10"
        rx="5"
        transform={`rotate(${pad.angle} ${pad.x} ${pad.y})`}
        className={cx(strong, s.accent)}
      />
      <CupShape cup={FAR_CUP} outward={-1} />
      <CupShape cup={NEAR_CUP} outward={1} />
    </g>
  );
}

/**
 * Code on the laptop screen, scrolling like a terminal: each step the lines move
 * up by one, the top line slides out past the edge of the screen and the new
 * bottom line types itself from its start. The lines are clipped to the screen
 * and the whole loop is CSS, so it costs nothing per frame in script.
 */
function Screen() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const screenClip = `${id}-screen`;
  const rowsClip = `${id}-rows`;
  return (
    <g clipPath={`url(#${screenClip})`}>
      <defs>
        <clipPath id={screenClip}>
          <polygon points={SCREEN} />
        </clipPath>
        <clipPath id={rowsClip}>
          {/* exactly ROWS lines, in grid units */}
          <rect x="-6" y="1" width="112" height="93" />
        </clipPath>
      </defs>
      <g transform={SCREEN_GRID} clipPath={`url(#${rowsClip})`}>
        <g className={b.scroll} data-loop="screen" style={SCREEN_VARS}>
          <g className={b.scrollEase}>
            {TOKENS.map(({ key, u1, u2, v, accent, delay }) => (
              <line
                key={key}
                x1={u1}
                y1={v}
                x2={u2}
                y2={v}
                pathLength={1}
                className={cx(b.code, accent && b.codeAccent)}
                style={{ "--d": delay } as CSSProperties}
              />
            ))}
          </g>
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

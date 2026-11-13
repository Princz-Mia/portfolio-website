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
  [334, 92],
  [396, 46],
  [520, 36],
  [592, 66],
  [646, 120],
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
const LEFT_CUP =
  "M609.5,137.3c-17.1,6.3-20.7,51.4-4.5,67.3,1.4,1.5,5.5,5.5,11.3,5.9,8.2.5,14.5-6.3,16.9-8.9,10.1-11,11.5-27.5,8.1-40.1-1.4-4.8-3.9-14-12.7-19.9C627.4,140.8,617.7,134.3,609.5,137.3Z";

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

/** Code on the screen as [x1, y1, x2, y2] segments, in typing order. */
const CODE: [number, number, number, number][] = [
  [145.2, 83.5, 197.3, 87.5],
  [212.2, 88.7, 260.2, 92.3],
  [154.4, 95.6, 209.4, 100.5],
  [223.4, 101.8, 251, 104.2],
  [142.9, 105.3, 169.1, 108.2],
  [183.5, 109.8, 215.9, 113.4],
  [227.5, 114.7, 256.4, 117.9],
  [149.1, 117.5, 185.6, 121.9],
  [197.3, 123.3, 234.4, 127.8],
  [249.4, 129.6, 275.4, 132.8],
  [155.1, 131.1, 169.3, 132.9],
  [180.4, 134.3, 203.4, 137.2],
  [214.9, 138.7, 235.5, 141.3],
  [244.5, 142.5, 261, 144.6],
  [191.7, 147.7, 208.2, 150.1],
  [221.9, 152.1, 264.7, 158.3],
  [152.9, 153.2, 173.8, 156.4],
  [185, 158.1, 217.3, 163],
  [226.5, 164.4, 257.8, 169.2],
  [268.8, 170.9, 291.3, 174.3],
  [196.7, 172.5, 216.5, 175.8],
  [230.3, 177.7, 243.8, 179.9],
  [257.3, 182.2, 278.5, 185.6],
  [180.8, 182.3, 202.7, 186],
  [213.8, 187.9, 251.1, 194.2],
  [262.1, 196.1, 280.5, 199.2],
];
/** Segments drawn in the accent colour, like highlighted keywords. */
const ACCENT_CODE = new Set([2, 9, 17, 24]);

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
    <g>
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
 * types itself and notes drift up. Petting its head closes its eyes; too many
 * pets in a row make it grumpy for a moment.
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

          {/* head, with the far headphone cup */}
          <g className={cx(b.shakes, shake)}>
            <path d={HEAD} className={s.tint} transform="translate(7 6)" />
            <path d={HEAD} className={cx(line, s.fur)} />
            <path d="M601 139 Q615 129 626 125 Q627 135 624 146 Z" className={s.tint} />
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

            <path
              d="M527,43.6c-15.9-4.6-57-14.1-104,2.3a166.9,166.9,0,0,0-60.9,37.3"
              className={b.band}
            />
            <path
              d="M527,43.6c-15.9-4.6-57-14.1-104,2.3a166.9,166.9,0,0,0-60.9,37.3"
              className={b.bandFill}
            />
            <path
              d="M400.7,80.2c-14.1-20.8-40.2.3-50.7,15-8.7,12.2-9.7,30.3,2.8,37.3,5.4-9,11.8-15.6,21-26.2A214.1,214.1,0,0,1,400.7,80.2Z"
              className={cx(strong, s.dark)}
            />
            <path
              d="M381.5,79.4c-6.6-7.5-9.6-5.8-12.3-5.5-16.3,1.3-32,20.3-27.8,33.9a21.8,21.8,0,0,0,5.9,8.5c1.7-2.6,3.5-5.1,5.4-7.7A150.7,150.7,0,0,1,381.5,79.4Z"
              className={cx(line, s.shade)}
            />
            <path
              d="M367.3,77.8a13.1,13.1,0,0,0-5.1-1.8c-8.5-.9-18.7,7.5-18.4,16.1a12.8,12.8,0,0,0,2.6,7c3.1-3.3,6.3-6.8,9.6-10.2S363.6,81.3,367.3,77.8Z"
              className={cx(thin, s.tint)}
            />
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
          <polygon
            points="93.8,63.3 284.1,73 335.9,230.5 146.2,197.6"
            className={cx(line, s.shade)}
          />
          <g>
            {CODE.map(([x1, y1, x2, y2], index) => (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                pathLength={1}
                className={cx(b.code, ACCENT_CODE.has(index) && b.codeAccent)}
                style={{ "--i": index } as CSSProperties}
              />
            ))}
          </g>
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

          {/* near headphone cup and band */}
          <g className={cx(b.shakes, shake)}>
            <path
              d="M638.9,157.7c-4-16.8-25.9-61.9-75.3-95.3A155.5,155.5,0,0,0,515,40.6"
              className={b.band}
            />
            <path
              d="M638.9,157.7c-4-16.8-25.9-61.9-75.3-95.3A155.5,155.5,0,0,0,515,40.6"
              className={b.bandFill}
            />
            <rect
              x="512"
              y="34"
              width="20"
              height="14"
              rx="5"
              transform="rotate(10 522 41)"
              className={cx(strong, s.accent)}
            />
            <path d={LEFT_CUP} className={s.tint} transform="translate(6 5)" />
            <path d={LEFT_CUP} className={cx(strong, s.dark)} />
            <path
              d="M626.5,196.1c2.7-.4,5.9-2.6,9.3-6,6.6-6.6,6.8-16.6,5.8-24s-4.2-16.1-11.3-19.7a18.7,18.7,0,0,0-10.9-1.9C614,149.3,615.3,192.6,626.5,196.1Z"
              className={cx(line, s.shade)}
            />
            <path
              d="M631.6,151c-4.5,3.3-.5,27.1,3.8,28.2s6.9-6.6,6.2-13.1S637.4,153.5,631.6,151Z"
              className={cx(thin, s.tint)}
            />
          </g>

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

          <Sparkle x={742} y={58} size={11} wait={0} />
          <Sparkle x={262} y={-28} size={8} wait={0.9} tone="ink" />
          <Sparkle x={780} y={212} size={8} wait={1.7} tone="ink" />
          <Sparkle x={56} y={292} size={10} wait={1.2} />
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

/**
 * The notes for one headphone cup: one still note that shows when nothing moves,
 * and a few that rise and fade in a staggered loop once the drawing is in view.
 */
function Notes({ side }: { side: "far" | "near" }) {
  const live = side === "far" ? NOTES.slice(0, 3) : NOTES.slice(3);
  return (
    <g>
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

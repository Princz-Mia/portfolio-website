import type { CSSProperties } from "react";
import desk from "@/components/work/DeskScene.module.css";
import { Sparkle, delay, origin, s } from "./parts";

type Token = { x: number; w: number; accent?: boolean };
type Box = { x: number; y: number; w: number; h: number };

/** The drawing's coordinate box. */
export const ART_VIEWBOX = { x: -40, y: 0, w: 520, h: 400 };

/** The laptop's display inside the drawing, in drawing units. */
export const ART_SCREEN = { x: 124, y: 92, w: 236, h: 144, rx: 6 };

/**
 * Where the bonsai stands and how much it is scaled: on the desk in front of
 * the laptop's left corner. The tree is drawn in its own 70 x 84 box (its pot's
 * feet end at y 83) and scaled into place. On wide screens the drawing's
 * left-most strip sits under the section's text column, so the tree is kept to
 * the right of it (about 14% of the drawing's width), and it stays left of the
 * laptop's screen.
 */
const BONSAI_AT = { x: 35, y: 184 };
const BONSAI_K = 1.35;

/** The bonsai's extent, from the tip of its lowest pad to its pot's feet, in drawing units. */
export const BONSAI_BOX: Box = {
  x: BONSAI_AT.x + 0.5 * BONSAI_K,
  y: BONSAI_AT.y + 2 * BONSAI_K,
  w: 64.5 * BONSAI_K,
  h: 81 * BONSAI_K,
};

/** The coffee mug and its handle, in drawing units. */
export const MUG_BOX: Box = { x: 376, y: 219, w: 57, h: 73 };

/**
 * The sticky note on the laptop's lid, in drawing units, before its rotation of
 * `rotate` degrees about its centre. Rotated, it still ends above the screen.
 */
export const NOTE_BOX = { x: 337, y: 52, w: 40, h: 36, rotate: 7 };

/** The bonsai's leaves: a soft muted sage, the drawing's one green. */
const SAGE = "var(--art-sage)";
const MOSS = "var(--art-moss)";

/** A line width given in drawing units, for a line drawn in the bonsai's scaled units. */
const bw = (width: number): CSSProperties => ({ strokeWidth: width / BONSAI_K });

/** The soil's surface across the pot, in the tree's units. */
const soilY = (x: number) => 68.5 - 2.7 * (1 - ((x - 35) / 24) ** 2);

/** A row of small moss tufts along the soil, from x 11 to 59. */
const MOSS_PATH = (() => {
  let d = `M11 ${soilY(11).toFixed(2)}`;
  for (let x = 11; x < 59; x += 4) {
    d += ` Q${x + 2} ${(soilY(x + 2) - 1.8).toFixed(2)} ${x + 4} ${soilY(x + 4).toFixed(2)}`;
  }
  return `${d} L59 69 H11 Z`;
})();

/**
 * Foliage pads, each a cloud: flat underneath, scalloped on top, smaller
 * towards the apex, with sky left between them.
 */
const PADS = {
  /** Behind the trunk, half hidden. */
  back: "M36 31 C34.5 31 34.5 28.8 36.2 28.6 C36.8 26.6 39.6 26.2 40.6 27.8 C41.8 26.6 44.5 27.4 44.2 29.4 C45.5 29.8 45.4 31 44 31 Z",
  lowLeft:
    "M3 48 C0.5 48 0.5 44.5 3 44 C3 40.5 7 39 9.5 40.8 C11 37.5 16 37 18 40 C20.5 38 25 39 25.5 42.2 C28.5 42.5 29 48 26 48 Z",
  right:
    "M43.5 38 C41 38 41 34.5 43.5 34.2 C44 31 48 30 50 31.8 C51.5 28.6 56 28.4 57.5 31.2 C60 30 63 31.2 62.8 34 C65 34.5 64.8 38 62.5 38 Z",
  upLeft:
    "M14 26.5 C11.8 26.5 11.8 23.4 14 23.2 C14.5 20.4 18 19.6 19.8 21.2 C21 18.8 25 18.6 26.2 21.2 C28.4 21 30 23 29 24.6 C30.2 25.6 29.6 26.5 28 26.5 Z",
  apex: "M26.5 14 C23.5 14 23.5 9.5 26.8 9.3 C26.5 5.5 30.5 3.5 33 5.2 C34.5 2 39.5 2 40.5 5.6 C43.5 4.8 46 8 44 10.4 C46.5 11.2 46 14 43.5 14 Z",
};

/** The trunk: an S-curve tapering from 8 wide at the soil to 2 at the apex. */
const TRUNK =
  "M31 66 C27.5 60 23.5 55 24.5 51 C25.5 46 35 43 35.5 38 C36 33 28.5 30 29.5 25 C30 20 33.5 15 34.2 10 L35.8 10 C36 15 34 20 34 25 C34 29 41.5 33 42 38 C42.5 44 32 47 31.5 52 C31 57 36 61 39 66 Z";
/** Branches from the outside of each bend, ending under their pads. */
const BRANCHES =
  "M25.6 50.2 C21.5 50 16.5 49.2 12.5 46.8 M41.6 40.2 C45 39.6 48.5 38.6 51.5 36.6 M30.4 27.6 C27.5 27.4 24.5 26.8 21.5 25.2";
const POT_LIP =
  "M9.4 68.4 H60.6 C61.4 68.4 62 69 62 69.8 V70.4 C62 71.2 61.4 71.8 60.6 71.8 H9.4 C8.6 71.8 8 71.2 8 70.4 V69.8 C8 69 8.6 68.4 9.4 68.4 Z";
const POT_BODY = "M10 71.8 H60 L57.6 80 H12.4 Z";

/**
 * A bonsai in a shallow pot, in its own units (70 x 84, y down): an informal
 * upright trunk twisting up in an S over its root flare, branches from the
 * outside of each bend under cloud-like foliage pads, a mossy soil line, and a
 * rectangular pot with a lip, two small feet and a little oxblood seal. The
 * tree sways gently about its base; the pot stays put.
 */
function Bonsai() {
  const pads = [PADS.lowLeft, PADS.right, PADS.upLeft, PADS.apex];
  return (
    <g>
      {/* print shadow of the pot */}
      <g transform="translate(3 2.4)" className={s.tint}>
        <path d={POT_LIP} />
        <path d={POT_BODY} />
      </g>

      {/* pot: feet, body with a band and a seal, then soil, moss and the lip */}
      <rect x="14.5" y="79" width="6" height="4" rx="1" className={`${s.line} ${s.shade}`} style={bw(1.7)} />
      <rect x="49.5" y="79" width="6" height="4" rx="1" className={`${s.line} ${s.shade}`} style={bw(1.7)} />
      <path d={POT_BODY} className={`${s.line} ${s.shade}`} style={bw(1.7)} />
      <path d="M11.2 75 H58.8" className={`${s.line} ${s.thin}`} style={bw(1.1)} />
      <rect x="33.2" y="75.9" width="3.6" height="2.8" rx="0.5" className={s.accent} />
      <path
        d={`M11 69 C18 ${soilY(18).toFixed(2)} 26 65.8 35 65.8 C44 65.8 52 ${soilY(52).toFixed(2)} 59 69 Z`}
        className={s.dark}
      />
      <path d={MOSS_PATH} style={{ fill: MOSS }} />
      <path d={POT_LIP} className={`${s.line} ${s.paper}`} style={bw(1.7)} />

      {/* the tree, swaying from its base */}
      <g className={s.sway} style={origin("50% 100%")}>
        <path d={PADS.back} className={s.tint} transform="translate(1.6 1.3)" />
        <path d={PADS.back} className={s.line} style={{ ...bw(1.7), fill: SAGE }} />

        {/* surface roots splaying from the base */}
        <path
          d="M31.5 65.6 C29.5 66.3 27 66.9 23.8 67.2 M38.5 65.6 C40.5 66.3 43 66.8 46.2 67.1 M33 66 C32.3 66.9 31.5 67.5 30.2 67.9 M37 66 C37.8 66.9 38.6 67.4 39.8 67.8"
          className={s.line}
          style={bw(1.7)}
        />

        {/* branches from the outside of each bend to the pads above: wood
            like the trunk, an outlined stroke with a pale core */}
        <path d={BRANCHES} fill="none" stroke="var(--art-ink)" strokeLinecap="round" style={bw(4.6)} />
        <path d={BRANCHES} fill="none" stroke="var(--art-fur)" strokeLinecap="round" style={bw(1.2)} />

        {/* trunk, with bark lines and a knot on the outside of the lowest bend */}
        <path d={TRUNK} className={s.tint} transform="translate(1.6 1)" />
        <path d={TRUNK} className={`${s.line} ${s.fur}`} style={bw(1.7)} />
        <path
          d="M29.6 60 C28.8 57.5 28.4 55.6 28.8 53.6 M36.6 41 C37.6 39.2 37.4 36.6 36.2 34.6"
          className={`${s.line} ${s.thin}`}
          style={bw(1.1)}
        />
        <ellipse cx="26.6" cy="51.4" rx="0.9" ry="1.4" className={s.line} style={bw(1.1)} />

        {/* foliage pads in front */}
        <g transform="translate(1.6 1.3)" className={s.tint}>
          {pads.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {pads.map((d) => (
          <path key={d} d={d} className={s.line} style={{ ...bw(1.7), fill: SAGE }} />
        ))}
        <path
          d="M8 44.6 C9.6 43.4 11.4 43.6 12.6 44.8 M17.6 42.4 C19.2 41.4 21 41.6 22 42.8 M48.4 34.6 C49.8 33.6 51.6 33.8 52.6 34.8 M18.2 23.6 C19.4 22.8 20.8 23 21.6 23.8 M31.6 8.8 C33 7.8 34.8 8 35.8 9.2 M38.2 10.6 C39.4 9.8 40.8 10 41.6 11"
          className={`${s.line} ${s.thin}`}
          style={bw(1.1)}
        />
      </g>
    </g>
  );
}

/** Steam puffs over the mug, shown in a burst when it is touched. */
function Puffs() {
  const puffs: [number, number, number][] = [
    // x, y, delay
    [386, 217, 0],
    [400, 214, 0.06],
    [414, 217, 0.12],
    [392, 205, 0.18],
    [409, 203, 0.1],
  ];
  return (
    <g className={desk.puffs}>
      {puffs.map(([x, y, wait]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(1.6)`}>
          <path
            d="M-5 2 C-7.5 2 -7.5 -2.5 -4.5 -2.5 C-4 -6 2 -6.5 3 -3 C6.5 -3.5 7 2 4 2 Z"
            className={`${s.line} ${s.paper} ${desk.puff}`}
            style={{ ...delay(wait), strokeWidth: 1.1 }}
          />
        </g>
      ))}
    </g>
  );
}

/** A desk: a laptop writing code, a mug of Java and a bonsai in a shallow pot. */
export function WorkArt({ className }: { className?: string }) {
  const rows: Token[][] = [
    [
      { x: 142, w: 34, accent: true },
      { x: 184, w: 58 },
    ],
    [
      { x: 158, w: 46 },
      { x: 212, w: 30, accent: true },
      { x: 250, w: 40 },
    ],
    [
      { x: 174, w: 70 },
      { x: 252, w: 24 },
    ],
    [
      { x: 174, w: 38, accent: true },
      { x: 220, w: 62 },
    ],
    [{ x: 158, w: 22 }],
    [
      { x: 158, w: 52 },
      { x: 218, w: 36, accent: true },
    ],
    [{ x: 142, w: 18 }],
  ];
  const noteCx = NOTE_BOX.x + NOTE_BOX.w / 2;
  const noteCy = NOTE_BOX.y + NOTE_BOX.h / 2;

  return (
    <svg
      className={`${s.figure} ${className ?? ""}`}
      viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
      width={ART_VIEWBOX.w}
      height={ART_VIEWBOX.h}
      aria-hidden="true"
      focusable="false"
    >

      {/* backdrop */}
      <ellipse cx="250" cy="206" rx="206" ry="150" className={s.blob} />
      <circle cx="408" cy="96" r="42" className={s.blobShade} />
      <ellipse cx="240" cy="296" rx="210" ry="9" className={s.shade} />

      {/* laptop screen */}
      <rect
        x="110"
        y="78"
        width="264"
        height="172"
        rx="12"
        className={s.tint}
        transform="translate(8 7)"
      />
      <rect
        x="110"
        y="78"
        width="264"
        height="172"
        rx="12"
        className={`${s.line} ${s.paper}`}
      />
      <rect
        x={ART_SCREEN.x}
        y={ART_SCREEN.y}
        width={ART_SCREEN.w}
        height={ART_SCREEN.h}
        rx={ART_SCREEN.rx}
        className={`${s.line} ${s.shade}`}
      />
      <circle cx="138" cy="104" r="3" className={s.accent} />
      <circle cx="149" cy="104" r="3" className={s.inkFill} opacity="0.5" />
      <circle cx="160" cy="104" r="3" className={s.inkFill} opacity="0.5" />

      {/* code being written, line by line */}
      {rows.map((row, r) =>
        row.map((token, t) => (
          <g key={`${r}-${t}`} style={delay(0.25 + r * 0.16 + t * 0.06)}>
            <path
              d={`M${token.x} ${124 + r * 15} H${token.x + token.w}`}
              pathLength={1}
              strokeWidth={4.5}
              strokeLinecap="round"
              fill="none"
              stroke={token.accent ? "var(--art-accent)" : "var(--art-ink)"}
              opacity={token.accent ? 0.85 : 0.45}
              className={s.draw}
            />
          </g>
        )),
      )}
      <rect
        x="166"
        y="213"
        width="9"
        height="13"
        rx="1.5"
        className={`${s.accent} ${s.cursor}`}
      />

      {/* sticky note, with a hand-written line or two */}
      <g className={desk.note}>
        <g transform={`rotate(${NOTE_BOX.rotate} ${noteCx} ${noteCy})`}>
          <rect
            x={NOTE_BOX.x}
            y={NOTE_BOX.y}
            width={NOTE_BOX.w}
            height={NOTE_BOX.h}
            rx="2"
            className={s.shade}
            transform="translate(3 3)"
          />
          <rect
            x={NOTE_BOX.x}
            y={NOTE_BOX.y}
            width={NOTE_BOX.w}
            height={NOTE_BOX.h}
            rx="2"
            className={`${s.line} ${s.tint}`}
          />
          <path
            d={`M${NOTE_BOX.x + 6} ${NOTE_BOX.y + 11} c4 -3 7 2 11 -1 s7 2 11 -1 M${NOTE_BOX.x + 6} ${NOTE_BOX.y + 20} c4 -3 7 2 11 -1 s5 1 8 0`}
            className={`${s.line} ${s.thin}`}
          />
          <path
            d={`M${NOTE_BOX.x + 30} ${NOTE_BOX.y + 29} c-1.6 -1.8 -4.2 -0.4 -2.6 1.6 l2.6 2.6 l2.6 -2.6 c1.6 -2 -1 -3.4 -2.6 -1.6 Z`}
            className={s.accent}
          />
        </g>
      </g>

      {/* laptop base */}
      <path
        d="M88 252 H396 L414 276 C416 284 412 290 404 290 H80 C72 290 68 284 70 276 Z"
        className={`${s.line} ${s.paper}`}
      />
      <path
        d="M214 252 H270 C270 258 266 261 260 261 H224 C218 261 214 258 214 252 Z"
        className={s.shade}
      />

      {/* a bonsai in front of the laptop's corner */}
      <g data-part="bonsai" transform={`translate(${BONSAI_AT.x} ${BONSAI_AT.y}) scale(${BONSAI_K})`}>
        <Bonsai />
      </g>

      {/* mug, with a little steaming-cup Java logo on its front; the outer
          group lifts it with its steam on hover, the inner one wobbles */}
      <g className={desk.mugLift}>
        <g className={desk.mug}>
          <path
            d="M378 222 H420 V272 C420 283 413 290 402 290 H396 C385 290 378 283 378 272 Z"
            className={s.tint}
            transform="translate(5 4)"
          />
          <path
            d="M418 236 C434 236 434 266 418 266"
            className={`${s.line} ${s.bold}`}
          />
          <path
            d="M378 222 H420 V272 C420 283 413 290 402 290 H396 C385 290 378 283 378 272 Z"
            className={`${s.line} ${s.paper}`}
          />
          <path d="M378 228.5 H420" className={`${s.accentLine} ${s.thin}`} />
          <path
            d="M394 250 C390.5 246 397 243 393.5 237.5 M399.5 249.5 C396 244.5 403.5 241 399.5 234 M405 250 C401.5 246 408 243 404.5 238"
            className={s.accentLine}
            style={{ strokeWidth: 2.1 }}
          />
          <path
            d="M409.5 255.5 C414.5 255.5 414.5 262.5 408.5 263.2"
            className={s.line}
          />
          <path
            d="M388.5 253 H409.5 V257.5 C409.5 264 405 268.5 399 268.5 C393 268.5 388.5 264 388.5 257.5 Z"
            className={`${s.line} ${s.tint}`}
          />
          <circle cx="395.6" cy="259" r="1.05" className={s.inkFill} />
          <circle cx="402.4" cy="259" r="1.05" className={s.inkFill} />
          <path d="M397.6 262 Q399 263.4 400.4 262" className={`${s.line} ${s.thin}`} />
          <path d="M386 270.6 C391.5 273.2 406.5 273.2 412 270.6" className={s.line} />
        </g>
        <path
          d="M390 212 C382 200 398 192 390 178"
          className={`${s.line} ${s.steam}`}
          style={delay(0)}
        />
        <path
          d="M406 210 C398 198 414 190 406 172"
          className={`${s.line} ${s.steam}`}
          style={delay(1.2)}
        />
        <Puffs />
      </g>

      <Sparkle x={448} y={186} size={6} wait={0.4} />
      <Sparkle x={92} y={74} size={7} wait={1.3} tone="ink" />
    </svg>
  );
}

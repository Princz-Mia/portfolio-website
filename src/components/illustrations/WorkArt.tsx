import type { ReactNode } from "react";
import egg from "@/components/work/LichKingEgg.module.css";
import { Sparkle, delay, s } from "./parts";

type Token = { x: number; w: number; accent?: boolean };

/** The drawing's coordinate box. */
export const ART_VIEWBOX = { x: -40, y: 0, w: 520, h: 400 };

/** The laptop's display inside the drawing, in drawing units. */
export const ART_SCREEN = { x: 124, y: 92, w: 236, h: 144, rx: 6 };

/**
 * Where the Lich King figure stands in the drawing, in drawing units: on the
 * desk just in front of the laptop's left corner. On wide screens the drawing's
 * left-most strip sits under the section's text column, so the figure is kept
 * to the right of it (x >= 36, about 14% of the drawing's width) where a click
 * can reach it.
 */
const LICH_AT = { x: 40, y: 183 };

/**
 * The Lich King figure's box in drawing units, for the poke target laid over
 * it. It covers the helm's prongs, the base and both sword poses.
 */
export const LICH_BOX = { x: LICH_AT.x, y: LICH_AT.y - 2, w: 82, h: 120 };

/** Ice blue, used only while the figure is awake. */
const ICE = "#bfe6f2";
const ICE_LINE = "#7fc8de";

/** Draws its children and their mirror image across the figure's centre line. */
function Pair({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform="matrix(-1 0 0 1 70 0)">{children}</g>
    </>
  );
}

/** A tiny skull: a rounded cranium over a short jaw, centred on (x, y). */
function Skull({ x, y, k = 1 }: { x: number; y: number; k?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path
        d="M-4.5 -0.5 C-4.5 -4 -2.4 -5.5 0 -5.5 C2.4 -5.5 4.5 -4 4.5 -0.5 C4.5 1.5 3.6 2.7 2.6 3.2 V5 H-2.6 V3.2 C-3.6 2.7 -4.5 1.5 -4.5 -0.5 Z"
        className={`${s.line} ${s.fur}`}
        style={{ strokeWidth: (k < 1 ? 1.1 : 1.7) / k }}
      />
      <circle cx="-1.7" cy="-0.5" r="1.15" className={s.dark} />
      <circle cx="1.7" cy="-0.5" r="1.15" className={s.dark} />
    </g>
  );
}

/** A domed shoulder guard with a skull on it, on the figure's right-hand side. */
function Pauldron() {
  return (
    <g>
      <path
        d="M6 81 C6 74.5 9.8 70.5 14.5 70.5 C19.2 70.5 23 74.5 23 81 Z"
        className={`${s.line} ${s.dark}`}
      />
      <Skull x={14.5} y={76} k={0.62} />
    </g>
  );
}

/** Frostmourne upright, its guard centred on (0, 0): a broad runed blade above a skull guard. */
function Frostmourne() {
  return (
    <g>
      <path
        d="M-3.8 -3.5 H3.8 V-7 L4.7 -9 L3.8 -11 V-14 L4.7 -16 L3.8 -18 L0 -27 L-3.8 -18 L-4.7 -16 L-3.8 -14 V-11 L-4.7 -9 L-3.8 -7 Z"
        className={`${s.line} ${s.paper}`}
      />
      <path d="M-1.2 -8 h2.4 M-1.2 -12.5 h2.4 M-1.2 -17 h2.4" className={s.accentLine} style={{ strokeWidth: 1.3 }} />
      <rect x="-1.3" y="0" width="2.6" height="12" className={`${s.line} ${s.dark}`} />
      <path d="M0 17 L1.8 12 H-1.8 Z" className={`${s.line} ${s.dark}`} />
      <path
        d="M0 1 C-3.5 0.5 -7.5 2.5 -10 5.5 C-9.5 1.5 -7.5 -2 -4.2 -3.5 H4.2 C7.5 -2 9.5 1.5 10 5.5 C7.5 2.5 3.5 0.5 0 1 Z"
        className={`${s.line} ${s.dark}`}
      />
      <circle cx="0" cy="-1.3" r="2" className={s.paper} />
      <circle cx="-0.75" cy="-1.5" r="0.55" className={s.dark} />
      <circle cx="0.75" cy="-1.5" r="0.55" className={s.dark} />
    </g>
  );
}

/**
 * A big-headed vinyl Lich King on a display base, in a box about 80 x 118: the
 * Helm of Domination as the head (a dark dome flaring into cheek guards, a ring
 * of spikes, a small skull with two curved prongs, a teardrop gem, big round
 * eyes and a ribbed jaw guard), a short armoured body with skull roundels and
 * skull pauldrons, a cape with a fur hem, and Frostmourne planted at its side.
 *
 * A second pose, with Frostmourne raised to the sky, plus glowing ice-blue eyes
 * and rising frost, is drawn hidden; LichKingEgg reveals it when the figure is
 * poked awake.
 */
function LichKing() {
  const helm =
    "M8 35 C8 22 18 15 35 15 C52 15 62 22 62 35 V54 C62 60 64 65 68 69 L63.5 68.2 L61 72 L57.5 67.8 L54 70.6 Q35 75 16 70.6 L12.5 67.8 L9 72 L6.5 68.2 L2 69 C6 65 8 60 8 54 Z";
  const body = "M17.5 67 H52.5 L51.5 98 H18.5 Z";
  const base = "M0 106 C0 104.9 0.9 104 2 104 H72 C73.1 104 74 104.9 74 106 V115 C74 116.1 73.1 117 72 117 H2 C0.9 117 0 116.1 0 115 Z";
  const spikes: [number, number, number, number, number][] = [
    // base x, base y, tip x, tip y, half width (left side; mirrored)
    [13, 26, 4.5, 4.5, 4.2],
    [21, 19, 16, 6.5, 3.5],
    [27.5, 17, 26.5, 11, 2.4],
  ];
  const eyes = [23.5, 46.5];
  const frost: [number, number, number][] = [
    // x, y, delay
    [-3, 64, 0],
    [6, 30, 0.5],
    [70, 46, 0.25],
    [64, 20, 0.8],
    [18, -2, 1.1],
    [52, 2, 0.4],
    [-6, 88, 0.95],
    [78, 72, 0.65],
  ];

  return (
    <g className={egg.figure}>
      {/* a frosty aura, shown while awake */}
      <g className={egg.aura}>
        <ellipse cx="38" cy="50" rx="40" ry="46" fill={ICE} filter="url(#lich-frost-blur)" />
      </g>

      {/* print shadow */}
      <g transform="translate(6 5)" className={s.tint}>
        <path d={helm} />
        <path d={body} />
        <path d={base} />
      </g>

      {/* display base */}
      <path d={base} className={`${s.line} ${s.shade}`} />
      <path d="M1 109 H73" className={`${s.line} ${s.thin}`} />

      {/* cape behind, with its fur hem */}
      <path
        d="M13 70 C11 82 10.5 93 11.5 101 H58.5 C59.5 93 59 82 57 70 Z"
        className={`${s.line} ${s.shade}`}
      />
      <path
        d="M11 100 C17 98 22 101 28 99 C34 101 38 98 44 100 C50 98 54 101 59 99 L59 103 C54 106 50 103 44 105 C38 103 34 106 28 104 C22 106 17 103 11 105 Z"
        className={`${s.line} ${s.fur}`}
      />

      {/* stubby legs and the armoured body */}
      <path d="M20 96 H33 V104.5 H20 Z M37 96 H50 V104.5 H37 Z" className={`${s.line} ${s.dark}`} />
      <path d={body} className={`${s.line} ${s.dark}`} />
      <path d="M35 71 V86" className={`${s.line} ${s.thin}`} />
      <path d="M18.5 87.5 H51.5" className={`${s.line} ${s.thin}`} />
      <path d="M31 89 H39 V98.5 L35 100.5 L31 98.5 Z" className={`${s.line} ${s.tint}`} />
      <rect x="33" y="86" width="4" height="3" rx="0.8" className={s.accent} />
      <Pair>
        <circle cx="28.5" cy="79.5" r="3.1" className={`${s.line} ${s.paper}`} />
        <circle cx="27.4" cy="79.2" r="0.75" className={s.dark} />
        <circle cx="29.6" cy="79.2" r="0.75" className={s.dark} />
      </Pair>

      {/* left arm, gauntleted fist at the side */}
      <path
        d="M9 79 C8.5 83 8.7 86.5 9.5 89 H18 C18.8 86 19 82.5 18.5 79 Z"
        className={`${s.line} ${s.dark}`}
      />
      <rect x="8.4" y="84" width="10.6" height="3.6" rx="1.2" className={`${s.line} ${s.tint}`} />
      <circle cx="13.7" cy="91.2" r="3.6" className={`${s.line} ${s.tint}`} />

      {/* resting: Frostmourne planted point down, a hand on the hilt; the arm
          runs under the pauldron and shows below it and beside the hair lock */}
      <g className={egg.rest}>
        <g transform="translate(71 84) scale(1 -1)">
          <Frostmourne />
        </g>
        {/* the arm drops below the skull pauldron, then bends up to the hilt */}
        <path
          d="M51 80.5 H60 C62.5 80.5 64.5 79 67 76.5 L72.5 80.5 C70 84.5 66.5 88.5 62 88.5 H51.5 Z"
          className={`${s.line} ${s.dark}`}
        />
        <circle cx="71" cy="76.5" r="3.5" className={`${s.line} ${s.tint}`} />
      </g>

      {/* awake: Frostmourne raised to the sky */}
      <g className={egg.raise}>
        <g transform="rotate(8 73 50)">
          <g transform="translate(73 45)">
            <Frostmourne />
          </g>
          <path d="M73 12 L74 14.5 L76.5 15.5 L74 16.5 L73 19 L72 16.5 L69.5 15.5 L72 14.5 Z" fill={ICE} />
        </g>
        <path
          d="M56 77 C66 77 72.5 70 73 53"
          fill="none"
          stroke="var(--art-ink)"
          strokeWidth="9.4"
          strokeLinecap="round"
        />
        <path
          d="M56 77 C66 77 72.5 70 73 53"
          fill="none"
          stroke="var(--art-dark)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="73" cy="50.5" r="3.7" className={`${s.line} ${s.tint}`} />
      </g>

      {/* skull pauldrons */}
      <Pair>
        <Pauldron />
      </Pair>

      {/* pale hair under the cheek guards */}
      <Pair>
        <path
          d="M4.5 67 C2 71 2.3 76 5 79.5 C7 75.5 8 71 7.5 67 Z"
          className={`${s.line} ${s.fur}`}
        />
      </Pair>

      {/* helm of domination: spikes and prongs behind the dome */}
      <Pair>
        {spikes.map(([bx, by, tx, ty, hw]) => (
          <path
            key={bx}
            d={`M${bx - hw} ${by + 3} L${tx} ${ty} L${bx + hw} ${by + 3} Z`}
            className={`${s.line} ${s.dark}`}
          />
        ))}
        <path
          d="M32.4 13 C29.4 10 27.8 5 28.6 -0.5 C30.4 4.5 32.6 8 35 11.5 Z"
          className={`${s.line} ${s.dark}`}
        />
      </Pair>
      <path d={helm} className={`${s.line} ${s.dark}`} />
      <path d="M14.5 27.5 C17.5 21.5 23 18.8 28.5 18.3" className={`${s.paperLine} ${s.thin}`} />
      <Skull x={35} y={16.5} />

      {/* the face: gem, brows, nose ridge, cheek seams and a ribbed jaw guard */}
      <path
        d="M35 25 C36.8 27.8 38 29.8 38 31.4 C38 33.1 36.7 34.2 35 34.2 C33.3 34.2 32 33.1 32 31.4 C32 29.8 33.2 27.8 35 25 Z"
        className={`${s.line} ${s.paper}`}
      />
      <Pair>
        <path d="M16.5 34 Q23 31 30 34.5" className={s.line} />
        <path d="M14.5 46 C12.8 53 12.8 61 14 67.2" className={`${s.line} ${s.thin}`} />
      </Pair>
      <path d="M33.6 38 L35 46.5 L36.4 38" className={`${s.line} ${s.thin}`} />
      <path
        d="M17 51 Q35 56.5 53 51 M17 56 Q35 62 53 56 M17.5 61.2 Q35 67.5 52.5 61.2"
        className={`${s.line} ${s.thin}`}
      />
      {eyes.map((x, i) => (
        <g key={x}>
          <g opacity="0.35">
            <circle cx={x} cy="41.5" r="8" className={`${s.paper} ${s.pulse}`} style={delay(i * 0.2)} />
          </g>
          <circle cx={x} cy="41.5" r="5.6" className={s.fur} />
          <circle cx={x - 1.8} cy="39.7" r="1.5" className={s.paper} />
        </g>
      ))}

      {/* awake: the eyes and gem burn ice blue */}
      <g className={egg.glow}>
        {eyes.map((x) => (
          <g key={x}>
            <circle cx={x} cy="41.5" r="9.5" fill={ICE} filter="url(#lich-frost-blur)" />
            <circle cx={x} cy="41.5" r="5.6" fill={ICE} stroke={ICE_LINE} strokeWidth="1.4" />
            <circle cx={x - 1.8} cy="39.7" r="1.5" fill="#ffffff" />
          </g>
        ))}
        <path
          d="M35 25 C36.8 27.8 38 29.8 38 31.4 C38 33.1 36.7 34.2 35 34.2 C33.3 34.2 32 33.1 32 31.4 C32 29.8 33.2 27.8 35 25 Z"
          fill={ICE}
          stroke={ICE_LINE}
          strokeWidth="1.2"
        />
      </g>

      {/* awake: frost rising around the figure */}
      <g className={egg.frost}>
        {frost.map(([x, y, wait]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y - 3} L${x + 0.9} ${y - 0.9} L${x + 3} ${y} L${x + 0.9} ${y + 0.9} L${x} ${y + 3} L${x - 0.9} ${y + 0.9} L${x - 3} ${y} L${x - 0.9} ${y - 0.9} Z`}
            fill={ICE}
            stroke={ICE_LINE}
            strokeWidth="0.7"
            style={delay(wait)}
          />
        ))}
      </g>
    </g>
  );
}

/** A desk: a laptop writing code, a mug of Java, a Lich King figure. */
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

  return (
    <svg
      className={`${s.figure} ${className ?? ""}`}
      viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
      width={ART_VIEWBOX.w}
      height={ART_VIEWBOX.h}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="lich-frost-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

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

      {/* sticky note */}
      <g transform="rotate(7 356 74)">
        <rect
          x="338"
          y="58"
          width="38"
          height="34"
          rx="2"
          className={`${s.line} ${s.tint}`}
        />
        <path d="M345 70 H368 M345 78 H362" className={`${s.line} ${s.thin}`} />
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

      {/* Lich King vinyl figure, standing in front of the laptop's corner */}
      <g transform={`translate(${LICH_AT.x} ${LICH_AT.y})`}>
        <LichKing />
      </g>

      {/* mug, with a little steaming-cup Java logo on its front */}
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

      <Sparkle x={448} y={186} size={6} wait={0.4} />
      <Sparkle x={92} y={74} size={7} wait={1.3} tone="ink" />
    </svg>
  );
}

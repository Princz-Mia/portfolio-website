import { Sparkle, delay, s } from "./parts";

type Token = { x: number; w: number; accent?: boolean };

/** The drawing's coordinate box. */
export const ART_VIEWBOX = { x: -40, y: 0, w: 520, h: 400 };

/** The laptop's display inside the drawing, in drawing units. */
export const ART_SCREEN = { x: 124, y: 92, w: 236, h: 144, rx: 6 };

/** Pale ice for the figure's glowing eyes and gem, the one colour outside the palette. */
const ICE = "#dfeaec";

/**
 * A big-headed vinyl Lich King on a display base, in a 70 x 118 box: the Helm
 * of Domination with its crown of spikes, a dark armoured body with a pale fur
 * hem, and Frostmourne planted at its side. The eyes glow softly.
 */
function LichKing() {
  const helm =
    "M6 32 C6 21 14 15 26 15 H44 C56 15 64 21 64 32 V58 C64 62 65 66 68 70 L63 68 L60 72 L56 68 L52 71 H18 L14 68 L10 72 L7 68 L2 70 C5 66 6 62 6 58 Z";
  const body = "M15 64 H55 L53 98 H17 Z";
  const spikes: [number, number, number, number, number][] = [
    // base x, base y, tip x, tip y, half width
    [11, 28, 4, 7, 4.5],
    [20, 20, 17, 8, 3.5],
    [28, 17, 26, 10, 3],
    [42, 17, 44, 10, 3],
    [50, 20, 53, 8, 3.5],
    [59, 28, 66, 6, 4.5],
  ];
  const eyes = [24, 46];

  return (
    <g>
      {/* print shadow */}
      <g transform="translate(6 5)" className={s.tint}>
        <path d={helm} />
        <path d={body} />
        <rect x="4" y="104" width="62" height="13" rx="2" />
      </g>

      {/* display base */}
      <rect x="4" y="104" width="62" height="13" rx="2" className={`${s.line} ${s.shade}`} />
      <path d="M5 108 H65" className={`${s.line} ${s.thin}`} />

      {/* cape behind, with its fur hem */}
      <path
        d="M12 68 C10 80 10 92 11 101 H59 C60 92 60 80 58 68 Z"
        className={`${s.line} ${s.shade}`}
      />
      <path
        d="M11 100 C17 98 22 101 28 99 C34 101 38 98 44 100 C50 98 54 101 59 99 L59 103 C54 106 50 103 44 105 C38 103 34 106 28 104 C22 106 17 103 11 105 Z"
        className={`${s.line} ${s.fur}`}
      />

      {/* legs and body */}
      <path d="M20 96 H33 V105 H20 Z M37 96 H50 V105 H37 Z" className={`${s.line} ${s.dark}`} />
      <path d={body} className={`${s.line} ${s.dark}`} />
      <path d="M18 88 H52" className={`${s.line} ${s.thin}`} />
      <path d="M31 88 H39 V98 H31 Z" className={`${s.line} ${s.shade}`} />
      <rect x="33" y="86.5" width="4" height="3" rx="0.8" className={s.accent} />
      {[27, 43].map((x) => (
        <g key={x}>
          <circle cx={x} cy="77" r="3" className={`${s.line} ${s.paper}`} />
          <circle cx={x - 1.1} cy="76.6" r="0.75" className={s.dark} />
          <circle cx={x + 1.1} cy="76.6" r="0.75" className={s.dark} />
        </g>
      ))}

      {/* left arm, fist at the side */}
      <path
        d="M19 70 C14 70 11 74 11 80 V87 H18 Z"
        className={`${s.line} ${s.dark}`}
      />
      <circle cx="14.5" cy="89" r="3.6" className={`${s.line} ${s.tint}`} />

      {/* Frostmourne, planted point down */}
      <path
        d="M59.5 85.5 H66.5 V90 L67.5 92 L66.5 94 V99 L63 106 L59.5 99 V94 L58.5 92 L59.5 90 Z"
        className={`${s.line} ${s.paper}`}
      />
      <path d="M62 89.5 h2 M62 93.5 h2 M62 97.5 h2" className={`${s.accentLine} ${s.thin}`} />
      <path d="M63 66 L64.6 72 H61.4 Z" className={`${s.line} ${s.dark}`} />
      <rect x="61.8" y="72" width="2.4" height="8" className={`${s.line} ${s.dark}`} />
      <path
        d="M63 82 C59.5 82.5 56.5 80.5 53.5 78 C54.5 81.5 56 84 59.5 85.5 H66.5 C70 84 71.5 81.5 72.5 78 C69.5 80.5 66.5 82.5 63 82 Z"
        className={`${s.line} ${s.dark}`}
      />
      <circle cx="63" cy="83.6" r="1.5" className={s.paper} />

      {/* right arm, hand on the hilt */}
      <path
        d="M51 70 C56 69 60 71 62 74 C63 77 60 79 57 79 L52 81 Z"
        className={`${s.line} ${s.dark}`}
      />
      <circle cx="62.5" cy="76.5" r="3.6" className={`${s.line} ${s.tint}`} />

      {/* pale hair under the cheek guards */}
      <path
        d="M9 64 C6 68 6 73 9 77 C11 73 12 68 11 64 Z M14 66 C12 70 12 74 14.5 77 C16 73 16.5 69 15.5 66 Z M61 64 C64 68 64 73 61 77 C59 73 58 68 59 64 Z M56 66 C58 70 58 74 55.5 77 C54 73 53.5 69 54.5 66 Z"
        className={`${s.line} ${s.fur}`}
      />

      {/* helm of domination */}
      {spikes.map(([bx, by, tx, ty, hw]) => (
        <path
          key={bx}
          d={`M${bx - hw} ${by + 2} L${tx} ${ty} L${bx + hw} ${by + 2} Z`}
          className={`${s.line} ${s.dark}`}
        />
      ))}
      <path d="M64.8 18 L68.2 15.5" className={s.line} />
      <path
        d="M31 16 C27 11 26 6 27 1 C29 6 31 10 34 14 Z M39 16 C42 11 43 5 41 -1 C44 5 44 11 41 17 Z"
        className={`${s.line} ${s.dark}`}
      />
      <path d={helm} className={`${s.line} ${s.dark}`} />
      <path
        d="M30.5 17 C30.5 13 33 11.5 35 11.5 C37 11.5 39.5 13 39.5 17 C39.5 19 38.5 20 37.5 20.5 V22 H32.5 V20.5 C31.5 20 30.5 19 30.5 17 Z"
        className={`${s.line} ${s.fur}`}
      />
      <circle cx="33.3" cy="16.5" r="1.1" className={s.dark} />
      <circle cx="36.7" cy="16.5" r="1.1" className={s.dark} />
      <path
        d="M35 26 C37 29 38 31 38 32.5 C38 34.2 36.6 35.2 35 35.2 C33.4 35.2 32 34.2 32 32.5 C32 31 33 29 35 26 Z"
        className={s.line}
        style={{ fill: ICE }}
      />
      <path d="M17.5 34.5 Q24 31.5 30 35 M40 35 Q46 31.5 52.5 34.5" className={s.line} />
      <path d="M33 38.5 L35 47 L37 38.5" className={`${s.line} ${s.thin}`} />
      <path
        d="M15 51 Q35 57 55 51 M16 55.5 Q35 62 54 55.5 M18 60 Q35 66.5 52 60"
        className={`${s.line} ${s.thin}`}
      />
      {eyes.map((x, i) => (
        <g key={x}>
          <g opacity="0.45">
            <circle cx={x} cy="41" r="8" fill={ICE} className={s.pulse} style={delay(i * 0.2)} />
          </g>
          <circle cx={x} cy="41" r="5.5" fill={ICE} />
          <circle cx={x - 1.6} cy="39.4" r="1.4" className={s.paper} />
        </g>
      ))}
    </g>
  );
}

/** A desk: a laptop writing code, a mug of something hot, a Lich King figure. */
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
      {/* backdrop */}
      <ellipse cx="250" cy="206" rx="206" ry="150" className={s.blob} />
      <circle cx="408" cy="96" r="42" className={s.blobShade} />
      <ellipse cx="240" cy="296" rx="210" ry="9" className={s.shade} />

      {/* Lich King vinyl figure, beside the laptop */}
      <g transform="translate(-14 173)">
        <LichKing />
      </g>

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

      {/* mug */}
      <path
        d="M418 236 C434 236 434 266 418 266"
        className={`${s.line} ${s.bold}`}
      />
      <path
        d="M378 222 H420 V272 C420 283 413 290 402 290 H396 C385 290 378 283 378 272 Z"
        className={`${s.line} ${s.paper}`}
      />
      <path d="M378 242 H420 V254 H378 Z" className={s.accent} opacity="0.75" />
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

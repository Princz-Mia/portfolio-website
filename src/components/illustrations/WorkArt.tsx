import { Sparkle, delay, origin, s } from "./parts";

type Token = { x: number; w: number; accent?: boolean };

/** A desk: a laptop writing code, a mug of something hot, a small plant. */
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
      viewBox="-40 0 520 400"
      width="520"
      height="400"
      aria-hidden="true"
      focusable="false"
    >
      {/* backdrop */}
      <ellipse cx="250" cy="206" rx="206" ry="150" className={s.blob} />
      <circle cx="408" cy="96" r="42" className={s.blobShade} />
      <ellipse cx="240" cy="296" rx="210" ry="9" className={s.shade} />

      {/* plant, beside the laptop */}
      <g transform="translate(-48 0)">
        <g className={s.sway} style={origin("50% 100%")}>
          <path
            d="M60 236 C56 208 38 192 22 188 C26 208 40 226 60 236 Z"
            className={`${s.line} ${s.shade}`}
          />
          <path
            d="M60 236 C62 204 76 182 94 176 C92 200 78 222 60 236 Z"
            className={`${s.line} ${s.tint}`}
          />
          <path
            d="M60 236 C58 212 58 192 62 164 C70 190 68 214 60 236 Z"
            className={`${s.line} ${s.shade}`}
          />
          <path
            d="M60 234 C50 214 38 200 26 192 M60 234 C68 212 80 192 92 180 M61 232 C60 210 61 190 62 170"
            className={`${s.line} ${s.thin}`}
          />
        </g>
        <path d="M38 236 H84 V248 H38 Z" className={`${s.line} ${s.shade}`} />
        <path
          d="M42 248 H80 L74 290 H48 Z"
          className={`${s.line} ${s.paper}`}
        />
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
        x="124"
        y="92"
        width="236"
        height="144"
        rx="6"
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

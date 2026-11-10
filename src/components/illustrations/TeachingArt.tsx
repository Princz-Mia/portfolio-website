import { Sparkle, delay, s } from "./parts";

/**
 * A chalkboard on an easel. A small Java program writes itself out, an arrow
 * points to a light bulb, and the bulb glows: the moment something clicks.
 */
export function TeachingArt({ className }: { className?: string }) {
  const code = [
    "class Hello {",
    "  void main() {",
    '    print("it clicks");',
    "  }",
    "}",
  ];

  return (
    <svg
      className={`${s.figure} ${className ?? ""}`}
      viewBox="0 0 480 400"
      width="480"
      height="400"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="240" cy="200" rx="214" ry="160" className={s.blob} />
      <circle cx="420" cy="320" r="40" className={s.blobShade} />
      <ellipse cx="236" cy="372" rx="170" ry="8" className={s.shade} />

      {/* easel legs behind the board */}
      <path
        d="M118 280 L92 370 M354 280 L380 370 M236 280 V372"
        className={`${s.line} ${s.bold}`}
      />
      <path d="M104 336 H368" className={s.line} />

      {/* board */}
      <rect
        x="62"
        y="52"
        width="348"
        height="226"
        rx="10"
        className={s.tint}
        transform="translate(8 7)"
      />
      <rect
        x="62"
        y="52"
        width="348"
        height="226"
        rx="10"
        className={`${s.line} ${s.paper}`}
      />
      <rect
        x="78"
        y="68"
        width="316"
        height="194"
        rx="5"
        className={`${s.line} ${s.shade}`}
      />

      {code.map((text, i) => (
        <text
          key={text}
          x="98"
          y={104 + i * 26}
          className={`${s.mono} ${s.appear}`}
          style={delay(0.3 + i * 0.35)}
          fontSize="15"
          xmlSpace="preserve"
        >
          {text}
        </text>
      ))}

      {/* arrow to the idea */}
      <g style={delay(2.1)}>
        <path
          d="M276 174 C300 164 306 148 314 134"
          pathLength={1}
          className={`${s.accentLine} ${s.draw}`}
        />
      </g>
      <g className={s.appear} style={delay(2.5)}>
        <path d="M306 136 L315 130 L318 141" className={s.accentLine} />
      </g>

      {/* light bulb */}
      <g className={s.pop} style={delay(2.6)}>
        <path
          d="M342 132 C328 122 330 96 352 92 C374 88 386 110 374 126 C368 134 366 138 366 146 H348 C348 140 348 136 342 132 Z"
          className={`${s.line} ${s.paper}`}
        />
        <path d="M349 152 H365 M351 159 H363" className={s.line} />
        <path d="M352 132 L356 120 L360 132" className={s.accentLine} />
        <g className={s.pulse}>
          <path
            d="M356 78 V70 M384 90 L390 84 M328 90 L322 84 M394 114 H402 M310 114 H318"
            className={s.accentLine}
          />
        </g>
      </g>

      {/* tray, chalk and eraser */}
      <rect
        x="56"
        y="278"
        width="360"
        height="10"
        rx="3"
        className={`${s.line} ${s.paper}`}
      />
      <rect
        x="300"
        y="270"
        width="22"
        height="7"
        rx="2"
        className={`${s.line} ${s.paper}`}
      />
      <rect
        x="96"
        y="264"
        width="40"
        height="13"
        rx="2"
        className={`${s.line} ${s.tint}`}
      />
      <path d="M96 271 H136" className={`${s.line} ${s.thin}`} />

      <Sparkle x={36} y={120} size={7} wait={0.6} />
      <Sparkle x={448} y={60} size={6} wait={1.5} tone="ink" />
    </svg>
  );
}

import { Sparkle, delay, s } from "./parts";

type Candle = { open: number; close: number; high: number; low: number };

/**
 * Two app windows, one for each featured project: a food ordering app behind,
 * and a trading chart in front whose candles grow in and whose price line draws.
 */
export function ProjectsArt({ className }: { className?: string }) {
  const candles: Candle[] = [
    { open: 300, close: 284, high: 276, low: 308 },
    { open: 284, close: 292, high: 278, low: 300 },
    { open: 292, close: 268, high: 260, low: 298 },
    { open: 268, close: 274, high: 262, low: 284 },
    { open: 274, close: 248, high: 240, low: 280 },
    { open: 248, close: 256, high: 242, low: 264 },
    { open: 256, close: 230, high: 222, low: 262 },
    { open: 230, close: 238, high: 222, low: 246 },
  ];
  const x0 = 214;
  const step = 26;
  const line = candles
    .map(
      (c, i) =>
        `${i === 0 ? "M" : "L"}${x0 + i * step} ${(c.open + c.close) / 2}`,
    )
    .join(" ");

  return (
    <svg
      className={`${s.figure} ${className ?? ""}`}
      viewBox="0 0 480 400"
      width="480"
      height="400"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="244" cy="200" r="172" className={s.blob} />
      <circle cx="420" cy="80" r="36" className={s.blobShade} />

      {/* back window: food ordering */}
      <g className={s.appear} style={delay(0)}>
        <rect
          x="56"
          y="54"
          width="252"
          height="184"
          rx="12"
          className={s.shade}
          transform="translate(7 7)"
        />
        <rect
          x="56"
          y="54"
          width="252"
          height="184"
          rx="12"
          className={`${s.line} ${s.paper}`}
        />
        <path d="M56 82 H308" className={s.line} />
        <circle cx="74" cy="68" r="3.4" className={s.accent} />
        <circle cx="86" cy="68" r="3.4" className={s.inkFill} opacity="0.5" />
        <circle cx="98" cy="68" r="3.4" className={s.inkFill} opacity="0.5" />
        {/* plate, fork and knife */}
        <circle cx="168" cy="158" r="46" className={`${s.line} ${s.paper}`} />
        <circle cx="168" cy="158" r="32" className={`${s.line} ${s.tint}`} />
        <path
          d="M100 120 V196 M92 120 V138 Q92 148 100 148 Q108 148 108 138 V120"
          className={s.line}
        />
        <path d="M232 120 C248 134 248 160 236 168 V196" className={s.line} />
        <path
          d="M156 140 C150 132 160 126 154 118 M170 138 C164 130 174 124 168 114"
          className={`${s.line} ${s.steam}`}
          style={delay(0.5)}
        />
        <path d="M70 216 H130 M70 226 H110" className={`${s.line} ${s.thin}`} />
        <rect
          x="248"
          y="208"
          width="44"
          height="18"
          rx="9"
          className={s.accent}
          opacity="0.8"
        />
      </g>

      {/* front window: trading */}
      <rect
        x="182"
        y="150"
        width="270"
        height="206"
        rx="12"
        className={s.tint}
        transform="translate(8 8)"
      />
      <rect
        x="182"
        y="150"
        width="270"
        height="206"
        rx="12"
        className={`${s.line} ${s.paper}`}
      />
      <path d="M182 178 H452" className={s.line} />
      <circle cx="200" cy="164" r="3.4" className={s.accent} />
      <circle cx="212" cy="164" r="3.4" className={s.inkFill} opacity="0.5" />
      <circle cx="224" cy="164" r="3.4" className={s.inkFill} opacity="0.5" />
      <path
        d="M200 328 H434 M200 280 H434 M200 232 H434"
        className={`${s.line} ${s.thin} ${s.dashed}`}
      />

      {candles.map((c, i) => {
        const x = x0 + i * step;
        const up = c.close < c.open;
        const top = Math.min(c.open, c.close);
        const height = Math.max(5, Math.abs(c.open - c.close));
        return (
          <g key={x} className={s.grow} style={delay(0.35 + i * 0.09)}>
            <path d={`M${x} ${c.high} V${c.low}`} className={s.line} />
            <rect
              x={x - 7}
              y={top}
              width="14"
              height={height}
              rx="1.5"
              className={up ? `${s.line} ${s.paper}` : `${s.line} ${s.shade}`}
            />
          </g>
        );
      })}

      <g style={delay(1.2)}>
        <path
          d={line}
          pathLength={1}
          className={`${s.accentLine} ${s.draw}`}
          strokeWidth={2.2}
        />
      </g>
      <g className={s.pop} style={delay(2.1)}>
        <circle cx={x0 + 7 * step} cy="234" r="5" className={s.accent} />
        <rect
          x="398"
          y="196"
          width="40"
          height="20"
          rx="10"
          className={s.accent}
        />
        <path d="M410 210 L418 202 L426 210" className={s.paperLine} />
      </g>

      {/* pointer */}
      <g className={s.float} style={delay(0.8)}>
        <path
          d="M326 286 L326 316 L334 308 L340 322 L346 319 L340 306 L351 306 Z"
          className={`${s.line} ${s.paper}`}
        />
      </g>

      <Sparkle x={40} y={290} size={7} wait={0.3} />
      <Sparkle x={330} y={44} size={6} wait={1.4} tone="ink" />
    </svg>
  );
}

import { Sparkle, delay, s } from "./parts";

/** An open envelope; its letter has folded itself into a plane and is on its way. */
export function ContactArt({ className }: { className?: string }) {
  return (
    <svg
      className={`${s.figure} ${className ?? ""}`}
      viewBox="0 0 480 400"
      width="480"
      height="400"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="236" cy="216" rx="206" ry="156" className={s.blob} />
      <circle cx="372" cy="132" r="46" className={s.blobShade} />
      <ellipse cx="176" cy="352" rx="120" ry="8" className={s.shade} />

      {/* envelope */}
      <g className={s.appear} style={delay(0)}>
        <path
          d="M72 226 L170 160 L268 226"
          className={`${s.line} ${s.shade}`}
        />
        <rect
          x="96"
          y="182"
          width="148"
          height="108"
          rx="4"
          className={`${s.line} ${s.paper}`}
        />
        <path
          d="M114 206 H210 M114 222 H226 M114 238 H190"
          className={`${s.line} ${s.thin}`}
        />
        <path
          d="M72 226 V338 C72 344 76 348 82 348 H258 C264 348 268 344 268 338 V226"
          className={s.tint}
          transform="translate(7 6)"
        />
        <path
          d="M72 226 L170 296 L268 226 V338 C268 344 264 348 258 348 H82 C76 348 72 344 72 338 Z"
          className={`${s.line} ${s.paper}`}
        />
        <path
          d="M72 338 L148 282 M268 338 L192 282"
          className={`${s.line} ${s.thin}`}
        />
        <circle cx="170" cy="296" r="11" className={s.accent} />
        <path d="M165 296 L169 300 L176 292" className={s.paperLine} />
      </g>

      {/* trail */}
      <path
        d="M200 170 C214 112 284 112 284 150 C284 186 240 176 252 140 C262 112 300 112 330 128"
        className={`${s.accentLine} ${s.dashed} ${s.flow}`}
      />

      {/* plane */}
      <g transform="translate(-44 36)">
        <g className={s.float} style={delay(0.4)}>
          <g className={s.pop} style={delay(0.7)}>
            <path
              d="M456 54 L372 92 L398 102 Z"
              className={s.tint}
              transform="translate(5 5)"
            />
            <path
              d="M456 54 L398 102 L404 128 Z"
              className={`${s.line} ${s.shade}`}
            />
            <path
              d="M456 54 L372 92 L398 102 Z"
              className={`${s.line} ${s.paper}`}
            />
            <path d="M398 102 L390 116" className={`${s.line} ${s.thin}`} />
          </g>
        </g>
      </g>

      <Sparkle x={316} y={214} size={7} wait={0.2} />
      <Sparkle x={52} y={140} size={6} wait={1.1} tone="ink" />
      <Sparkle x={440} y={176} size={5} wait={1.9} />
    </svg>
  );
}

import { Sparkle, delay, origin, s } from "./parts";

/**
 * A stack of books with a mortarboard on top; the tassel swings. Small logic
 * symbols drift around it.
 */
export function AcademicArt({ className }: { className?: string }) {
  return (
    <svg
      className={`${s.figure} ${className ?? ""}`}
      viewBox="0 0 480 400"
      width="480"
      height="400"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="244" cy="214" r="166" className={s.blob} />
      <circle cx="84" cy="112" r="40" className={s.blobShade} />
      <ellipse cx="240" cy="346" rx="160" ry="9" className={s.shade} />

      {/* books */}
      <g className={s.appear} style={delay(0)}>
        <rect
          x="112"
          y="302"
          width="248"
          height="40"
          rx="5"
          className={s.tint}
          transform="translate(8 6)"
        />
        <rect
          x="112"
          y="302"
          width="248"
          height="40"
          rx="5"
          className={`${s.line} ${s.paper}`}
        />
        <rect
          x="130"
          y="302"
          width="10"
          height="40"
          className={s.accent}
          opacity="0.8"
        />
        <rect
          x="146"
          y="302"
          width="4"
          height="40"
          className={s.accent}
          opacity="0.8"
        />
        <path d="M170 322 H290" className={`${s.line} ${s.thin}`} />
      </g>
      <g className={s.appear} style={delay(0.12)}>
        <rect
          x="134"
          y="264"
          width="214"
          height="38"
          rx="5"
          className={`${s.line} ${s.shade}`}
        />
        <path d="M156 264 V302 M320 264 V302" className={s.line} />
        <path d="M176 283 H260" className={`${s.line} ${s.thin}`} />
      </g>
      <g className={s.appear} style={delay(0.24)}>
        <rect
          x="120"
          y="232"
          width="232"
          height="32"
          rx="5"
          className={`${s.line} ${s.paper}`}
        />
        <rect
          x="312"
          y="232"
          width="14"
          height="32"
          className={s.accent}
          opacity="0.8"
        />
        <path d="M144 248 H232" className={`${s.line} ${s.thin}`} />
      </g>

      {/* mortarboard */}
      <g className={s.pop} style={delay(0.45)}>
        <path
          d="M196 190 L198 220 C220 238 270 238 292 222 L294 190"
          className={`${s.line} ${s.shade}`}
        />
        <path
          d="M150 176 L244 142 L340 172 L246 206 Z"
          className={s.tint}
          transform="translate(6 6)"
        />
        <path
          d="M150 176 L244 142 L340 172 L246 206 Z"
          className={`${s.line} ${s.paper}`}
        />
        <path d="M172 178 L244 152" className={`${s.line} ${s.thin}`} />
        <circle cx="245" cy="174" r="4.5" className={s.dark} />
        <g className={s.sway} style={origin("0% 0%")}>
          <path
            d="M245 174 Q294 170 322 177 L324 214"
            className={s.accentLine}
            strokeWidth={2.2}
          />
          <path
            d="M317 214 L314 240 M324 214 V242 M331 214 L334 240"
            className={s.accentLine}
          />
          <path d="M315 212 H333" className={s.accentLine} strokeWidth={4} />
        </g>
      </g>

      {/* drifting symbols */}
      <g className={s.float} style={delay(0)}>
        <path
          d="M72 196 L84 226 L96 196 M76 208 H92"
          className={`${s.line} ${s.strong}`}
        />
      </g>
      <g className={s.float} style={delay(1.2)}>
        <path
          d="M392 92 L410 110 L392 128 L374 110 Z"
          className={s.accentLine}
        />
      </g>
      <g className={s.float} style={delay(2.1)}>
        <rect
          x="396"
          y="214"
          width="26"
          height="26"
          rx="2"
          className={`${s.line} ${s.strong}`}
        />
      </g>
      <g className={s.float} style={delay(0.7)}>
        <path d="M110 92 V120 M110 106 H130" className={s.line} />
      </g>

      <Sparkle x={196} y={92} size={7} wait={0.2} />
      <Sparkle x={432} y={300} size={6} wait={1.1} tone="ink" />
    </svg>
  );
}

import { Sparkle, Tube, delay, origin, s } from "./parts";

/**
 * A jagged ring as one path: a toothed outer edge and a round hole, filled with
 * the even-odd rule. Every fourth tooth is a little longer, so it looks hewn
 * rather than machined.
 */
function jaggedRing(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  hole: number,
  teeth: number,
) {
  const points: string[] = [];
  for (let i = 0; i < teeth * 2; i += 1) {
    const angle = (Math.PI * 2 * i) / (teeth * 2) - Math.PI / 2;
    const radius = i % 2 === 0 ? outer + (i % 8 === 0 ? 5 : 0) : inner;
    points.push(
      `${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  const ring = `M${points.join(" L")} Z`;
  const circle = `M${cx + hole} ${cy} A${hole} ${hole} 0 1 0 ${cx - hole} ${cy} A${hole} ${hole} 0 1 0 ${cx + hole} ${cy} Z`;
  return `${ring} ${circle}`;
}

/**
 * Off the clock: a Horde war standard planted behind a cat loaf that has fallen
 * asleep, with a game controller and a film clapperboard nearby. The banner is a
 * hand-drawn homage in the faction's red and black, not the official crest.
 */
export function PersonalArt({ className }: { className?: string }) {
  const cx = 160;
  const cy = 176;

  return (
    <svg
      className={`${s.figure} ${className ?? ""}`}
      viewBox="0 0 520 420"
      width="520"
      height="420"
      role="img"
      aria-labelledby="personal-art-title"
      focusable="false"
    >
      <title id="personal-art-title">
        Illustration of a red Horde war banner behind a sleeping grey cat, with
        a game controller and a film clapperboard
      </title>

      <ellipse cx="276" cy="232" rx="236" ry="168" className={s.blob} />
      <circle cx="452" cy="96" r="44" className={s.blobShade} />
      <ellipse cx="290" cy="398" rx="220" ry="9" className={s.shade} />

      {/* ---------- war standard ---------- */}
      <Tube d={`M${cx} 40 V396`} width={9} fill="shade" />
      <path
        d={`M${cx} 4 L${cx - 11} 36 L${cx} 30 L${cx + 11} 36 Z`}
        className={s.dark}
      />

      {/* horns at the ends of the crossbar */}
      <path
        d="M80 64 C60 62 48 46 52 26 C58 40 68 50 86 54 Z"
        className={`${s.line} ${s.paper}`}
      />
      <path
        d="M240 64 C260 62 272 46 268 26 C262 40 252 50 234 54 Z"
        className={`${s.line} ${s.paper}`}
      />
      <Tube d="M78 60 H242" width={10} fill="shade" />
      <path
        d="M118 56 L122 44 L126 56 M194 56 L198 44 L202 56"
        className={s.dark}
      />
      <path
        d={`M${cx - 9} 52 L${cx + 9} 68 M${cx + 9} 52 L${cx - 9} 68`}
        className={`${s.line} ${s.strong}`}
        strokeWidth={2.4}
      />

      {/* cloth */}
      <g className={s.sway} style={origin("50% 0%")}>
        <path d="M108 66 V74 M212 66 V74" className={s.line} />
        <path
          d="M96 68 H224 V268 L212 290 L200 270 L186 300 L172 274 L160 304 L148 274 L134 300 L120 270 L108 290 L96 268 Z"
          className={`${s.banner} ${s.line} ${s.strong}`}
        />
        <path d="M96 68 H224 V84 H96 Z" className={s.dark} />
        <path
          d="M104 88 V262 M216 88 V262"
          stroke="var(--art-dark)"
          strokeWidth={3}
          fill="none"
        />
        <path
          d="M104 262 H216"
          stroke="var(--art-dark)"
          strokeWidth={3}
          fill="none"
        />
        <path
          d="M104 96 L216 96"
          stroke="var(--art-dark)"
          strokeWidth={1.2}
          fill="none"
          opacity="0.6"
        />

        {/* crest */}
        <path
          d={jaggedRing(cx, cy, 52, 43, 33, 16)}
          className={s.dark}
          fillRule="evenodd"
        />
        <path
          d={`M${cx} ${cy - 50} L${cx + 30} ${cy + 26} L${cx + 17} ${cy + 26} L${cx} ${cy - 16} L${cx - 17} ${cy + 26} L${cx - 30} ${cy + 26} Z`}
          className={s.dark}
        />
        <path
          d={`M${cx - 6} ${cy + 4} L${cx} ${cy + 62} L${cx + 6} ${cy + 4} Z`}
          className={s.dark}
        />
        <path
          d={`M${cx - 30} ${cy + 26} C${cx - 36} ${cy + 42} ${cx - 26} ${cy + 56} ${cx - 12} ${cy + 60} C${cx - 20} ${cy + 48} ${cx - 22} ${cy + 38} ${cx - 18} ${cy + 26} Z`}
          className={s.dark}
        />
        <path
          d={`M${cx + 30} ${cy + 26} C${cx + 36} ${cy + 42} ${cx + 26} ${cy + 56} ${cx + 12} ${cy + 60} C${cx + 20} ${cy + 48} ${cx + 22} ${cy + 38} ${cx + 18} ${cy + 26} Z`}
          className={s.dark}
        />
      </g>

      {/* ---------- clapperboard, leaning on the pole ---------- */}
      <g className={s.appear} style={delay(0.3)}>
        <rect
          x="46"
          y="332"
          width="84"
          height="58"
          rx="4"
          className={`${s.line} ${s.paper}`}
        />
        <path
          d="M58 352 H118 M58 364 H104 M58 376 H96"
          className={`${s.line} ${s.thin}`}
        />
        <rect
          x="46"
          y="320"
          width="84"
          height="12"
          className={`${s.line} ${s.dark}`}
        />
        <path
          d="M58 320 L64 332 M76 320 L82 332 M94 320 L100 332 M112 320 L118 332"
          className={s.paperLine}
          strokeWidth={4}
        />
        <g transform="rotate(-16 46 318)">
          <rect
            x="46"
            y="306"
            width="84"
            height="12"
            className={`${s.line} ${s.dark}`}
          />
          <path
            d="M58 306 L64 318 M76 306 L82 318 M94 306 L100 318 M112 306 L118 318"
            className={s.paperLine}
            strokeWidth={4}
          />
        </g>
      </g>

      {/* ---------- cat loaf, asleep ---------- */}
      <path
        d="M290 352 C286 304 322 282 380 282 C438 282 470 304 466 352 C466 368 454 376 436 376 H320 C302 376 290 368 290 352 Z"
        className={s.tint}
        transform="translate(9 6)"
      />
      <path
        d="M290 352 C286 304 322 282 380 282 C438 282 470 304 466 352 C466 368 454 376 436 376 H320 C302 376 290 368 290 352 Z"
        className={`${s.line} ${s.fur}`}
      />
      <path
        d="M386 288 C380 298 382 308 390 314 M412 290 C406 300 408 308 416 314 M436 298 C432 306 434 312 440 316"
        className={`${s.line} ${s.strong}`}
      />
      <g className={s.swayTail} style={origin("100% 0%")}>
        <Tube
          d="M462 356 C470 384 432 390 402 388 C372 386 350 388 340 382"
          width={14}
        />
      </g>
      <ellipse
        cx="316"
        cy="376"
        rx="14"
        ry="7"
        className={`${s.line} ${s.paper}`}
      />
      <ellipse
        cx="344"
        cy="379"
        rx="14"
        ry="7"
        className={`${s.line} ${s.paper}`}
      />

      {/* head */}
      <path
        d="M300 282 L295 240 Q296 231 305 236 L328 262 Z"
        className={`${s.line} ${s.fur}`}
      />
      <path
        d="M362 282 L367 240 Q366 231 357 236 L334 262 Z"
        className={`${s.line} ${s.fur}`}
      />
      <path d="M303 272 L300 248 L318 264 Z" className={s.tint} />
      <path d="M359 272 L362 248 L344 264 Z" className={s.tint} />
      <path
        d="M290 304 C290 279 308 262 331 262 C354 262 372 279 372 304 C372 328 354 342 331 342 C308 342 290 328 290 304 Z"
        className={`${s.line} ${s.fur}`}
      />
      <path
        d="M313 314 C313 304 321 301 331 305 C341 301 349 304 349 314 C349 325 341 331 331 331 C321 331 313 325 313 314 Z"
        className={s.paper}
      />
      <path
        d="M323 270 L325 280 M331 268 V279 M339 270 L337 280"
        className={`${s.line} ${s.strong}`}
      />
      <path
        d="M306 300 Q314 307 322 300 M340 300 Q348 307 356 300"
        className={`${s.line} ${s.strong}`}
        strokeWidth={2.2}
      />
      <ellipse cx="305" cy="314" rx="8" ry="4.5" className={s.tint} />
      <ellipse cx="357" cy="314" rx="8" ry="4.5" className={s.tint} />
      <path d="M326 311 Q331 308 336 311 L331 317 Z" className={s.accent} />
      <path
        d="M331 317 Q331 322 325 323 M331 317 Q331 322 337 323"
        className={s.line}
      />
      <path
        d="M312 318 L280 312 M312 323 L282 328 M350 318 L382 312 M350 323 L380 328"
        className={`${s.line} ${s.thin}`}
      />

      {/* zzz */}
      <g className={s.float} style={delay(0)}>
        <text x="380" y="254" className={s.script} fontSize="26">
          z
        </text>
      </g>
      <g className={s.float} style={delay(0.8)}>
        <text x="402" y="230" className={s.script} fontSize="20">
          z
        </text>
      </g>
      <g className={s.float} style={delay(1.6)}>
        <text x="420" y="210" className={s.script} fontSize="15">
          z
        </text>
      </g>

      {/* ---------- controller ---------- */}
      <g className={s.appear} style={delay(0.5)}>
        <path
          d="M232 354 C232 334 252 322 270 330"
          className={`${s.line} ${s.thin}`}
        />
        <path
          d="M196 356 C176 356 166 376 172 392 C176 402 188 402 196 394 L208 384 H256 L268 394 C276 402 288 402 292 392 C298 376 288 356 268 356 Z"
          className={`${s.line} ${s.paper}`}
        />
        <path
          d="M192 370 H206 M199 363 V377"
          className={`${s.line} ${s.strong}`}
          strokeWidth={3}
        />
        <circle cx="264" cy="365" r="3.4" className={s.accent} />
        <circle cx="273" cy="373" r="3.4" className={s.inkFill} />
        <circle cx="255" cy="373" r="3.4" className={s.inkFill} />
        <circle cx="264" cy="381" r="3.4" className={s.inkFill} />
      </g>

      <Sparkle x={286} y={150} size={7} wait={0.4} />
      <Sparkle x={494} y={250} size={6} wait={1.3} tone="ink" />
      <Sparkle x={30} y={200} size={6} wait={2} />
    </svg>
  );
}

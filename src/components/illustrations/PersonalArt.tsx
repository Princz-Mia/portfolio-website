import { LICH_FIGURE, LICH_HEAD, LICH_TARGET, LichKingFigure } from "./LichKingFigure";
import { Sparkle, Tube, delay, origin, s } from "./parts";

/** Centre line of the war standard: the pole, hub and emblem sit on it. */
const POLE_X = 160;

/** Mirrors the left half of the standard onto the right, about the pole. */
const MIRROR = `translate(${POLE_X * 2} 0) scale(-1 1)`;

/**
 * The left horn: a crescent that leaves the crossbar collar, dips out and
 * curls up to a point level with the finial. The right horn is its mirror.
 */
const HORN = "M72 87 C38 92 16 64 27 18 C36 46 50 60 72 61 Z";

/**
 * Banner cloth: a straight top hung from the clasps, a nick torn into each
 * side and a ragged bottom edge whose longest shred sits just right of centre.
 * Left of the pole the cloth is torn shorter, so its hem stays well clear of
 * the Lich King figure standing beneath it (even as the cloth sways).
 */
const CLOTH =
  "M92 86 H228 V194 L221 199 L228 205 V312 L222 330 L215 320 L206 346 L198 328 L190 334 L184 322 L172 352 L164 330 L154 336 L148 318 L140 324 L134 304 L126 294 L118 298 L110 286 L102 294 L92 282 V258 L99 253 L92 248 Z";

/**
 * The Horde emblem in a 100 x 100 box: one outline (crown, side hooks, two
 * fang legs, and the keyhole that opens out between the legs) plus the
 * floating diamond. The right side sits a touch lower and its leg is shorter,
 * as in the original mark.
 */
const EMBLEM =
  "M51 0 L67 15 L76 12 L76 23 L85 35 Q74 40 76 49 L89 43 L78 62 Q71 58 67 61 Q61 65 62 72 L68 75 L55 94 Q53 82 55 66 Q60 58 64 48 Q68 36 62 26 Q56 19 50 20 Q44 19 38 26 Q32 36 36 48 Q40 58 45 66 Q48 85 46 100 L33 74 L39 71 Q40 64 34 60 Q30 57 23 61 L11 41 L25 47 Q26 38 15 33 L25 21 L26 9 L35 13 Z";
const EMBLEM_DIAMOND = "M50 25 L59 36.5 L50 47.5 L41 36.5 Z";

/** The finial: a rough, tall cone standing on the iron hub. */
const FINIAL =
  "M149 60 L152 50 L150.5 47 L155 36 L154 33 L159 22 L161.5 22 L165 34 L164 37 L168 48 L167 51 L171 60 Z";

const CAT_BODY =
  "M290 352 C282 314 308 284 356 282 C404 280 430 306 426 336 C424 352 412 358 394 358 H308 C296 358 292 356 290 352 Z";
const CUSHION =
  "M256 372 C248 352 276 342 338 342 C400 342 432 350 424 372 C432 392 402 402 338 402 C274 402 248 392 256 372 Z";
const CONTROLLER =
  "M206 374 C192 374 186 388 190 398 C193 405 202 405 208 399 L216 392 H248 L256 399 C262 405 271 405 274 398 C278 388 272 374 258 374 Z";
const BUCKET = "M444 324 L508 324 L498 400 H454 Z";

/** The floor line the pole socket, the controller, the cushion and the figure stand on. */
const FLOOR_Y = 404;

/**
 * Where the Lich King figure on its Frozen Throne stands, and its scale: on
 * the floor left of the banner pole, its dais on the floor line beside the
 * pole's socket and under the short left half of the cloth's hem, sized like
 * a collectible next to the banner and the cat. Its left edge stays clear of
 * the strip of the drawing that can sit under the section's text column.
 */
const LICH_K = 0.56;
const LICH_LEFT = 78;
const LICH_AT = {
  x: LICH_LEFT - LICH_FIGURE.x * LICH_K,
  y: FLOOR_Y - (LICH_FIGURE.y + LICH_FIGURE.h) * LICH_K,
};
/** The figure's line factor, so its lines keep about the drawing's weight. */
const LICH_LINE = 1.45;
/** Centre of the figure's throne, where its ground shadow sits. */
const LICH_MID_X = LICH_AT.x + (LICH_FIGURE.x + LICH_FIGURE.w / 2) * LICH_K;

/** The drawing's coordinate system, for overlays that line up with it. */
export const PERSONAL_VIEW = { width: 520, height: 420 } as const;

/** A rectangle in drawing units. */
export type ArtBox = { x: number; y: number; width: number; height: number };

/** The Lich King figure's hit area: from its helm and shards down to its dais. */
const LICH_BOX: ArtBox = {
  x: LICH_AT.x + LICH_TARGET.x * LICH_K,
  y: LICH_AT.y + LICH_TARGET.y * LICH_K,
  width: LICH_TARGET.w * LICH_K,
  height: LICH_TARGET.h * LICH_K,
};

/**
 * Boxes around the parts a viewer can interact with, in drawing units: the
 * banner cloth (down to the top of the Lich King figure, which stands under
 * its hem), the sleeping cat with its cushion top, the popcorn bucket, the
 * controller on the floor and the Lich King figure on its throne. They do not
 * overlap.
 */
export const PERSONAL_BOXES = {
  banner: { x: 88, y: 80, width: 144, height: Math.floor(LICH_BOX.y) - 80 },
  cat: { x: 276, y: 276, width: 156, height: 96 },
  popcorn: { x: 436, y: 288, width: 80, height: 118 },
  controller: { x: 184, y: 368, width: 92, height: 42 },
  lich: LICH_BOX,
} as const satisfies Record<string, ArtBox>;

/** Points that effects start from or land on, in drawing units. */
export const PERSONAL_POINTS = {
  /** Top of the popcorn heap in the bucket. */
  popcorn: { x: 476, y: 306 },
  /** Between the cat's ears. */
  catHead: { x: 308, y: 290 },
  /** The floor line the bucket, controller, pole and Lich King figure stand on. */
  floorY: FLOOR_Y,
  /** Above the standing Lich King figure's helm, where its speech bubble points. */
  lichHead: {
    x: LICH_AT.x + LICH_HEAD.x * LICH_K,
    y: LICH_AT.y + LICH_HEAD.top * LICH_K,
  },
} as const;

/**
 * One end of the crossbar: the horn (pale, with a darker tip and growth
 * ridges), the leather lashing that ties it on, and the iron collar with its
 * small pyramid spike. Drawn for the left end and mirrored for the right.
 */
function StandardEnd() {
  return (
    <>
      <path d={HORN} className={s.paper} />
      <rect
        x="0"
        y="0"
        width="80"
        height="32"
        className={s.fur}
        clipPath="url(#personal-horn-clip)"
      />
      <path
        d="M56 56 L60 94 M22 62 L48 48 M20 42 L42 36"
        className={`${s.line} ${s.thin}`}
        clipPath="url(#personal-horn-clip)"
      />
      <path d={HORN} className={s.line} />
      <path
        d="M60 63 L64 87 M65 62 L69 87"
        className={`${s.line} ${s.strong}`}
      />
      <rect
        x="72"
        y="61"
        width="20"
        height="26"
        rx="2"
        className={`${s.line} ${s.strong} ${s.shade}`}
      />
      <path
        d="M75 61 L82 48 L89 61 Z"
        className={`${s.line} ${s.strong} ${s.shade}`}
      />
      <path d="M82 48 V61" className={`${s.line} ${s.thin}`} />
    </>
  );
}

/** An iron pentagon clasp that pins a top corner of the cloth to the bar. */
function Clasp() {
  return (
    <>
      <path
        d="M96 79 H112 V92 L104 100 L96 92 Z"
        className={`${s.line} ${s.strong} ${s.shade}`}
      />
      <circle cx="104" cy="88" r="2" className={s.inkFill} />
    </>
  );
}

/**
 * Off the clock: a Horde war standard from Durotar (horned crossbar, spiked
 * finial, tattered red cloth with the emblem in black), drawn as a fan-art
 * homage. At its foot a grey cat sleeps curled on a cushion, with a game
 * controller on the floor and a striped bucket of popcorn, under a crescent
 * moon; left of the pole a vinyl Lich King on the Frozen Throne stands on the
 * floor.
 *
 * The parts that react to the viewer carry `data-part` (cloth, cat, cat-ear,
 * zzz, controller, bucket, lich) so a wrapper can animate them without the
 * drawing itself needing any script; the figure's poses follow the wrapper's
 * data-lich and data-lich-poke attributes.
 */
export function PersonalArt({ className }: { className?: string }) {
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
        Illustration of a red Horde war banner with curved horns and the Horde
        emblem, a grey cat asleep on a cushion at its foot, a Lich King figure
        on its throne standing on the floor beside the banner pole, a game
        controller and a bucket of popcorn under a crescent moon
      </title>

      <defs>
        <clipPath id="personal-horn-clip">
          <path d={HORN} />
        </clipPath>
      </defs>

      {/* ---------- backdrop ---------- */}
      <ellipse cx="270" cy="222" rx="240" ry="176" className={s.blob} />
      <circle cx="450" cy="112" r="50" className={s.blobShade} />
      <path
        d="M460.2 89.4 A24 24 0 1 0 460.2 134.6 A26 26 0 0 1 460.2 89.4 Z"
        className={`${s.line} ${s.paper}`}
      />
      <ellipse cx="300" cy="404" rx="226" ry="8" className={s.shade} />

      {/* ---------- war standard ---------- */}
      <g className={s.tint} transform="translate(7 6)">
        <path d={HORN} />
        <path d={HORN} transform={MIRROR} />
        <path
          d="M84 74 H236 M160 74 V398"
          fill="none"
          stroke="var(--art-tint)"
          strokeWidth={15}
          strokeLinecap="round"
        />
        <path d={FINIAL} />
        <rect x="145" y="59" width="30" height="30" rx="3" />
        <rect x="140" y="370" width="40" height="34" rx="2" />
      </g>

      {/* pole and crossbar, wood */}
      <Tube d={`M${POLE_X} 70 V392`} width={16} />
      <path d="M157 330 V350 M163 318 V336" className={`${s.line} ${s.thin}`} />
      <Tube d="M84 74 H236" width={14} />
      <path d="M104 73 H122 M190 75 H206" className={`${s.line} ${s.thin}`} />

      <StandardEnd />
      <g transform={MIRROR}>
        <StandardEnd />
      </g>

      {/* finial and iron hub with its diamond stud */}
      <path d={FINIAL} className={`${s.line} ${s.dark}`} />
      <path d="M152.5 48 Q160 51 167.5 48" className={`${s.paperLine} ${s.thin}`} />
      <rect
        x="145"
        y="59"
        width="30"
        height="30"
        rx="3"
        className={`${s.line} ${s.strong} ${s.shade}`}
      />
      <path
        d="M160 65 L169 74 L160 83 L151 74 Z"
        className={`${s.line} ${s.strong} ${s.fur}`}
      />
      <path d="M151 74 H169 M160 65 V83" className={`${s.line} ${s.thin}`} />

      {/* cloth, swaying from its top edge; the outer group can billow */}
      <g data-part="cloth">
        <g className={s.sway} style={origin("50% 0%")}>
          <path d={CLOTH} className={s.tint} transform="translate(7 6)" />
          <path d={CLOTH} className={`${s.line} ${s.strong} ${s.banner}`} />
          <path
            d="M104 100 C106 114 104 126 106 138 M216 100 C214 114 216 126 214 138"
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.3}
            strokeLinecap="round"
            opacity={0.7}
          />
          <path
            d="M98 276 V262 M98 244 V92 H222 V190 M222 210 V304"
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g transform="translate(100 124) scale(1.2)">
            <path
              d={EMBLEM}
              className={s.dark}
              stroke="var(--art-dark)"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
            <path
              d={EMBLEM_DIAMOND}
              className={s.dark}
              stroke="var(--art-dark)"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </g>
          {/* small rips through the cloth */}
          <path d="M186 262 L193 272 L190 273 Z" className={s.tint} />
          <path d="M126 262 L130 274 L127.5 274 Z" className={s.tint} />
        </g>
      </g>

      <Clasp />
      <g transform={MIRROR}>
        <Clasp />
      </g>

      {/* cord with an oxblood bead hanging from the right collar */}
      <g className={s.swayTail} style={origin("50% 0%")}>
        <path d="M240 86 C241 96 239 104 240 112" className={s.line} />
        <circle cx="240" cy="116" r="4" className={`${s.line} ${s.accent}`} />
        <path d="M237 120 L235 134 M240 120 V136 M243 120 L245 134" className={s.accentLine} />
      </g>

      {/* iron socket at the foot of the pole */}
      <rect
        x="144"
        y="376"
        width="32"
        height="28"
        rx="2"
        className={`${s.line} ${s.strong} ${s.shade}`}
      />
      <rect
        x="140"
        y="370"
        width="40"
        height="8"
        rx="2"
        className={`${s.line} ${s.strong} ${s.shade}`}
      />
      <circle cx="160" cy="391" r="3.5" className={`${s.line} ${s.strong} ${s.paper}`} />
      <circle cx="147" cy="374" r="1.4" className={s.inkFill} />
      <circle cx="173" cy="374" r="1.4" className={s.inkFill} />

      {/* ---------- Lich King figure on the floor, left of the pole ---------- */}
      <ellipse
        cx={LICH_MID_X.toFixed(2)}
        cy={FLOOR_Y + 1}
        rx={(LICH_FIGURE.w * LICH_K * 0.58).toFixed(2)}
        ry="4.5"
        className={s.inkFill}
        opacity={0.16}
      />
      <g data-part="lich">
        <g transform={`translate(${LICH_AT.x.toFixed(2)} ${LICH_AT.y.toFixed(2)}) scale(${LICH_K})`}>
          <LichKingFigure line={LICH_LINE} />
        </g>
      </g>

      {/* ---------- cushion ---------- */}
      <path d={CUSHION} className={s.shade} transform="translate(7 6)" />
      <path d={CUSHION} className={`${s.line} ${s.tint}`} />
      <path
        d="M262 372 C258 358 284 350 338 350 C394 350 420 358 416 372"
        className={`${s.line} ${s.thin} ${s.dashed}`}
      />

      {/* ---------- cat, curled up asleep ---------- */}
      <g data-part="cat">
        <path d={CAT_BODY} className={s.tint} transform="translate(8 6)" />
        <path d={CAT_BODY} className={`${s.line} ${s.fur}`} />
        <path
          d="M368 286 C362 296 364 306 372 312 M392 288 C386 298 388 306 396 312 M414 300 C410 308 412 314 418 318"
          className={`${s.line} ${s.strong}`}
        />
        <path d="M386 356 C382 336 394 322 410 326" className={s.line} />

        {/* tail wrapped round the front */}
        <Tube
          d="M422 340 C434 362 400 368 370 366 C346 364 334 362 328 356"
          width={14}
        />
        <path
          d="M397 360 L398 372 M378 360 L379 372"
          className={`${s.line} ${s.strong}`}
        />

        {/* head */}
        <path
          d="M282 314 L278 284 Q279 278 285 281 L304 298 Z"
          className={`${s.line} ${s.fur}`}
        />
        <path d="M284 306 L282 289 L296 299 Z" className={s.tint} />
        <g data-part="cat-ear">
          <path
            d="M334 314 L338 284 Q337 278 331 281 L312 298 Z"
            className={`${s.line} ${s.fur}`}
          />
          <path d="M332 306 L334 289 L320 299 Z" className={s.tint} />
        </g>
        <path
          d="M276 330 C276 308 290 296 308 296 C326 296 340 308 340 328 C340 346 326 356 308 356 C290 356 276 348 276 330 Z"
          className={`${s.line} ${s.fur}`}
        />
        <path
          d="M300 302 L302 310 M308 300 V309 M316 302 L314 310"
          className={`${s.line} ${s.strong}`}
        />
        <path
          d="M298 337 C298 331 303 329 308 332 C313 329 318 331 318 337 C318 343 313 347 308 347 C303 347 298 343 298 337 Z"
          className={s.paper}
        />
        <path
          d="M288 326 Q295 332 302 326 M314 326 Q321 332 328 326"
          className={`${s.line} ${s.strong} ${s.bold}`}
        />
        <ellipse cx="290" cy="338" rx="6.5" ry="4" className={s.tint} />
        <ellipse cx="326" cy="338" rx="6.5" ry="4" className={s.tint} />
        <path d="M304 333 Q308 331 312 333 L308 338 Z" className={s.accent} />
        <path
          d="M308 338 Q308 342 303 343 M308 338 Q308 342 313 343"
          className={s.line}
        />
        <path
          d="M294 338 L266 334 M294 342 L268 347 M322 338 L350 334 M322 342 L348 347"
          className={`${s.line} ${s.thin}`}
        />

        {/* front paws tucked under the chin */}
        <ellipse cx="296" cy="358" rx="11" ry="6" className={`${s.line} ${s.paper}`} />
        <ellipse cx="321" cy="359" rx="11" ry="6" className={`${s.line} ${s.paper}`} />
        <path
          d="M293 355 V359 M299 355 V359 M318 356 V360 M324 356 V360"
          className={`${s.line} ${s.thin}`}
        />
      </g>

      {/* zzz */}
      <g data-part="zzz">
        <g className={s.float} style={delay(0)}>
          <text x="346" y="272" className={s.script} fontSize="24">
            z
          </text>
        </g>
        <g className={s.float} style={delay(0.8)}>
          <text x="366" y="248" className={s.script} fontSize="19">
            z
          </text>
        </g>
        <g className={s.float} style={delay(1.6)}>
          <text x="382" y="228" className={s.script} fontSize="15">
            z
          </text>
        </g>
      </g>

      {/* ---------- game controller on the floor ---------- */}
      <g data-part="controller">
        <g className={s.appear} style={delay(0.4)}>
          <g transform="rotate(-6 232 388)">
            <path d={CONTROLLER} className={s.tint} transform="translate(6 5)" />
            <path d={CONTROLLER} className={`${s.line} ${s.paper}`} />
            <path
              d="M200 385 H212 M206 379 V391"
              className={`${s.line} ${s.strong}`}
              style={{ strokeWidth: 3 }}
            />
            <path
              d="M226 382 H230 M234 382 H238"
              className={`${s.line} ${s.strong}`}
            />
            <circle cx="258" cy="379" r="2.8" className={s.accent} />
            <circle cx="264" cy="385" r="2.8" className={s.inkFill} />
            <circle cx="252" cy="385" r="2.8" className={s.inkFill} />
            <circle cx="258" cy="391" r="2.8" className={s.inkFill} />
          </g>
        </g>
      </g>

      {/* ---------- popcorn bucket ---------- */}
      <g data-part="bucket">
        <g className={s.pop} style={delay(0.6)}>
          <path d={BUCKET} className={s.tint} transform="translate(7 6)" />
          <path
            d="M446 318 C438 306 450 296 460 302 C462 290 478 290 481 300 C487 290 504 294 502 306 C512 306 512 318 506 318 Z"
            className={`${s.line} ${s.paper}`}
          />
          <path
            d="M458 310 C462 306 468 308 468 312 M484 306 C488 302 494 304 494 308"
            className={`${s.line} ${s.thin}`}
          />
          <path d={BUCKET} className={s.paper} />
          <path
            d="M460 324 H476 V400 H465 Z M492 324 H508 L498 400 H487 Z"
            className={s.accent}
          />
          <path d={BUCKET} className={s.line} />
          <rect
            x="440"
            y="316"
            width="72"
            height="10"
            rx="3"
            className={`${s.line} ${s.paper}`}
          />
        </g>
      </g>

      <Sparkle x={300} y={120} size={7} wait={0.4} />
      <Sparkle x={500} y={52} size={5} wait={1.1} tone="ink" />
      <Sparkle x={490} y={226} size={6} wait={1.8} />
      <Sparkle x={26} y={250} size={6} wait={2.4} tone="ink" />
    </svg>
  );
}

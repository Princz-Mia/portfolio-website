import type { CSSProperties, ReactNode } from "react";
import { delay, s } from "./parts";
import f from "./LichKingFigure.module.css";

/**
 * The figure's own coordinate box: the throne runs from -14 to 88 across and
 * from -20 (the tallest ice shard) to 152 (the foot of the dais) down. A parent
 * places it with a `translate(x y) scale(k)` group.
 */
export const LICH_FIGURE = { x: -14, y: -20, w: 102, h: 172 } as const;

/**
 * The part a viewer pokes, in the figure's units: from the shoulders of the
 * throne's ice shards down to the dais, covering the standing pose as well.
 */
export const LICH_TARGET = { x: -12, y: -12, w: 98, h: 164 } as const;

/**
 * The two poses' proportions, in the figure's units. Both poses share one
 * head, body, cape top, arms and sword at the same size; only the legs differ.
 * Standing, the upper body rises by `rise` and the straightened legs reach
 * from the hips down to the dais.
 *
 * - `headTop`: the tips of the helm's prongs, seated.
 * - `seatedSole`: the soles of the boots hanging in front of the seat.
 * - `standingSole`: the soles of the boots standing on the dais.
 * - `rise`: how far the upper body rises when the figure stands.
 */
export const LICH_POSE = { headTop: -0.5, seatedSole: 123, standingSole: 138.5, rise: 5 } as const;

/** The helm's centre line and the top of the standing figure, in the figure's units. */
export const LICH_HEAD = { x: 35, top: LICH_POSE.headTop - LICH_POSE.rise } as const;

/** The hips of the standing figure: the bottom of the risen body. */
const STAND_HIP = 98 - LICH_POSE.rise;

/** Ice blue, used only while the figure is awake. */
const ICE = "#bfe6f2";
const ICE_LINE = "#7fc8de";

/*
 * Line classes whose width follows the parent's `line` factor, so the figure
 * keeps the drawing's line weight at whatever size it is placed.
 */
const L = `${s.line} ${f.l}`;
const LT = `${s.line} ${s.thin} ${f.lt}`;
const PLT = `${s.paperLine} ${s.thin} ${f.lt}`;
const sw = (width: number): CSSProperties => ({
  strokeWidth: `calc(${width}px * var(--lich-line, 1))`,
});

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
        style={sw((k < 1 ? 1.1 : 1.7) / k)}
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
        className={`${L} ${s.dark}`}
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
        style={sw(1.4)}
      />
      <path d="M-1.2 -8 h2.4 M-1.2 -12.5 h2.4 M-1.2 -17 h2.4" className={s.accentLine} style={sw(1.1)} />
      <rect x="-1.3" y="0" width="2.6" height="12" className={`${s.line} ${s.dark}`} style={sw(1.4)} />
      <path d="M0 17 L1.8 12 H-1.8 Z" className={`${s.line} ${s.dark}`} style={sw(1.4)} />
      <path
        d="M0 1 C-3.5 0.5 -7.5 2.5 -10 5.5 C-9.5 1.5 -7.5 -2 -4.2 -3.5 H4.2 C7.5 -2 9.5 1.5 10 5.5 C7.5 2.5 3.5 0.5 0 1 Z"
        className={`${s.line} ${s.dark}`}
        style={sw(1.4)}
      />
      <circle cx="0" cy="-1.3" r="2" className={s.paper} />
      <circle cx="-0.75" cy="-1.5" r="0.55" className={s.dark} />
      <circle cx="0.75" cy="-1.5" r="0.55" className={s.dark} />
    </g>
  );
}

/**
 * The Frozen Throne: a low dais, an angular seat with ice armrests and a tall
 * back of jagged ice shards.
 */
function Throne() {
  const back =
    "M-6 106 L-12 34 L-3 44 L-1 10 L8 24 L16 -6 L25 10 L35 -20 L45 10 L54 -6 L62 24 L71 10 L73 44 L82 34 L76 106 Z";
  const armL = "M-9 138 V80 L-5 70 L-1 77 L3 73 L5 80 V138 Z";
  const armR = "M65 138 V80 L67 73 L71 77 L75 70 L79 80 V138 Z";
  const seat = "M2 104 H68 V138 H2 Z";
  const seatTop = "M6 98 H64 L68 104 H2 Z";
  const dais =
    "M-10 138 H84 L88 143 V150 C88 151.1 87.1 152 86 152 H-12 C-13.1 152 -14 151.1 -14 150 V143 Z";

  return (
    <g>
      {/* print shadow */}
      <g transform="translate(6 5)" className={s.tint}>
        <path d={back} />
        <path d={armR} />
        <path d={dais} />
      </g>

      {/* the back: a fan of ice shards with pale facets */}
      <path d={back} className={`${L} ${f.ice}`} />
      <path
        d="M16 -6 L18.5 24 M35 -20 L35 14 M54 -6 L51.5 24 M-1 10 L2 40 M71 10 L68 40 M-12 34 L-4 70 M82 34 L74 70"
        className={PLT}
        style={{ opacity: 1, ...sw(1.6) }}
      />
      <path d="M8 24 L11 50 M62 24 L59 50" className={LT} />

      {/* dais */}
      <path d={dais} className={`${L} ${s.shade}`} />
      <path d="M-14 143 H88" className={LT} />

      {/* armrests */}
      <path d={armL} className={`${L} ${f.ice}`} />
      <path d={armR} className={`${L} ${f.ice}`} />
      <path d="M-5 70 V136 M75 70 V136" className={PLT} style={{ opacity: 1 }} />

      {/* seat */}
      <path d={seat} className={`${L} ${f.ice}`} />
      <path d={seatTop} className={`${L} ${s.paper}`} />
      <path
        d="M9 108 L15 134 M56 108 L62 132 M30 126 L40 136"
        className={PLT}
        style={{ opacity: 1, ...sw(1.6) }}
      />
      <path d="M2 120 L9 126 M68 116 L62 121" className={LT} />
    </g>
  );
}

/** A boot, the figure's right, with its sole at y `sole`; both poses wear the same one. */
function Boot({ sole }: { sole: number }) {
  const top = sole - 8.5;
  return (
    <>
      <path
        d={`M19.5 ${top} H33.5 V${top + 5} C33.5 ${top + 6.9} 32 ${sole} 30 ${sole} H23 C21.1 ${sole} 19.5 ${top + 6.9} 19.5 ${top + 5} Z`}
        className={`${L} ${s.dark}`}
      />
      <path d={`M20.5 ${top + 2.5} H32.5`} className={PLT} />
    </>
  );
}

/**
 * One standing leg, the figure's right: the seated leg's thigh, knee, shin and
 * boot at the same widths, straightened from the hips down to the dais.
 */
function StandingLeg() {
  const knee = STAND_HIP + 17;
  const sole = LICH_POSE.standingSole;
  return (
    <>
      <path d={`M20 ${STAND_HIP - 2} H33 L32.6 ${knee} H20.4 Z`} className={`${L} ${s.dark}`} />
      <path d={`M21.5 ${knee} H31.5 V${sole - 7} H21.5 Z`} className={`${L} ${s.dark}`} />
      <path d={`M26.5 ${knee + 5} V${sole - 11}`} className={PLT} />
      <Boot sole={sole} />
      <circle cx="26.5" cy={knee} r="3" className={`${L} ${s.tint}`} />
    </>
  );
}

/** The cape, behind the body; seated it rests on the seat, standing it hangs to the boots. */
function Cape({
  top,
  hem,
  hanging = false,
}: {
  top: number;
  hem: number;
  /** Standing, the cape hangs in a deeper tone so it reads as cloth behind the legs, not a pale panel. */
  hanging?: boolean;
}) {
  const mid = (top + hem) / 2;
  // Hanging, the hem draws in a little, as cloth does when it falls straight.
  const left = hanging ? 14.5 : 11;
  const right = hanging ? 55.5 : 59;
  return (
    <>
      <path
        d={`M13 ${top} C11 ${top + 12} ${left - 0.5} ${mid + 8} ${left + 0.5} ${hem + 1} H${right - 0.5} C${right + 0.5} ${mid + 8} 59 ${top + 12} 57 ${top} Z`}
        className={`${L} ${s.shade} ${hanging ? f.capeHanging : ""}`}
      />
      <path
        d={`M${left} ${hem} C${left + 6} ${hem - 2} 22 ${hem + 1} 28 ${hem - 1} C34 ${hem + 1} 38 ${hem - 2} 44 ${hem} C50 ${hem - 2} ${right - 5} ${hem + 1} ${right} ${hem - 1} L${right} ${hem + 3} C${right - 5} ${hem + 6} 50 ${hem + 3} 44 ${hem + 5} C38 ${hem + 3} 34 ${hem + 6} 28 ${hem + 4} C22 ${hem + 6} ${left + 6} ${hem + 3} ${left} ${hem + 5} Z`}
        className={`${L} ${s.fur}`}
      />
    </>
  );
}

/**
 * A big-headed vinyl Lich King on the Frozen Throne, in the box LICH_FIGURE:
 * the Helm of Domination as the head (a dark dome flaring into cheek guards, a
 * ring of spikes, a small skull with two curved prongs, a teardrop gem, big
 * round eyes and a ribbed jaw guard), a short armoured body with skull
 * roundels and skull pauldrons, a cape with a fur hem, knees bent over the
 * seat, and its right hand on Frostmourne, which leans point down on the dais
 * beside it.
 *
 * The right arm and the sword are one group, drawn raised to the sky and
 * turned down about the shoulder at rest, so the sword never leaves the hand.
 * When an ancestor carries data-lich="awake", the figure stands up: the upper
 * body rises a little (LICH_POSE.rise), the bent legs straighten down to the
 * dais in front of the seat, the cape unfolds from the seat to hang behind
 * them, the arm swings Frostmourne straight up and the eyes burn ice blue;
 * with data-lich-poke ("a" or "b") it wobbles. Head, body, arms, cape and
 * sword keep one size in both poses, so standing only adds the length of the
 * straightened legs. Without those attributes it sits still.
 *
 * `line` scales the line widths, so a parent that shrinks the figure can keep
 * its lines as heavy as the rest of the drawing.
 */
export function LichKingFigure({ line = 1 }: { line?: number }) {
  const helm =
    "M8 35 C8 22 18 15 35 15 C52 15 62 22 62 35 V54 C62 60 64 65 68 69 L63.5 68.2 L61 72 L57.5 67.8 L54 70.6 Q35 75 16 70.6 L12.5 67.8 L9 72 L6.5 68.2 L2 69 C6 65 8 60 8 54 Z";
  const body = "M17.5 67 H52.5 L51.5 98 H18.5 Z";
  /** The raised right arm, from the shoulder (57, 77) to the fist (68, 50). */
  const arm = "M57 77 L67.4 51.5";
  const spikes: [number, number, number, number, number][] = [
    // base x, base y, tip x, tip y, half width (left side; mirrored)
    [13, 26, 4.5, 4.5, 4.2],
    [21, 19, 16, 6.5, 3.5],
    [27.5, 17, 26.5, 11, 2.4],
  ];
  const eyes = [23.5, 46.5];
  const armOutline: CSSProperties = { strokeWidth: "calc(6px + 3.4px * var(--lich-line, 1))" };

  return (
    <g className={f.figure} style={{ "--lich-line": line } as CSSProperties}>
      <Throne />

      {/* awake: the same cape, no longer folded on the seat, hangs behind
          the straightened legs, which stand on the dais in front of the
          seat. Nothing here is scaled: the legs are as wide and the cape as
          broad as in the seated pose. */}
      <g className={f.standLegs} data-lich-pose="standing">
        <Cape top={70 - LICH_POSE.rise} hem={LICH_POSE.standingSole - 10} hanging />
        <Pair>
          <StandingLeg />
        </Pair>
      </g>

      {/* the upper body, the same in both poses, which rises when the figure stands */}
      <g className={f.rise} data-lich-pose="body">
        {/* print shadow (the body's only while seated: standing, it would
            show as a pale band over the cape) */}
        <g transform="translate(5 4)" className={s.tint}>
          <path d={helm} />
          <path d={body} className={f.sitOnly} />
        </g>

        {/* cape behind, with its fur hem resting on the seat (hidden when the
            figure stands, where the hanging cape above takes its place) */}
        <g className={f.sitOnly}>
          <Cape top={70} hem={100} />
        </g>

        {/* the armoured body */}
        <path d={body} className={`${L} ${s.dark}`} />
        <path d="M35 71 V86" className={LT} />
        <path d="M18.5 87.5 H51.5" className={LT} />
        <path d="M31 89 H39 V98.5 L35 100.5 L31 98.5 Z" className={`${L} ${s.tint}`} />
        <rect x="33" y="86" width="4" height="3" rx="0.8" className={s.accent} />
        <Pair>
          <circle cx="28.5" cy="79.5" r="3.1" className={`${L} ${s.paper}`} />
          <circle cx="27.4" cy="79.2" r="0.75" className={s.dark} />
          <circle cx="29.6" cy="79.2" r="0.75" className={s.dark} />
        </Pair>

        {/* left arm, gauntleted fist resting on the knee */}
        <path
          d="M9 79 C8.5 83 8.7 86.5 9.5 89 H18 C18.8 86 19 82.5 18.5 79 Z"
          className={`${L} ${s.dark}`}
        />
        <rect x="8.4" y="84" width="10.6" height="3.6" rx="1.2" className={`${L} ${s.tint}`} />
        <circle cx="13.7" cy="91.2" r="3.6" className={`${L} ${s.tint}`} />

        {/* skull pauldrons */}
        <Pair>
          <Pauldron />
        </Pair>

        {/* pale hair under the cheek guards */}
        <Pair>
          <path
            d="M4.5 67 C2 71 2.3 76 5 79.5 C7 75.5 8 71 7.5 67 Z"
            className={`${L} ${s.fur}`}
          />
        </Pair>

        {/* helm of domination: spikes and prongs behind the dome */}
        <Pair>
          {spikes.map(([bx, by, tx, ty, hw]) => (
            <path
              key={bx}
              d={`M${bx - hw} ${by + 3} L${tx} ${ty} L${bx + hw} ${by + 3} Z`}
              className={`${L} ${s.dark}`}
            />
          ))}
          <path
            d="M32.4 13 C29.4 10 27.8 5 28.6 -0.5 C30.4 4.5 32.6 8 35 11.5 Z"
            className={`${L} ${s.dark}`}
          />
        </Pair>
        <path d={helm} className={`${L} ${s.dark}`} />
        <path d="M14.5 27.5 C17.5 21.5 23 18.8 28.5 18.3" className={PLT} />
        <Skull x={35} y={16.5} />

        {/* the face: gem, brows, nose ridge, cheek seams and a ribbed jaw guard */}
        <path
          d="M35 25 C36.8 27.8 38 29.8 38 31.4 C38 33.1 36.7 34.2 35 34.2 C33.3 34.2 32 33.1 32 31.4 C32 29.8 33.2 27.8 35 25 Z"
          className={`${L} ${s.paper}`}
        />
        <Pair>
          <path d="M16.5 34 Q23 31 30 34.5" className={L} />
          <path d="M14.5 46 C12.8 53 12.8 61 14 67.2" className={LT} />
        </Pair>
        <path d="M33.6 38 L35 46.5 L36.4 38" className={LT} />
        <path
          d="M17 51 Q35 56.5 53 51 M17 56 Q35 62 53 56 M17.5 61.2 Q35 67.5 52.5 61.2"
          className={LT}
        />
        {eyes.map((x, i) => (
          <g key={x}>
            <g opacity="0.35">
              <circle cx={x} cy="41.5" r="8" className={`${s.paper} ${s.pulse}`} style={delay(i * 0.2)} />
            </g>
            <circle cx={x} cy="41.5" r="5.6" className={s.fur} />
            <circle cx={x - 1.8} cy="39.7" r="1.5" className={`${s.paper} ${f.shine}`} />
          </g>
        ))}

        {/* the right arm, turning about the shoulder: raised to the sky as
            drawn, lowered to the dais at rest. Its shoulder guard is drawn
            again on top, and the hand and Frostmourne (the hilt in the fist)
            make the same turn, so the sword never leaves the hand. */}
        <g className={f.arm}>
          <path d={arm} fill="none" stroke="var(--art-ink)" strokeLinecap="round" style={armOutline} />
          <path d={arm} fill="none" stroke="var(--art-dark)" strokeWidth="6" strokeLinecap="round" />
        </g>
        <g transform="matrix(-1 0 0 1 70 0)">
          <Pauldron />
        </g>
        <g className={f.arm}>
          <g transform="translate(68 42.2) scale(1.3)">
            <Frostmourne />
          </g>
          <g transform="rotate(22 65.7 55.6)">
            <rect x="61.4" y="53.9" width="8.6" height="3.4" rx="1.2" className={`${L} ${s.tint}`} />
          </g>
          <circle cx="68" cy="50" r="3.8" className={`${L} ${s.tint}`} />
        </g>

        {/* awake: the eyes and gem burn ice blue */}
        <g className={f.glow}>
          {eyes.map((x) => (
            <g key={x}>
              <circle cx={x} cy="41.5" r="5.6" fill={ICE} stroke={ICE_LINE} style={sw(1.4)} />
              <circle cx={x - 1.8} cy="39.7" r="1.5" fill="#ffffff" />
            </g>
          ))}
          <path
            d="M35 25 C36.8 27.8 38 29.8 38 31.4 C38 33.1 36.7 34.2 35 34.2 C33.3 34.2 32 33.1 32 31.4 C32 29.8 33.2 27.8 35 25 Z"
            fill={ICE}
            stroke={ICE_LINE}
            style={sw(1.2)}
          />
        </g>
      </g>

      {/* at rest: knees bent over the seat, boots hanging in front of it */}
      <g className={f.sitLegs} data-lich-pose="seated">
        <Pair>
          <path d="M21.5 103 H31.5 V116 H21.5 Z" className={`${L} ${s.dark}`} />
          <Boot sole={LICH_POSE.seatedSole} />
          <path
            d="M19 92 H33.5 V102.5 C33.5 104.4 32 106 30 106 H22.5 C20.6 106 19 104.4 19 102.5 Z"
            className={`${L} ${s.dark}`}
          />
          <circle cx="26.2" cy="101" r="3" className={`${L} ${s.tint}`} />
        </Pair>
      </g>
    </g>
  );
}

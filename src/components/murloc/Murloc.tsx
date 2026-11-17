"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Sparkle } from "@/components/illustrations/parts";
import s from "@/components/illustrations/illustrations.module.css";
import { playMurlocGurgle } from "@/lib/sound";
import m from "./Murloc.module.css";

/** What the murloc says, in turn, each time it is found. */
export const MURLOC_CALLS = [
  "Mrglglglgl!",
  "Mrrrggglll!",
  "Aaaaaughibbrgubugbugrguburgle!",
] as const;

/** How long a jump, wave and speech bubble last; matches Murloc.module.css. */
export const JUMP_MS = 2400;

export const MURLOC_LABEL = "Mrglglgl? (a murloc is hiding here)";

const cx = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const line = s.line;
const thin = cx(s.line, s.thin);
const skin = cx(s.line, m.skin);
const skinShade = cx(s.line, m.skinShade);

const r1 = (n: number) => Math.round(n * 10) / 10;

/* Shapes reused for the offset print shadow. */
const CREST =
  "M49 22 L45 7 Q51 11 55 10 L60 2 Q63 9 68 9 L75 4 Q75 12 79 14 L84 11 Q81 19 75 22 Z";
const HEAD =
  "M18 46 C18 27 36 16 60 16 C84 16 102 27 102 46 C102 62 86 72 60 72 C34 72 18 62 18 46 Z";
const BODY = "M38 64 C32 78 32 96 42 104 L78 104 C88 96 88 78 82 64 Z";
const FIN_LEFT = "M22 38 L6 28 Q10 35 5 40 Q11 44 6 51 Q13 52 21 55 Z";
const FOOT_LEFT =
  "M50 100 C47 106 41 109 34 115 Q38 114 40 119 Q43 114 47 119 Q49 114 53 117 L57 102 Z";
const ARM_LEFT = "M41 70 C35 76 31 82 29 88 L33.5 90 C35.5 84 38.5 79 44 75 Z";
const HAND_LEFT = "M31 87 L21.5 95 Q26 95 26.5 99.5 Q30 95.5 33 99.5 Q34 94.5 37.5 93.5 Z";
const UPPER_ARM = "M80 72 C88 77 95 81 101 81.5 L102 86.5 C95 87 87 84 79 78 Z";
const FOREARM = "M99 84.5 C100.5 79 102.5 74 104 69 L108.5 70 C107.5 76 106 81 104 86.5 Z";
const HAND_UP = "M103.5 70.5 L101.5 58 Q105 60.5 107 56.5 Q109 61 113 59.5 Q111.5 65 109 71.5 Z";
const MOUTH = "M30 48 Q60 58 90 48 Q60 82 30 48 Z";
const TONGUE = "M44 62 Q60 53 76 62 Q60 72 44 62 Z";

/** Small triangular teeth hanging from the upper lip and rising from the lower. */
const TEETH = (() => {
  const upper = (x: number) => {
    const t = (x - 30) / 60;
    return 48 + 20 * t * (1 - t);
  };
  const lower = (x: number) => {
    const t = (x - 30) / 60;
    return 48 + 68 * t * (1 - t);
  };
  const top = [37, 44.5, 52, 60, 68, 75.5, 83].map((x) => {
    const y = upper(x) - 0.4;
    return `M${r1(x - 3)} ${r1(upper(x - 3) - 0.4)} L${r1(x)} ${r1(y + 4.6)} L${r1(x + 3)} ${r1(upper(x + 3) - 0.4)} Z`;
  });
  const bottom = [43, 52, 68, 77].map((x) => {
    const y = lower(x) + 0.4;
    return `M${r1(x - 2.6)} ${r1(lower(x - 2.6) + 0.4)} L${r1(x)} ${r1(y - 4)} L${r1(x + 2.6)} ${r1(lower(x + 2.6) + 0.4)} Z`;
  });
  return [...top, ...bottom];
})();

/** Mirrors a left-side shape onto the right, across the drawing's centre line. */
const MIRROR = "translate(120 0) scale(-1 1)";

const subscribeNothing = () => () => {};

/** False while rendering on the server and hydrating, true once mounted. */
function useMounted() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/** The drawing itself: a little sea-green murloc, front on, mouth wide open. */
function MurlocDrawing({ mouthClip }: { mouthClip: string }) {
  return (
    <>
      <defs>
        <clipPath id={mouthClip}>
          <path d={MOUTH} />
        </clipPath>
      </defs>

      {/* Offset print shadow. */}
      <g transform="translate(3 2.5)" className={s.tint}>
        <path d={CREST} />
        <path d={FIN_LEFT} />
        <path d={FIN_LEFT} transform={MIRROR} />
        <path d={BODY} />
        <path d={FOOT_LEFT} />
        <path d={FOOT_LEFT} transform={MIRROR} />
        <path d={HEAD} />
        <circle cx={44} cy={21} r={10.5} />
        <circle cx={76} cy={21} r={10.5} />
      </g>

      {/* Crest: a spiny fin from the crown, between the eyes. */}
      <path d={CREST} className={skinShade} />
      <g className={thin}>
        <path d="M54 20 L45.5 8" />
        <path d="M59 19 L60 3" />
        <path d="M65 19 L74.5 5" />
        <path d="M70 20 L83 12" />
      </g>

      {/* Fin-like ears behind the jaw. */}
      <g>
        <path d={FIN_LEFT} className={skinShade} />
        <path d="M20 42 L7 30 M20.5 46 L6.5 40.5 M21 50 L7.5 50" className={thin} />
      </g>
      <g transform={MIRROR}>
        <path d={FIN_LEFT} className={skinShade} />
        <path d="M20 42 L7 30 M20.5 46 L6.5 40.5 M21 50 L7.5 50" className={thin} />
      </g>

      {/* Feet, body and belly. */}
      <path d={FOOT_LEFT} className={skin} />
      <path d={FOOT_LEFT} transform={MIRROR} className={skin} />
      <path d="M41 116 L44 109 M46.5 117.5 L47.5 110" className={thin} />
      <path d="M41 116 L44 109 M46.5 117.5 L47.5 110" transform={MIRROR} className={thin} />
      <path d={BODY} className={skin} />
      <ellipse cx={60} cy={90} rx={15} ry={12.5} className={cx(thin, s.paper)} />
      <path d="M53 86 Q60 88 67 86 M52 92 Q60 94.5 68 92" className={thin} />
      <circle cx={40.5} cy={84} r={2.2} className={m.spotFill} />
      <circle cx={80} cy={80} r={1.8} className={m.spotFill} />

      {/* Arms: the near one waves when the murloc jumps. */}
      <g>
        <path d={ARM_LEFT} className={skin} />
        <path d={HAND_LEFT} className={skin} />
      </g>
      <g className={m.armRest}>
        <g transform={MIRROR}>
          <path d={ARM_LEFT} className={skin} />
          <path d={HAND_LEFT} className={skin} />
        </g>
      </g>

      {/* Eye domes and head. */}
      <circle cx={44} cy={21} r={10.5} className={skin} />
      <circle cx={76} cy={21} r={10.5} className={skin} />
      <path d={HEAD} className={skin} />
      <path d="M44 31.5 Q47 32 49 30" className={thin} />
      <path d="M76 31.5 Q73 32 71 30" className={thin} />
      <circle cx={60} cy={28} r={1.8} className={m.spotFill} />
      <circle cx={55} cy={34} r={1.3} className={m.spotFill} />
      <circle cx={66} cy={33.5} r={1.4} className={m.spotFill} />

      {/* Gill slits. */}
      <path d="M24 39 Q27.5 43 26 49 M28.5 40 Q31.5 44 30 49" className={thin} />
      <path d="M96 39 Q92.5 43 94 49 M91.5 40 Q88.5 44 90 49" className={thin} />

      {/* The big open grin with its rows of little teeth. */}
      <path d={MOUTH} className={cx(line, s.dark)} />
      <g clipPath={`url(#${mouthClip})`}>
        <path d={TONGUE} className={s.accent} />
      </g>
      <g className={cx(m.tooth, s.paper)}>
        {TEETH.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d={MOUTH} className={line} />
      <path d="M27.5 46 Q29 48.5 31.5 49 M92.5 46 Q91 48.5 88.5 49" className={line} />

      {/* Eyes, which blink when the murloc peeks. */}
      <g className={m.eyes}>
        <circle cx={44} cy={22} r={6.5} className={s.dark} />
        <circle cx={76} cy={22} r={6.5} className={s.dark} />
        <circle cx={46.2} cy={19.6} r={2.1} className={s.paper} />
        <circle cx={78.2} cy={19.6} r={2.1} className={s.paper} />
      </g>

      {/* The raised, waving hand. */}
      <g className={m.armUp}>
        <path d={UPPER_ARM} className={skin} />
        <g className={m.wave}>
          <path d={FOREARM} className={skin} />
          <path d={HAND_UP} className={skin} />
          <path d="M106 64.5 L106 60 M108.3 66 L110.5 61.5" className={thin} />
        </g>
      </g>

      {/* Bubbles and a sparkle while it shouts. */}
      <g className={m.splash}>
        <circle cx={14} cy={30} r={3} className={cx(thin, s.paper)} />
        <circle cx={8} cy={18} r={2} className={cx(thin, s.paper)} />
        <circle cx={17} cy={10} r={1.4} className={cx(thin, s.paper)} />
        <Sparkle x={108} y={12} size={5} />
      </g>
    </>
  );
}

/**
 * A murloc hiding behind the top edge of the footer. At rest only its crest and
 * eyes show; now and then it peeks a little higher and blinks. Hovering or
 * focusing it brings up its face, and clicking makes it jump, wave and shout
 * while a short gurgle plays. Without script it is just the peeking drawing.
 */
export function Murloc() {
  const mounted = useMounted();
  const mouthClip = useId().replace(/:/g, "");
  const [call, setCall] = useState<number | null>(null);
  const calls = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = () => {
    const next = calls.current;
    calls.current += 1;
    setCall(next);
    playMurlocGurgle();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCall(null), JUMP_MS);
  };

  const phrase = call === null ? "" : MURLOC_CALLS[call % MURLOC_CALLS.length];

  return (
    <div
      className={m.root}
      data-ready={mounted ? "" : undefined}
      data-jump={call === null ? undefined : ""}
    >
      {mounted ? (
        <button type="button" className={m.hit} aria-label={MURLOC_LABEL} onClick={onClick} />
      ) : null}
      <div className={m.window}>
        <svg
          key={call ?? "rest"}
          className={cx(s.figure, m.mover)}
          viewBox="0 0 120 124"
          aria-hidden="true"
          focusable="false"
        >
          <MurlocDrawing mouthClip={mouthClip} />
        </svg>
      </div>
      {phrase ? (
        <span key={call} className={m.bubble} aria-hidden="true">
          {phrase}
        </span>
      ) : null}
      {mounted ? (
        <p className="visually-hidden" role="status">
          {phrase}
        </p>
      ) : null}
    </div>
  );
}

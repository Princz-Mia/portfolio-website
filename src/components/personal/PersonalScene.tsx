"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { personal, sounds, type CatPhoto } from "@/content";
import {
  PERSONAL_BOXES,
  PERSONAL_POINTS,
  PERSONAL_VIEW,
  type ArtBox,
} from "@/components/illustrations/PersonalArt";
import { HORN_SECONDS, playHordeHorn, playPurr } from "@/lib/sound";
import { CatPhotos } from "./CatPhotos";
import { LICH_QUOTE, useLichKing } from "./useLichKing";
import styles from "./PersonalScene.module.css";

/** Used only if the personal text ever stops linking the character. */
const RAIDER_IO_FALLBACK = "https://raider.io/characters/eu/ragnaros/Quelthara";

/** The Raider.IO profile linked from the personal text, so there is one source. */
const raiderIoUrl =
  personal.paragraphs
    .join(" ")
    .match(/https:\/\/raider\.io\/characters\/[^\s)]+/)?.[0] ?? RAIDER_IO_FALLBACK;

/** Pets within this many milliseconds of each other count towards the surprise. */
export const PET_WINDOW_MS = 6000;
/** Pets in one window before the surprise. */
export const PETS_FOR_SURPRISE = 7;
/** How long one pet's purr lasts. */
const PURR_SECONDS = 1.5;
/** At most this many popcorn kernels are on screen at once. */
const MAX_KERNELS = 40;
/** How long a spilled kernel lies on the floor before it is gone. */
const KERNEL_MS = 4200;
/** At most this many hearts are on screen at once. */
const MAX_HEARTS = 30;
const HEART_MS = 1800;

type Kernel = {
  id: number;
  /** Spilled kernels land on the floor; flying ones are carried off and fade. */
  kind: "spill" | "fly";
  style: CSSProperties;
};

type Heart = { id: number; tone: "accent" | "tint"; style: CSSProperties };

const subscribeNever = () => () => {};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

/** Places an overlay control over a box of the drawing. */
function place(box: ArtBox): CSSProperties {
  return {
    left: percent(box.x / PERSONAL_VIEW.width),
    top: percent(box.y / PERSONAL_VIEW.height),
    width: percent(box.width / PERSONAL_VIEW.width),
    height: percent(box.height / PERSONAL_VIEW.height),
  };
}

/**
 * The Lich King's speech bubble: its bottom just above the standing figure's
 * helm and its left edge at the figure's left, so it stays inside the drawing,
 * with its tail (in container units of the drawing's width) over the helm.
 */
const LICH_BUBBLE = {
  left: percent(PERSONAL_BOXES.lich.x / PERSONAL_VIEW.width),
  bottom: percent(1 - (PERSONAL_POINTS.lichHead.y - 8) / PERSONAL_VIEW.height),
  "--tail": `${(((PERSONAL_POINTS.lichHead.x - PERSONAL_BOXES.lich.x) / PERSONAL_VIEW.width) * 100).toFixed(2)}cqw`,
} as CSSProperties;

const between = (min: number, max: number) => min + Math.random() * (max - min);
const px = (value: number) => `${value.toFixed(1)}px`;

/**
 * A handful of popcorn: most kernels arc up out of the bucket and spill onto
 * the floor with a small bounce; a few are carried off up and to the left.
 * With reduced motion only a few kernels appear, already on the floor.
 */
function makeHandful(firstId: number, reduce: boolean): Kernel[] {
  const { popcorn, floorY } = PERSONAL_POINTS;
  const spills = reduce ? 4 : 6;
  const flies = reduce ? 0 : 3;
  const kernels: Kernel[] = [];

  for (let i = 0; i < spills; i++) {
    const x0 = popcorn.x + between(-18, 18);
    const y0 = popcorn.y + between(-4, 6);
    // Land to the left of the bucket, or in front of it.
    const left = Math.random() < 0.55;
    const x1 = left ? between(392, 438) : between(446, 514);
    const y1 = floorY + between(-5, 7);
    const peak = Math.min(y0, y1) - between(28, 62);
    const roll = (x1 - x0) * between(0.08, 0.18);
    kernels.push({
      id: firstId + kernels.length,
      kind: "spill",
      style: {
        "--x0": px(x0),
        "--y0": px(y0),
        "--xm": px(x0 + (x1 - x0) * 0.45),
        "--ym": px(peak),
        "--x1": px(x1),
        "--y1": px(y1),
        "--xb": px(x1 + roll * 0.6),
        "--yb": px(y1 - between(6, 12)),
        "--x2": px(x1 + roll),
        "--rot": `${between(-260, 260).toFixed(0)}deg`,
        "--s": between(0.8, 1.2).toFixed(2),
        "--wait": `${(i * 0.04).toFixed(2)}s`,
      } as CSSProperties,
    });
  }

  for (let i = 0; i < flies; i++) {
    const x0 = popcorn.x + between(-14, 14);
    const y0 = popcorn.y + between(-6, 2);
    kernels.push({
      id: firstId + kernels.length,
      kind: "fly",
      style: {
        "--x0": px(x0),
        "--y0": px(y0),
        "--x1": px(x0 - between(40, 90)),
        "--y1": px(y0 - between(70, 120)),
        "--rot": `${between(-200, 200).toFixed(0)}deg`,
        "--s": between(0.9, 1.25).toFixed(2),
        "--wait": `${(i * 0.06).toFixed(2)}s`,
      } as CSSProperties,
    });
  }

  return kernels;
}

/** Hearts rising from the cat's head; a burst sends more, wider and higher. */
function makeHearts(firstId: number, count: number, burst: boolean): Heart[] {
  const { catHead } = PERSONAL_POINTS;
  return Array.from({ length: count }, (_, i) => {
    const spread = burst ? 70 : 34;
    const x = catHead.x + between(-spread, spread) + (burst ? 30 : 10);
    const y = catHead.y + between(-6, 10);
    return {
      id: firstId + i,
      tone: i % 3 === 0 ? "tint" : "accent",
      style: {
        "--x0": px(x),
        "--y0": px(y),
        "--x1": px(x + between(-18, 18)),
        "--y1": px(y - between(burst ? 60 : 36, burst ? 120 : 64)),
        "--s": between(burst ? 1.1 : 0.95, burst ? 1.8 : 1.35).toFixed(2),
        "--wait": `${(burst ? i * 0.05 : i * 0.12).toFixed(2)}s`,
      } as CSSProperties,
    };
  });
}

/** A popcorn kernel: a small lumpy cloud drawn around the origin. */
const KERNEL =
  "M-5.5 1 C-7.5 -2.5 -4 -6.5 -0.5 -4.5 C1.5 -7.5 6.5 -5.5 5.8 -1.5 C8 1.5 5 6 1 5 C-1 7.5 -6.5 5.5 -5.5 1 Z";
const KERNEL_HULL = "M-1.5 3 C0 1 2 1.5 2.5 3";
/** A heart drawn around the origin. */
const HEART =
  "M0 4 C-7 -1 -7.5 -7 -3 -7.5 C-1.4 -7.6 -0.4 -6.6 0 -5.4 C0.4 -6.6 1.4 -7.6 3 -7.5 C7.5 -7 7 -1 0 4 Z";

type PersonalSceneProps = {
  /** The still drawing, rendered on the server. */
  children: ReactNode;
  /** Photos for the petting surprise; the surprise is skipped while empty. */
  catPhotos?: CatPhoto[];
  /** A recording of the war horn; synthesised while null. */
  hornSrc?: string | null;
};

/**
 * Makes the "Off the clock" drawing playful. Over the still drawing it lays a
 * few real controls: grab a handful of popcorn, pet the cat (it purrs, and
 * enough petting shows photos of the cats when there are any), sound the
 * Horde war horn, poke the Lich King figure (five quick pokes and it stands
 * up, raises Frostmourne and speaks its line), and the controller links to the
 * World of Warcraft character on Raider.IO. Until the page is hydrated only
 * the drawing renders.
 */
export function PersonalScene({
  children,
  catPhotos = personal.catPhotos,
  hornSrc = sounds.hordeHorn,
}: PersonalSceneProps) {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const petRef = useRef<HTMLButtonElement>(null);
  const timers = useRef(new Set<number>());
  const nextId = useRef(0);
  const petTimes = useRef<number[]>([]);
  const purrTimer = useRef<number | undefined>(undefined);
  const hornTimer = useRef<number | undefined>(undefined);
  const hornOn = useRef(false);
  const lich = useLichKing();

  const [touched, setTouched] = useState(false);
  const [tip, setTip] = useState<"a" | "b" | null>(null);
  const [kernels, setKernels] = useState<Kernel[]>([]);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [pet, setPet] = useState<"a" | "b" | null>(null);
  const [purring, setPurring] = useState(false);
  const [horn, setHorn] = useState(false);
  const [photosFrom, setPhotosFrom] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const id of pending) window.clearTimeout(id);
      pending.clear();
      window.clearTimeout(purrTimer.current);
      window.clearTimeout(hornTimer.current);
      hornOn.current = false;
    };
  }, []);

  function later(ms: number, run: () => void) {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      run();
    }, ms);
    timers.current.add(id);
  }

  function takeIds(count: number) {
    const first = nextId.current;
    nextId.current += count;
    return first;
  }

  function grabPopcorn() {
    setTouched(true);
    setTip((current) => (current === "a" ? "b" : "a"));
    const handful = makeHandful(takeIds(9), prefersReducedMotion());
    const ids = new Set(handful.map((kernel) => kernel.id));
    setKernels((current) => [...current, ...handful].slice(-MAX_KERNELS));
    later(KERNEL_MS + 400, () =>
      setKernels((current) => current.filter((kernel) => !ids.has(kernel.id))),
    );
    setStatus("You grab a handful of popcorn and spill some on the floor.");
  }

  function addHearts(count: number, burst: boolean) {
    const added = makeHearts(takeIds(count), count, burst);
    const ids = new Set(added.map((heart) => heart.id));
    setHearts((current) => [...current, ...added].slice(-MAX_HEARTS));
    later(HEART_MS + count * 120, () =>
      setHearts((current) => current.filter((heart) => !ids.has(heart.id))),
    );
  }

  function petCat() {
    setTouched(true);
    playPurr(PURR_SECONDS);
    setPet((current) => (current === "a" ? "b" : "a"));
    setPurring(true);
    window.clearTimeout(purrTimer.current);
    purrTimer.current = window.setTimeout(() => setPurring(false), PURR_SECONDS * 1000 + 100);

    const now = performance.now();
    const recent = petTimes.current.filter((time) => now - time < PET_WINDOW_MS);
    recent.push(now);

    if (recent.length >= PETS_FOR_SURPRISE) {
      petTimes.current = [];
      if (catPhotos.length > 0) {
        addHearts(6, true);
        const rect = petRef.current?.getBoundingClientRect();
        setPhotosFrom(
          rect
            ? { x: rect.left + rect.width * 0.25, y: rect.top + rect.height * 0.3 }
            : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        );
        setStatus("The cat purrs loudly. Photos of the cats appear.");
      } else {
        addHearts(14, true);
        setStatus("The cat purrs loudly and is very happy.");
      }
      return;
    }

    petTimes.current = recent;
    addHearts(3, false);
    setStatus("The cat purrs.");
  }

  function closePhotos() {
    setPhotosFrom(null);
    petRef.current?.focus({ preventScroll: true });
  }

  function soundHorn() {
    setTouched(true);
    if (hornOn.current) return;
    hornOn.current = true;
    playHordeHorn(hornSrc);
    setHorn(true);
    setStatus("The Horde war horn sounds.");
    hornTimer.current = window.setTimeout(() => {
      hornOn.current = false;
      setHorn(false);
    }, HORN_SECONDS * 1000);
  }

  function pokeLichKing() {
    setTouched(true);
    if (lich.onPoke()) setStatus(`The Lich King figure rises from its throne: "${LICH_QUOTE}"`);
  }

  if (!mounted) {
    return (
      <div className={styles.wrap} data-scene="personal">
        {children}
      </div>
    );
  }

  return (
    <div
      className={styles.wrap}
      data-scene="personal"
      data-tip={tip ?? undefined}
      data-pet={pet ?? undefined}
      data-purring={purring ? "true" : undefined}
      data-horn={horn ? "true" : undefined}
      data-lich={lich.state}
      data-lich-poke={lich.poke ?? undefined}
    >
      {children}

      <svg
        className={styles.effects}
        viewBox={`0 0 ${PERSONAL_VIEW.width} ${PERSONAL_VIEW.height}`}
        aria-hidden="true"
        focusable="false"
      >
        {kernels.map((kernel) => (
          <g
            key={kernel.id}
            data-kernel={kernel.kind}
            className={`${styles.kernel} ${kernel.kind === "fly" ? styles.fly : styles.spill}`}
            style={kernel.style}
          >
            <path d={KERNEL} transform="translate(2 2)" className={styles.kernelShadow} />
            <path d={KERNEL} className={styles.kernelBody} />
            <path d={KERNEL_HULL} className={styles.kernelHull} />
          </g>
        ))}
        {hearts.map((heart) => (
          <g key={heart.id} data-heart="" className={styles.heart} style={heart.style}>
            <path
              d={HEART}
              className={heart.tone === "accent" ? styles.heartAccent : styles.heartTint}
            />
          </g>
        ))}
      </svg>

      <button
        type="button"
        className={`${styles.hit} ${styles.banner}`}
        style={place(PERSONAL_BOXES.banner)}
        onClick={soundHorn}
      >
        <span className="visually-hidden">Sound the Horde war horn</span>
      </button>

      <a
        className={`${styles.hit} ${styles.controller}`}
        style={place(PERSONAL_BOXES.controller)}
        href={raiderIoUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Raider.IO: open my World of Warcraft character (opens in a new tab)"
        onClick={() => setTouched(true)}
      >
        <span className={styles.tooltip} aria-hidden="true">
          Raider.IO ↗
        </span>
      </a>

      <button
        ref={petRef}
        type="button"
        className={`${styles.hit} ${styles.cat}`}
        style={place(PERSONAL_BOXES.cat)}
        onClick={petCat}
      >
        <span className="visually-hidden">Pet the cat</span>
      </button>

      <button
        type="button"
        className={`${styles.hit} ${styles.lich}`}
        style={place(PERSONAL_BOXES.lich)}
        onClick={pokeLichKing}
      >
        <span className="visually-hidden">Poke the Lich King figure</span>
      </button>

      <button
        type="button"
        className={`${styles.hit} ${styles.popcorn}`}
        style={place(PERSONAL_BOXES.popcorn)}
        onClick={grabPopcorn}
      >
        <span className="visually-hidden">Grab a handful of popcorn</span>
      </button>

      <div className={styles.bubbleLayer} aria-hidden="true">
        <p
          className={styles.bubble}
          style={LICH_BUBBLE}
          data-lich-bubble=""
          data-show={lich.state === "awake" ? "" : undefined}
        >
          {lich.state === "awake" ? LICH_QUOTE : ""}
        </p>
      </div>

      <p className={styles.hint} data-hidden={touched ? "true" : undefined} aria-hidden="true">
        psst: everything here is clickable
      </p>

      <p className="visually-hidden" role="status">
        {status}
      </p>

      {photosFrom ? (
        <CatPhotos photos={catPhotos} from={photosFrom} onClose={closePhotos} />
      ) : null}
    </div>
  );
}

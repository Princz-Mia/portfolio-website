import { desk, personal, profile, projects, site } from "@/content";

/** The prompt shown before every command, in the log and beside the input. */
export const PROMPT = "mia@desk:~$";

/** Printed the first time the terminal opens. */
export const BANNER = [
  "can it run doom?",
  "yes. type doom, or tap a button below.",
  "or try duke, an endless runner for Java people.",
  "type help for everything else.",
];

export type Context = {
  /** Whether the visitor prefers reduced motion; the games then start with a note. */
  reducedMotion: boolean;
  /** Whether the locked folder has been opened with its password this page session. */
  unlocked?: boolean;
};

/** Printed by `doom --help`. */
export const DOOM_HELP = [
  "doom: the 1993 shareware episode, Knee-Deep in the Dead.",
  "  arrows      move and turn",
  "  ctrl or x   fire",
  "  space       use (doors, switches)",
  "  shift       run",
  "  , and .     strafe",
  "  1 to 7      pick a weapon",
  "  esc         doom's own menu (enter selects)",
  "  touch       the pad under the game",
  "leave with the quit to terminal button under the game.",
];

/** Printed by `duke --help`. */
export const DUKE_HELP = [
  "duke: an endless runner starring Duke, the Java mascot.",
  "  space, up or w   jump (hold for a little higher)",
  "  down or s        duck under flying braces",
  "  touch            tap the game to jump, or the pad under it",
  "dodge NullPointerExceptions, bugs, stack traces, stray braces and",
  "deprecated APIs. coffee beans are worth 10.",
  "leave with esc or the quit to terminal button.",
];

/** Printed before the game when reduced motion is preferred. */
export const DUKE_MOTION_NOTE = "reduced motion is on: duke waits until you press space or tap.";

export const DOOM_MOTION_WARNING = "reduced motion is on: heads up, doom moves fast and a lot.";

export type Result = {
  /** Lines to append to the log, starting with the echoed command. */
  lines: string[];
  /** Empty the log instead of appending. */
  clear?: boolean;
  /** Close the terminal. */
  exit?: boolean;
  /** Start Doom. */
  doom?: boolean;
  /** Start the Duke runner. */
  duke?: boolean;
  /** Ask for the password of this locked folder before going on. */
  password?: string;
  /** Show the cat photos. */
  photos?: boolean;
};

const CAT = [" /\\_/\\", "( o.o )", " > ^ <"];

const HORDE = "Lok'tar ogar! For the Horde.";

const HELP = (
  [
    ["whoami", "who uses this laptop"],
    ["projects", "things being built"],
    ["ls", "list files"],
    ["cat <file>", "print a file"],
    ["open <folder>", "open a folder"],
    ["doom", "yes, it runs doom (doom --help for keys)"],
    ["duke", "run, Duke, run (duke --help for keys)"],
    ["clear", "clear the screen"],
    ["exit", "close the terminal"],
  ] as const
).map(([command, what]) => `${command.padEnd(15)}${what}`);

/** The password-protected folder, from the desk content. */
const LOCKED = desk.lockedFolder;

/** Printed when the locked folder is opened while it has no photos. */
export const EMPTY = `${LOCKED}/ is empty for now. The cats are camera-shy.`;

/** Printed after a wrong password. */
export const DENIED = "Access denied.";
export const HINT = "Hint: some people write their passwords on sticky notes…";

/** The prompt shown beside the masked input while a folder asks for its password. */
export const passwordPrompt = (folder: string) => `password for ${folder}/:`;

/** What the log shows in place of a typed password, whatever its length. */
export const MASK = "********";

const isProjects = (arg: string) => arg === "projects" || arg === "projects/";
const isLocked = (arg: string) => arg === LOCKED || arg === `${LOCKED}/`;

/** Lines and flags for going into the locked folder once it is open. */
function enterLocked(): Result {
  const opening = `Opening ${LOCKED}/…`;
  if (personal.catPhotos.length === 0) return { lines: [opening, EMPTY] };
  return { lines: [opening], photos: true };
}

/** Asks for the password while the folder is locked, or goes straight in. */
function openLocked(ctx: Context): Result {
  return ctx.unlocked ? enterLocked() : { lines: [], password: LOCKED };
}

/**
 * Checks a password typed at the locked folder's prompt. The password is the
 * one on the sticky note on the desk, compared trimmed and ignoring case. The
 * log never shows what was typed, only a fixed mask.
 */
export function answerPassword(folder: string, attempt: string): Result & { granted: boolean } {
  const echo = `${passwordPrompt(folder)} ${MASK}`;
  const granted = attempt.trim().toLowerCase() === desk.notePassword.trim().toLowerCase();
  if (!granted) return { lines: [echo, DENIED, HINT], granted };
  const entered = enterLocked();
  return {
    ...entered,
    lines: [echo, `Access granted. ${entered.lines[0]}`, ...entered.lines.slice(1)],
    granted,
  };
}

/** Trims, collapses runs of whitespace and lowercases a command line. */
export function normalize(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/** The output of one command, before the echo of the command line. */
function output(command: string, arg: string, ctx: Context): Result {
  switch (command) {
    case "help":
      return { lines: HELP };
    case "whoami":
      return { lines: [site.name, profile.headline] };
    case "ls":
      if (arg === "") {
        const folder = `${LOCKED}/${ctx.unlocked ? "" : " (locked)"}`;
        return { lines: [`about.txt  cat.txt  horde.txt  projects/  ${folder}`] };
      }
      if (isProjects(arg)) return { lines: [`${projects.map((p) => p.slug).join("/  ")}/`] };
      if (isLocked(arg)) {
        if (!ctx.unlocked) return { lines: [], password: LOCKED };
        if (personal.catPhotos.length === 0) return { lines: [EMPTY] };
        return {
          lines: [personal.catPhotos.map((p) => p.src.split("/").pop()).join("  ")],
        };
      }
      return { lines: [`ls: ${arg}: No such file or directory`] };
    case "projects":
      return {
        lines: [
          ...projects.flatMap((p) => [`${p.slug}/`, `  ${p.tagline}`]),
          "details: Selected projects, further down the page.",
        ],
      };
    case "cat":
      if (arg === "") return { lines: ["cat: missing operand. here is a cat instead.", ...CAT] };
      if (arg === "about.txt") return { lines: [profile.intro[0] ?? ""] };
      if (arg === "cat.txt") return { lines: CAT };
      if (arg === "horde.txt") return { lines: [HORDE] };
      if (isLocked(arg)) return openLocked(ctx);
      return { lines: [`cat: ${arg}: No such file or directory`] };
    case "sudo":
      return { lines: ["mia is not in the sudoers file. This incident will be reported."] };
    case "cd":
      if (isLocked(arg)) return openLocked(ctx);
      return { lines: ["cd: there is only ~ here."] };
    case "open":
      if (arg === "") return { lines: ["open: missing operand. try ls"] };
      if (isLocked(arg)) return openLocked(ctx);
      if (isProjects(arg)) return output("projects", "", ctx);
      return { lines: [`open: ${arg}: No such file or directory`] };
    case "doom":
      if (arg === "--help") return { lines: DOOM_HELP };
      if (arg !== "") break;
      return {
        lines: [
          ...(ctx.reducedMotion ? [DOOM_MOTION_WARNING] : []),
          "loading doom.wad…",
        ],
        doom: true,
      };
    case "duke":
      if (arg === "--help") return { lines: DUKE_HELP };
      if (arg !== "") break;
      return {
        lines: [...(ctx.reducedMotion ? [DUKE_MOTION_NOTE] : []), "java -jar duke-run.jar"],
        duke: true,
      };
    case "clear":
      return { lines: [], clear: true };
    case "exit":
      return { lines: [], exit: true };
  }
  return { lines: [`${command}: command not found. try help`] };
}

/**
 * Runs one command line and returns what the terminal should do. Pure: the
 * caller appends the lines and acts on the flags.
 */
export function run(raw: string, ctx: Context): Result {
  const input = normalize(raw);
  if (input === "") return { lines: [] };
  if (input === "for the horde" || input === "lok'tar" || input.startsWith("lok'tar ")) {
    return { lines: [`${PROMPT} ${raw.trim()}`, HORDE] };
  }

  const space = input.indexOf(" ");
  const command = space === -1 ? input : input.slice(0, space);
  const arg = space === -1 ? "" : input.slice(space + 1);
  const result = output(command, arg, ctx);
  if (result.clear) return result;
  return { ...result, lines: [`${PROMPT} ${raw.trim()}`, ...result.lines] };
}

import { profile, projects, site } from "@/content";

/** The prompt shown before every command, in the log and beside the input. */
export const PROMPT = "mia@desk:~$";

/** Printed the first time the terminal opens. */
export const BANNER = [
  "can it run doom?",
  "yes. type doom, or tap a button below.",
  "type help for everything else.",
];

export type Context = {
  /** Whether the visitor prefers reduced motion; the game then moves in steps. */
  reducedMotion: boolean;
};

export type Result = {
  /** Lines to append to the log, starting with the echoed command. */
  lines: string[];
  /** Empty the log instead of appending. */
  clear?: boolean;
  /** Close the terminal. */
  exit?: boolean;
  /** Start the game. */
  doom?: boolean;
};

const CAT = [" /\\_/\\", "( o.o )", " > ^ <"];

const HORDE = "Lok'tar ogar! For the Horde.";

const HELP = [
  "whoami      who uses this laptop",
  "projects    things being built",
  "ls          list files",
  "cat <file>  print a file",
  "doom        yes, it runs doom",
  "clear       clear the screen",
  "exit        close the terminal",
];

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
      if (arg === "") return { lines: ["about.txt  cat.txt  horde.txt  projects/"] };
      if (arg === "projects" || arg === "projects/") {
        return { lines: [`${projects.map((p) => p.slug).join("/  ")}/`] };
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
      return { lines: [`cat: ${arg}: No such file or directory`] };
    case "sudo":
      return { lines: ["mia is not in the sudoers file. This incident will be reported."] };
    case "cd":
      return { lines: ["cd: there is only ~ here."] };
    case "doom":
      if (arg === "--help") {
        return { lines: ["find the red door. arrows/WASD or the pad move, Esc goes back."] };
      }
      if (arg !== "") break;
      return {
        lines: [
          ...(ctx.reducedMotion ? ["reduced motion is on: step mode, one cell per key."] : []),
          "loading doom.wad…",
        ],
        doom: true,
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

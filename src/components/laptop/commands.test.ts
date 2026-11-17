import { afterEach, describe, expect, it, vi } from "vitest";
import { desk, profile, projects, site, type CatPhoto } from "@/content";
import {
  DOOM_HELP,
  DOOM_MOTION_WARNING,
  DUKE_HELP,
  DUKE_MOTION_NOTE,
  DENIED,
  EMPTY,
  HINT,
  MASK,
  PROMPT,
  answerPassword,
  normalize,
  run,
} from "./commands";

// The cat photos start empty whatever the content holds; a test can add some.
const catPhotos = vi.hoisted(() => [] as CatPhoto[]);
vi.mock("@/content", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/content")>();
  return { ...actual, personal: { ...actual.personal, catPhotos } };
});

afterEach(() => {
  catPhotos.length = 0;
});

const ctx = { reducedMotion: false };

describe("run", () => {
  it("echoes the command and prints who uses the laptop", () => {
    const { lines } = run("whoami", ctx);
    expect(lines[0]).toBe(`${PROMPT} whoami`);
    expect(lines).toContain(site.name);
    expect(lines).toContain(profile.headline);
  });

  it("normalises spacing and case", () => {
    expect(normalize("  LS   Projects/ ")).toBe("ls projects/");
    expect(run("  WhoAmI ", ctx).lines).toContain(site.name);
  });

  it("does nothing for an empty line", () => {
    expect(run("   ", ctx)).toEqual({ lines: [] });
  });

  it("answers unknown commands", () => {
    expect(run("rm -rf /", ctx).lines.at(-1)).toBe("rm: command not found. try help");
  });

  it("refuses sudo", () => {
    expect(run("sudo make me a sandwich", ctx).lines.at(-1)).toBe(
      "mia is not in the sudoers file. This incident will be reported.",
    );
  });

  it("prints a cat when cat has no operand", () => {
    const { lines } = run("cat", ctx);
    expect(lines[1]).toBe("cat: missing operand. here is a cat instead.");
    expect(lines.at(-1)).toBe(" > ^ <");
  });

  it("reports unknown files", () => {
    expect(run("cat secrets.txt", ctx).lines.at(-1)).toBe(
      "cat: secrets.txt: No such file or directory",
    );
  });

  it("prints the about file from the profile", () => {
    expect(run("cat about.txt", ctx).lines.at(-1)).toBe(profile.intro[0]);
  });

  it("lists one entry per project", () => {
    const listing = run("ls projects", ctx).lines.at(-1) ?? "";
    expect(listing.split(/\s+/)).toEqual(projects.map((p) => `${p.slug}/`));
  });

  it("signals clear, exit and doom", () => {
    expect(run("clear", ctx)).toEqual({ lines: [], clear: true });
    expect(run("exit", ctx).exit).toBe(true);
    const doom = run("doom", ctx);
    expect(doom.doom).toBe(true);
    expect(doom.lines).toEqual([`${PROMPT} doom`, "loading doom.wad…"]);
  });

  it("warns about motion before doom when reduced motion is preferred", () => {
    const doom = run("doom", { reducedMotion: true });
    expect(doom.doom).toBe(true);
    expect(doom.lines).toContain(DOOM_MOTION_WARNING);
  });

  it("explains the controls and how to leave for doom --help", () => {
    const help = run("doom --help", ctx);
    expect(help.doom).toBeUndefined();
    expect(help.lines.slice(1)).toEqual(DOOM_HELP);
    expect(help.lines.join("\n")).toMatch(/quit to terminal/);
    expect(help.lines.join("\n")).toMatch(/esc/);
    expect(run("doom e1m1", ctx).lines.at(-1)).toBe("doom: command not found. try help");
  });

  it("starts the Duke runner", () => {
    const duke = run("duke", ctx);
    expect(duke.duke).toBe(true);
    expect(duke.doom).toBeUndefined();
    expect(duke.lines).toEqual([`${PROMPT} duke`, "java -jar duke-run.jar"]);
    expect(run("duke", { reducedMotion: true }).lines).toContain(DUKE_MOTION_NOTE);
  });

  it("explains the Duke runner for duke --help and lists it in help", () => {
    const help = run("duke --help", ctx);
    expect(help.duke).toBeUndefined();
    expect(help.lines.slice(1)).toEqual(DUKE_HELP);
    expect(help.lines.join(" ")).toMatch(/esc/);
    expect(run("duke now", ctx).lines.at(-1)).toBe("duke: command not found. try help");
    expect(run("help", ctx).lines.some((line) => line.startsWith("duke "))).toBe(true);
  });

  it("answers the Horde", () => {
    expect(run("For the Horde", ctx).lines.at(-1)).toBe("Lok'tar ogar! For the Horde.");
  });
});

describe("the locked folder", () => {
  const folder = desk.lockedFolder;

  it("is listed by ls as locked, and plainly once unlocked", () => {
    expect(run("ls", ctx).lines.at(-1)?.endsWith(`${folder}/ (locked)`)).toBe(true);
    const open = run("ls", { ...ctx, unlocked: true }).lines.at(-1) ?? "";
    expect(open).toMatch(new RegExp(`${folder}/$`));
    expect(open).not.toMatch(/locked/);
  });

  it("is mentioned by help as open <folder>", () => {
    expect(run("help", ctx).lines.some((line) => line.startsWith("open <folder>"))).toBe(true);
  });

  it.each(["cd", "open", "ls", "cat"])(
    "asks for the password on %s, with or without a slash",
    (command) => {
      for (const target of [folder, `${folder}/`]) {
        const result = run(`${command} ${target}`, ctx);
        expect(result.password).toBe(folder);
        expect(result.lines).toEqual([`${PROMPT} ${command} ${target}`]);
      }
    },
  );

  it("goes straight in once unlocked", () => {
    const result = run(`open ${folder}`, { ...ctx, unlocked: true });
    expect(result.password).toBeUndefined();
    expect(result.lines[1]).toBe(`Opening ${folder}/…`);
  });

  it("denies a wrong password with a hint and never echoes the attempt", () => {
    const result = answerPassword(folder, "hunter2");
    expect(result.granted).toBe(false);
    expect(result.lines).toEqual([`password for ${folder}/: ${MASK}`, DENIED, HINT]);
    expect(result.lines.join(" ")).not.toContain("hunter2");
  });

  it("grants the note's password trimmed and in any case", () => {
    for (const attempt of [desk.notePassword, `  ${desk.notePassword.toUpperCase()} `]) {
      const result = answerPassword(folder, attempt);
      expect(result.granted).toBe(true);
      expect(result.lines[1]).toBe(`Access granted. Opening ${folder}/…`);
      expect(result.lines.join(" ")).not.toContain(desk.notePassword);
    }
  });

  it("says the folder is empty while there are no photos", () => {
    const result = answerPassword(folder, desk.notePassword);
    expect(result.lines.at(-1)).toBe(EMPTY);
    expect(result.photos).toBeUndefined();
    expect(run(`open ${folder}`, { ...ctx, unlocked: true }).photos).toBeUndefined();
    expect(run(`ls ${folder}`, { ...ctx, unlocked: true }).lines.at(-1)).toBe(EMPTY);
  });

  it("shows the photos and lists their file names once there are some", () => {
    catPhotos.push(
      { src: "/cats/keyboard.jpg", alt: "A cat on a keyboard", width: 400, height: 300 },
      { src: "/cats/box.jpg", alt: "A cat in a box", width: 400, height: 300 },
    );
    const result = answerPassword(folder, desk.notePassword);
    expect(result.granted).toBe(true);
    expect(result.photos).toBe(true);
    expect(result.lines).not.toContain(EMPTY);
    const open = run(`open ${folder}`, { ...ctx, unlocked: true });
    expect(open.photos).toBe(true);
    expect(open.lines).toEqual([`${PROMPT} open ${folder}`, `Opening ${folder}/…`]);
    expect(run(`ls ${folder}/`, { ...ctx, unlocked: true }).lines.at(-1)).toBe(
      "keyboard.jpg  box.jpg",
    );
  });

  it("opens other folders without a password", () => {
    expect(run("open projects", ctx).lines.at(-1)).toMatch(/Selected projects/);
    expect(run("open nowhere", ctx).lines.at(-1)).toBe("open: nowhere: No such file or directory");
    expect(run("cd projects", ctx).lines.at(-1)).toBe("cd: there is only ~ here.");
  });
});

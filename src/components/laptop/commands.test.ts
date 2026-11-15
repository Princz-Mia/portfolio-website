import { describe, expect, it } from "vitest";
import { profile, projects, site } from "@/content";
import {
  DOOM_HELP,
  DOOM_MOTION_WARNING,
  DUKE_HELP,
  DUKE_MOTION_NOTE,
  PROMPT,
  normalize,
  run,
} from "./commands";

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

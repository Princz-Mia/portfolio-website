import { describe, expect, it } from "vitest";
import { buildNavItems } from "./nav";

describe("buildNavItems", () => {
  it("includes the projects entry when there are projects", () => {
    const labels = buildNavItems({ hasProjects: true }).map((item) => item.label);
    expect(labels).toEqual(["Work", "Academic", "Projects", "Teaching", "Hobbies", "Contact"]);
  });

  it("omits the projects entry when there are none", () => {
    const labels = buildNavItems({ hasProjects: false }).map((item) => item.label);
    expect(labels).toEqual(["Work", "Academic", "Teaching", "Hobbies", "Contact"]);
  });

  it("links Hobbies to the off the clock section", () => {
    const hobbies = buildNavItems({ hasProjects: true }).find((item) => item.label === "Hobbies");
    expect(hobbies?.href).toBe("#off-the-clock");
  });

  it("only produces in-page anchors", () => {
    for (const item of buildNavItems({ hasProjects: true })) {
      expect(item.href).toMatch(/^#[a-z-]+$/);
    }
  });
});

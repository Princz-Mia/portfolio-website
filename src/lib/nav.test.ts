import { describe, expect, it } from "vitest";
import { buildNavItems } from "./nav";

describe("buildNavItems", () => {
  it("includes the projects entry when there are projects", () => {
    const labels = buildNavItems({ hasProjects: true }).map((item) => item.label);
    expect(labels).toEqual(["Work", "Projects", "Academic", "Teaching", "Contact"]);
  });

  it("omits the projects entry when there are none", () => {
    const labels = buildNavItems({ hasProjects: false }).map((item) => item.label);
    expect(labels).toEqual(["Work", "Academic", "Teaching", "Contact"]);
  });

  it("only produces in-page anchors", () => {
    for (const item of buildNavItems({ hasProjects: true })) {
      expect(item.href).toMatch(/^#[a-z-]+$/);
    }
  });
});

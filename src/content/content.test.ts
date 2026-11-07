import { describe, expect, it } from "vitest";
import { academic, personal, profile, projects, roles, site, teaching, technical } from ".";

/**
 * Guards against the mistakes the content rules forbid: placeholder links, filler
 * text and inflated wording. They run on the real content.
 */

const everyText = [
  profile.headline,
  ...profile.intro,
  ...profile.facts.map((f) => `${f.label} ${f.value}`),
  ...roles.flatMap((r) => [r.summary, ...r.highlights]),
  technical.note,
  ...projects.flatMap((p) => [p.tagline, p.problem, p.contribution, ...p.decisions, p.status.note]),
  ...academic.intro,
  ...academic.focus.map((f) => f.description),
  ...academic.education.flatMap((e) => e.details),
  ...academic.outputs.map((o) => o.summary),
  ...teaching.paragraphs,
  teaching.contactPrompt,
  ...personal.paragraphs,
].join("\n");

const everyHref = [
  site.github.href,
  site.linkedin.href,
  ...(site.teachingSiteUrl ? [site.teachingSiteUrl] : []),
  ...projects.flatMap((p) => p.links.map((l) => l.href)),
  ...academic.outputs.flatMap((o) => (o.links ?? []).map((l) => l.href)),
];

describe("site content", () => {
  it("uses real, absolute links only", () => {
    expect(everyHref.length).toBeGreaterThan(0);
    for (const href of everyHref) {
      expect(href).toMatch(/^https:\/\/[^\s]+$/);
    }
    expect(site.url).toMatch(/^https:\/\/[^/]+$/);
    expect(site.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/i);
  });

  it("contains no filler or inflated wording", () => {
    const forbidden = [
      /lorem ipsum/i,
      /coming soon/i,
      /visionary/i,
      /world[- ]class/i,
      /\b10x\b/i,
      /digital experiences/i,
      /passionate/i,
      /\bTODO\b/,
      /\bTBD\b/,
    ];
    for (const pattern of forbidden) {
      expect(everyText).not.toMatch(pattern);
    }
  });

  it("describes every project with an honest, dated status and a link", () => {
    for (const project of projects) {
      expect(project.status.label.trim()).not.toHaveLength(0);
      expect(project.status.note).toMatch(/20\d\d/);
      expect(project.links.length).toBeGreaterThan(0);
      expect(project.decisions.length).toBeGreaterThan(0);
    }
  });

  it("has unique project slugs", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

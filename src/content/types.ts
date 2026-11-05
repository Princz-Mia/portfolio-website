/**
 * Content model for the portfolio.
 *
 * Everything shown on the site is typed here and filled in from the files next to
 * this one. Layout components only read these shapes, so updating the biography,
 * adding a project or a research output never requires touching layout code.
 */

export type ExternalLink = {
  label: string;
  href: string;
};

export type SiteConfig = {
  /** Full name as it should appear in headings and metadata. */
  name: string;
  /** Short role line used in metadata and the social preview. */
  role: string;
  /** Canonical origin without a trailing slash. */
  url: string;
  /** One or two sentences for search engines and link previews. */
  description: string;
  email: string;
  github: ExternalLink;
  linkedin: ExternalLink;
  /**
   * URL of the separately hosted teaching site. Leave `null` until a real site
   * exists: the teaching section then offers an email contact instead of a link.
   */
  teachingSiteUrl: string | null;
};

export type Profile = {
  headline: string;
  /** Opening paragraph(s) under the name. First person, plain language. */
  intro: string[];
  /** Short labelled facts shown next to the introduction. */
  facts: { label: string; value: string }[];
};

export type Role = {
  organisation: string;
  title: string;
  /**
   * Human readable period, e.g. "2024 – present". Leave `null` to omit it rather
   * than guess; the layout hides the period when it is missing.
   */
  period: string | null;
  summary: string;
  highlights: string[];
};

export type TechnicalGroup = {
  name: string;
  items: string[];
  /** Working practices are listed separately from technologies. */
  kind: "technology" | "practice";
};

export type Technical = {
  note: string;
  groups: TechnicalGroup[];
};

export type ProjectStatus = {
  /** Short label such as "Early development" or "Version 0.2.0". */
  label: string;
  /** Honest one sentence note on where the project stands and when that was checked. */
  note: string;
};

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  /** Context in which the project exists: personal project, thesis, course work. */
  context: string;
  problem: string;
  contribution: string;
  decisions: string[];
  status: ProjectStatus;
  stack: string[];
  links: ExternalLink[];
};

export type EducationEntry = {
  institution: string;
  degree: string;
  period: string | null;
  status: "completed" | "in progress";
  details: string[];
};

export type ResearchOutputType =
  | "paper"
  | "thesis"
  | "TDK paper"
  | "talk"
  | "report"
  | "software"
  | "other";

export type ResearchOutput = {
  title: string;
  type: ResearchOutputType;
  /** e.g. "in progress", "submitted", "accepted", "published". */
  status: string;
  /** ISO date or year; shown as given. */
  date: string;
  summary: string;
  links?: ExternalLink[];
};

export type Academic = {
  intro: string[];
  focus: { name: string; description: string }[];
  education: EducationEntry[];
  /** Rendered only when non-empty. Keep it empty until there is genuine material. */
  outputs: ResearchOutput[];
};

export type Teaching = {
  paragraphs: string[];
  /** Shown as the action when `teachingSiteUrl` is configured. */
  siteLinkLabel: string;
  /** Shown instead of the site link when no teaching site exists yet. */
  contactPrompt: string;
};

export type Personal = {
  paragraphs: string[];
};

import type { SiteConfig } from "./types";

export const site: SiteConfig = {
  name: "Mia Princz",
  role: "Software engineer",
  url: "https://mia-princz.com",
  description:
    "Mia Princz is a software engineer at Ericsson and a Computer Engineering M.Sc. student at BME, working on backend systems and studying modeling and verification.",
  email: "mia.princz.dev@gmail.com",
  github: { label: "GitHub", href: "https://github.com/Princz-Mia" },
  linkedin: {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/mia-princz-445602347/",
  },
  // Set this to the real address once the teaching site exists, for example
  // "https://teaching.example.com". Until then the teaching section shows an
  // email prompt instead of a link.
  teachingSiteUrl: null,
};

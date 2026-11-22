import type { SiteConfig } from "./types";

export const site: SiteConfig = {
  name: "Mia Princz",
  role: "Software engineer",
  url: "https://mia-princz.com",
  description:
    "Mia Princz is a software engineer at Ericsson and a Computer Engineering M.Sc. student at BME, building Java backend services and studying software architecture and distributed systems.",
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
  // CV as a PDF: path under public/, e.g. /cv/mia-princz-cv.pdf. While null the
  // hero shows no CV button.
  cvUrl: "/cv/mia-princz-cv.pdf",
};

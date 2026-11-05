import type { Profile } from "./types";

export const profile: Profile = {
  headline: "Software engineer with an interest in modeling and verification.",
  intro: [
    "I'm Mia Princz, a software engineer at Ericsson and an M.Sc. student in Computer Engineering at the Budapest University of Technology and Economics (BME).",
    "At work I build backend services in Java and the tooling that delivers and runs them. At university I study how to describe a system precisely and then check that it behaves as intended: SysML v2 modeling, formal methods and automated verification.",
  ],
  facts: [
    { label: "Now", value: "Software Engineer, Ericsson" },
    { label: "Studying", value: "M.Sc. Computer Engineering, BME" },
    { label: "Focus", value: "SysML v2, formal methods, verification" },
    { label: "Teaching", value: "Private tutor; taught Java to 60+ students" },
  ],
};

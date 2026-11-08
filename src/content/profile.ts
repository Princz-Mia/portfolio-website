import type { Profile } from "./types";

export const profile: Profile = {
  headline: "Software engineer with an interest in modeling and verification.",
  intro: [
    "I'm Mia Princz, a software engineer at Ericsson and an M.Sc. student in Computer Engineering at the Budapest University of Technology and Economics (BME).",
    "At work I build backend services in Java and the tooling that delivers and runs them. At university my major is software engineering, with architecture, cloud and distributed systems at its centre, and my thesis work explores SysML v2 modeling, formal methods and automated verification.",
  ],
  facts: [
    { label: "Now", value: "Software Engineer, Ericsson" },
    { label: "Studying", value: "M.Sc. Computer Engineering, BME" },
    {
      label: "Major · minor",
      value: "Software Engineering · Cloud-Based Distributed Systems",
    },
    { label: "Teaching", value: "Private tutor; taught Java to 60+ students" },
  ],
};

import type { Profile } from "./types";

export const profile: Profile = {
  headline: "Software engineer at Ericsson, M.Sc. student at BME.",
  intro: [
    "I build backend services in Java and the tooling that delivers and runs them. At university my major is software engineering, with architecture, cloud and distributed systems at its centre, and my thesis work explores SysML v2 modeling, formal methods and automated verification.",
    "I also teach: Java to more than 60 university students during my bachelor's, and private students since.",
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

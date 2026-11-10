import type { Profile } from "./types";

export const profile: Profile = {
  headline: "Software engineer at Ericsson, M.Sc. student at BME.",
  intro: [
    "I build backend services in Java and the tooling that delivers and runs them. My master's major is software engineering, centred on architecture, cloud and distributed systems, and I'm exploring SysML v2 modeling, formal methods and automated verification, the direction I'd like to take my thesis.",
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

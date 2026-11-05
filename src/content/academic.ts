import type { Academic } from "./types";

export const academic: Academic = {
  intro: [
    "I'm pursuing an M.Sc. in Computer Engineering at BME, with Software Engineering as my major specialization and Cloud-Based Distributed Systems as my minor. My Independent Laboratory work and thesis planning are at BME's Department of Measurement and Information Systems, and alongside them I'm taking courses from the department's Critical Systems specialization.",
    "The thread through all of it is one question: how to describe a system precisely enough that its behaviour can be checked by a tool before it runs.",
  ],
  focus: [
    {
      name: "Modeling with SysML v2",
      description:
        "Describing structure and behaviour in a language with precise semantics, so that models are something to analyse rather than only to look at.",
    },
    {
      name: "Formal methods",
      description:
        "Specifying what a system must and must not do, and reasoning about those properties with mathematical rigour.",
    },
    {
      name: "Automated verification",
      description:
        "Model checking, automated testing and related techniques that turn a specification into evidence about an implementation.",
    },
  ],
  education: [
    {
      institution: "Budapest University of Technology and Economics",
      degree: "M.Sc. in Computer Engineering",
      period: null,
      status: "in progress",
      details: [
        "Major specialization: Software Engineering",
        "Minor specialization: Cloud-Based Distributed Systems",
        "Independent Laboratory and thesis planning at the Department of Measurement and Information Systems",
        "Additional coursework from the Critical Systems specialization",
      ],
    },
    {
      institution: "Budapest University of Technology and Economics",
      degree: "B.Sc. in Computer Engineering",
      period: null,
      status: "completed",
      details: [
        "Thesis project: GourmetGo, a Spring Boot and React food ordering platform",
        "Taught Java to more than 60 university students during the degree",
      ],
    },
  ],
  // Research outputs (papers, TDK work, thesis, talks) go here once they exist.
  // Example:
  // {
  //   title: "...",
  //   type: "TDK paper",
  //   status: "submitted",
  //   date: "2027-11",
  //   summary: "...",
  //   links: [{ label: "PDF", href: "https://..." }],
  // },
  outputs: [],
};

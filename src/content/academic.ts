import type { Academic } from "./types";

export const academic: Academic = {
  intro: [
    "I'm studying for an M.Sc. in Computer Engineering at BME. I major in Software Engineering, which covers software architecture, cloud and distributed systems and the design of large systems, and minor in Cloud-Based Distributed Systems, with additional courses from the Critical Systems specialization.",
    "My Independent Laboratory is at the Department of Measurement and Information Systems, working with SysML v2 modelling, formal methods and automated verification. It is a likely direction for my thesis; the topic is not fixed yet.",
    "Outside the curriculum I keep working on the fundamentals: algorithms and data structures, SQL, optimization, mathematics and finance.",
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
        "Independent Laboratory at the Department of Measurement and Information Systems",
        "Additional coursework from the Critical Systems specialization",
      ],
    },
    {
      institution: "Budapest University of Technology and Economics",
      degree: "B.Sc. in Computer Engineering",
      period: null,
      status: "completed",
      details: [
        "Specialization: Software Engineering",
        "Thesis project: GourmetGo, a Spring Boot and React food ordering platform",
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

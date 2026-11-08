import type { Academic } from "./types";

export const academic: Academic = {
  intro: [
    "I'm pursuing an M.Sc. in Computer Engineering at BME. My major is Software Engineering, which centres on software architecture, cloud and distributed systems and the design of large systems; my minor is Cloud-Based Distributed Systems. Alongside them I'm taking courses from the Critical Systems specialization.",
    "My Independent Laboratory work and thesis planning are at BME's Department of Measurement and Information Systems, where I work with SysML v2 modeling, formal methods and automated verification.",
    "When time and energy allow, I keep sharpening the fundamentals on my own: algorithms and data structures, SQL, optimization, mathematics and finance.",
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

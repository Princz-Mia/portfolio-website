import type { Technical } from "./types";

export const technical: Technical = {
  note: "Java and the JVM ecosystem are where I have the most depth. Python and TypeScript are growing with my team's new domain, and the rest I use as the work needs it.",
  groups: [
    {
      name: "Languages",
      kind: "technology",
      items: ["Java", "Python", "TypeScript", "JavaScript", "SQL", "Bash"],
    },
    {
      name: "Backend and APIs",
      kind: "technology",
      items: [
        "Spring Boot",
        "Spring Data JPA / Hibernate",
        "GraphQL (Netflix DGS)",
        "REST",
        "FastAPI",
      ],
    },
    {
      name: "Frontend",
      kind: "technology",
      items: ["React", "TypeScript"],
    },
    {
      name: "Data",
      kind: "technology",
      items: ["MySQL", "PostgreSQL", "MongoDB", "Redis", "SQL and NoSQL design"],
    },
    {
      name: "Streaming",
      kind: "technology",
      items: ["Apache Kafka", "Apache Flink", "Avro and JSON schemas"],
    },
    {
      name: "Testing and quality",
      kind: "technology",
      items: ["JUnit 5", "Mockito", "Testcontainers", "ArchUnit", "JMeter", "SonarQube"],
    },
    {
      name: "Infrastructure and delivery",
      kind: "technology",
      items: [
        "Docker",
        "Kubernetes",
        "Helm",
        "Linux",
        "Jenkins",
        "Maven",
        "Git",
        "Gerrit",
        "GitHub",
        "Grafana",
      ],
    },
    {
      name: "Ways of working",
      kind: "practice",
      items: [
        "Agile",
        "Scrum",
        "Code review",
        "CI/CD",
        "Spec-driven development",
        "AI-assisted development",
        "Jira",
      ],
    },
  ],
};

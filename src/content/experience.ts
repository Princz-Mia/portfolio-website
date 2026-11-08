import type { Role } from "./types";

/**
 * Descriptions are deliberately general: they describe the kind of work without
 * naming internal products, teams, sites or customers.
 */
export const roles: Role[] = [
  {
    organisation: "Ericsson",
    title: "Software Engineer",
    period: null,
    summary:
      "I work on backend services in Java and on the delivery pipeline around them. My team is now moving into a new domain that brings networking, Python with FastAPI and React with TypeScript into the daily work.",
    chapters: [
      {
        name: "Test infrastructure platform",
        summary:
          "A platform of Java microservices running on Kubernetes across geo-redundant sites, with Jenkins pipelines around it.",
        highlights: [
          "On my first day I fixed and refactored the setup script of the virtual test environment, which the whole team uses to bring up a working stack.",
          "Worked on several of the platform's Java microservices, and migrated legacy KornShell scripts into Java microservices so that their logic became testable, reviewable and deployable like the rest of the platform.",
          "Owned a new database access service from design to rollout: the one service through which every other service reads and writes the database. It replaced two legacy services with a cleaner and more secure architecture and better transaction handling, shipped backward-compatibly, and I wrote the study for moving the remaining consumers over and retiring the old services.",
          "Automated logging and log clean-up for the microservices across the geo-redundant Kubernetes clusters.",
          "Made the CI/CD easier to maintain: moved inline Jenkins job scripts into the CI/CD repository, parallelised slow jobs, and automated a crontab deployment to a site that until then had been updated by hand.",
          "Maintained the database load-test workflow: support for a new site's database, version-controlled and hardened scripts, and old load tests brought back to a valid schema.",
        ],
      },
      {
        name: "Data mediation platform",
        summary:
          "Streaming data pipelines on Kafka and Flink in Java, with JSON and Avro schemas as the contracts between components.",
        highlights: [
          "Took part in the Java 11 to 17 migration, finding and proposing fixes for many of the issues it surfaced along the way.",
          "Helped with architect work, writing the functional test scenarios for several epics.",
          "Took ownership of a simulator for a new schema validation service, which the team used on test clusters for testing and demos.",
        ],
      },
    ],
  },
];

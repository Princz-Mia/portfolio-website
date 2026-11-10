import type { Role } from "./types";

/**
 * Highlights are ordered by weight: the first few are shown, the rest sit behind
 * a "more" toggle. Descriptions name no internal customers, sites or figures.
 */
export const roles: Role[] = [
  {
    organisation: "Ericsson",
    title: "Software Engineer",
    period: "2025 – present",
    summary:
      "I work on backend services in Java and on the delivery pipeline around them. My team is now moving into a new domain that brings networking, Python with FastAPI and React with TypeScript into the daily work.",
    chapters: [
      {
        name: "Test Governance Framework (TGF)",
        summary:
          "A distributed, multi-site test scheduling and orchestration engine. It runs as Java microservices on Kubernetes across geo-redundant sites, built to keep shared test resources efficiently used and test execution resilient when a site has trouble.",
        highlights: [
          "Owned a new database access service from design to rollout: the one service through which every other service reads and writes the database. It replaced two legacy services with a cleaner and more secure architecture and better transaction handling, shipped backward-compatibly, and I wrote the study for moving the remaining consumers over and retiring the old services.",
          "Worked on several of the platform's Java microservices, and migrated legacy KornShell scripts into Java microservices so that their logic became testable, reviewable and deployable like the rest of the platform.",
          "Made the CI/CD easier to maintain: moved inline job scripts into the CI/CD repository, parallelised slow jobs, and automated a crontab deployment to a site that until then had been updated by hand.",
          "Automated logging and log clean-up for the microservices across the geo-redundant Kubernetes clusters.",
          "Maintained the database load-test workflow: support for a new site's database, version-controlled and hardened scripts, and old load tests brought back to a valid schema.",
          "On my first day on the team I fixed and refactored the setup script of the virtual test environment, which everyone uses to bring up a working stack.",
        ],
      },
      {
        name: "Ericsson Telco DataOps Platform (ETDP)",
        summary:
          "Ericsson's data collection, management and governance platform for operators, the evolution of Ericsson Mediation. It turns network, IT and business data into data products across batch and real-time streams. I worked on its Java services and its Kafka and Flink pipelines with JSON and Avro schemas.",
        highlights: [
          "Fixed bugs in the platform's Java services day to day, driven by support tickets.",
          "Took part in the Java 11 to 17 migration, finding and proposing fixes for many of the issues it surfaced along the way.",
          "Took ownership of a simulator for a new schema validation service, which the team used on test clusters for testing and demos.",
          "Ran manual tests on test clusters and documented the results as test reports.",
          "Ran performance tests on the platform.",
          "Helped with architect work, writing the functional test scenarios for several epics.",
        ],
      },
    ],
  },
];

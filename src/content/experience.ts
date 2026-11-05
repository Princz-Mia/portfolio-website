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
      "Backend engineering on Java microservices and the delivery pipeline around them, on internal test infrastructure. My team is now moving into a new domain that brings networking, Python with FastAPI and React with TypeScript into day-to-day work.",
    highlights: [
      "Took ownership of a new database access service that every other service uses to reach the database. I designed and built it to replace two legacy services behind one interface, with tighter transaction handling and cleaner query and mutation paths, rolled it out backward-compatibly, and wrote the study for migrating the remaining consumers and retiring the old services.",
      "Automated logging and log clean-up for the microservices running on Kubernetes across geo-redundant sites.",
      "Moved inline Jenkins job scripts into the CI/CD repository, parallelised slow jobs, and automated a deployment that had previously been done by hand. It started on my first day, with fixing and refactoring the virtual test environment setup script.",
      "Maintained the database load-test workflow: support for a new site, version-controlled and hardened scripts, and old load tests brought back to a valid schema.",
      "Earlier, on a data mediation platform: Kafka and Flink pipelines with JSON and Avro schemas, the Java 11 to 17 migration and the issues it surfaced, functional test scenarios for several epics, and a simulator for a new schema validation service that the team used on test clusters for testing and demos.",
    ],
  },
];

import type { Role } from "./types";

/**
 * Highlights are ordered by weight: the first few are shown, the rest sit behind
 * a "more" toggle. Descriptions name no internal customers, services or sites.
 *
 * Figures follow the source they come from: measured and implemented results are
 * stated plainly, estimates say "estimated", and work that is designed but not yet
 * rolled out says so.
 */
export const roles: Role[] = [
  {
    organisation: "Ericsson",
    title: "Software Engineer",
    period: "2025 – present",
    summary:
      "Backend engineer on Ericsson's internal test infrastructure. I build Java services and their APIs, and the CI/CD that ships them. My team is now moving into a new domain, which adds networking, Python with FastAPI and React with TypeScript to the day-to-day work.",
    chapters: [
      {
        name: "Test Governance Framework (TGF)",
        summary:
          "A distributed, multi-site test scheduling and orchestration platform: Java microservices on Kubernetes across geo-redundant sites.",
        highlights: [
          "Owned the merge of two legacy microservices into one data-access service (Spring Boot, JPA) from design to release: an API that covers everything both legacy services did, fully backward compatible, shipped with 537 unit and 116 integration tests.",
          "Built a client SDK that lets consuming services switch to the new backend through configuration alone, then migrated 5 of them, verified each against the legacy responses and brought each to the 80% coverage gate on new code.",
          "Cut the SQL statements per job deletion by 44% with bulk deletes, and fixed pagination and transaction-handling slowdowns in the new service's heaviest read paths, an estimated 66–94% fewer database round trips.",
          "Found and fixed 8 defects before release, from null-pointer crashes that would have surfaced as HTTP 500s to a converter that silently dropped fields when records were archived. Each fix came with a regression test.",
          "Automated the crontab deployment to a new data-centre site through Jenkins, with the script in version control, direct SSH and per-site error handling. It is tested end to end on staging and in code review.",
          "Moving the database load-test suite into the CI repository: fixed security risks in its setup and made its test plans schema-valid.",
          "Migrated legacy KornShell scripts into Java microservices, so their logic is tested, reviewed and deployed like the rest of the platform.",
          "Automated logging and log clean-up for the microservices across the geo-redundant Kubernetes clusters.",
          "Found and fixed a JUnit 5 misconfiguration that had been silently skipping 53 tests.",
          "On my first day on the team, fixed and refactored the virtual test environment's setup script, which everyone uses to bring up a working stack.",
        ],
      },
      {
        name: "Ericsson Telco DataOps Platform (ETDP)",
        summary:
          "Ericsson's data collection, management and governance platform for operators, the evolution of Ericsson Mediation. It turns network, IT and business data into data products across batch and real-time streams. I worked on its Java services and its Kafka and Flink pipelines with JSON and Avro schemas.",
        highlights: [
          "Fixed defects in the platform's Java services, raised through support tickets.",
          "Contributed to the Java 11 to 17 migration, tracking down and proposing fixes for many of the issues it surfaced.",
          "Took ownership of a simulator for a new schema-validation service, which the team used on test clusters for testing and demos.",
          "Ran functional and performance test campaigns on test clusters and wrote up the results as test reports.",
          "Supported the architects by writing functional test scenarios for several epics.",
        ],
      },
    ],
  },
];

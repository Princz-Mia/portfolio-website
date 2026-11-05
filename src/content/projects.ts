import type { Project } from "./types";

/**
 * Only projects with public, verifiable evidence belong here. To add one, append an
 * entry; the section lays out any number of them and hides itself when the list is
 * empty. Keep `status.note` honest and dated.
 */
export const projects: Project[] = [
  {
    slug: "mini-stock-exchange",
    name: "Mini stock exchange",
    tagline:
      "A simulated, browser-based stock exchange where people and Python bots trade virtual cash and shares.",
    context: "Personal project",
    problem:
      "Build a small but realistic trading venue end to end: order entry, matching, risk and settlement, plus public market data, with prices emerging from executions against a limit order book rather than from an external feed.",
    contribution:
      "I design and build all of it: the Java services, the Flink analytics job, the React terminal, the Python bots and the Compose-based runtime.",
    decisions: [
      "Orders, matching, risk and settlement commit in one database transaction in the execution service. A separate market-data service rebuilds public data from events.",
      "Each service owns its database, and Kafka sits downstream of the commit. Trading keeps working if Kafka or Flink is down; public data goes stale until they return.",
      "A Flink job turns trades into one-minute candles. Avro schemas shared between the Java modules are the contract between services.",
      "Tests run against real PostgreSQL with Testcontainers, ArchUnit guards the module boundaries, and the terminal and bots have their own Vitest and pytest suites.",
    ],
    status: {
      label: "Early development",
      note: "As of November 2026 the services build and run and login works through the API; the matching engine and the trading terminal are not built yet.",
    },
    stack: [
      "Java 25",
      "Spring Boot",
      "PostgreSQL",
      "Apache Kafka",
      "Apache Flink",
      "Avro",
      "React",
      "TypeScript",
      "Python",
      "Docker Compose",
    ],
    links: [
      {
        label: "Source on GitHub",
        href: "https://github.com/Princz-Mia/mini-stock-exchange",
      },
    ],
  },
  {
    slug: "gourmetgo",
    name: "GourmetGo",
    tagline:
      "A food ordering web application for customers, restaurants and administrators, built as my B.Sc. thesis project at BME.",
    context: "B.Sc. thesis project",
    problem:
      "One platform for three kinds of users: customers browse menus, order and collect reward points; restaurants manage menus, orders and promotions and read their own analytics; administrators oversee accounts and the platform as a whole.",
    contribution:
      "My thesis project, built on my own: a Spring Boot backend and a React frontend, from data model and security to the dashboards.",
    decisions: [
      "JWT authentication with refresh tokens and Redis-backed sessions, with role-based access control across the API and the routes.",
      "WebSocket endpoints for real-time chat and order status updates alongside the REST API.",
      "A layered Spring Boot application with structured logging, email integration and PDF report generation for restaurants.",
    ],
    status: {
      label: "Version 0.2.0",
      note: "Released December 2025 under the GPL-3.0 licence; further extension is planned.",
    },
    stack: [
      "Java 17",
      "Spring Boot 3",
      "Spring Security",
      "PostgreSQL",
      "Redis",
      "React 19",
      "Tailwind CSS",
    ],
    links: [
      {
        label: "Source on GitHub",
        href: "https://github.com/Princz-Mia/viaual04-gourmetgo",
      },
    ],
  },
];

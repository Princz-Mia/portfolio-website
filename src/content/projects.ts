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
    summary:
      "Everyone trades through the same API and rules, and prices emerge from executions against a price-time-priority limit order book. I design and build all of it: the Java services, the Flink analytics job, the React terminal, the Python bots and the Compose-based runtime.",
    decisions: [
      "Orders, matching, risk and settlement commit in one database transaction; a separate service rebuilds public market data from events.",
      "Each service owns its database and Kafka sits downstream of the commit, so trading keeps working when Kafka or Flink is down.",
      "Tests run against real PostgreSQL with Testcontainers, and ArchUnit guards the module boundaries.",
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
      "A food ordering web application for customers, restaurants and administrators.",
    context: "B.Sc. thesis project",
    summary:
      "My bachelor's thesis at BME, built on my own: a Spring Boot backend and a React frontend, from the data model and security to the restaurant dashboards. Customers browse and order, restaurants manage menus, orders and promotions, and administrators oversee the platform.",
    decisions: [
      "JWT authentication with refresh tokens and Redis-backed sessions, with role-based access across the API and the routes.",
      "WebSocket endpoints for real-time chat and order status updates next to the REST API.",
      "PDF report generation and analytics dashboards for restaurants.",
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

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Project } from "@/content";
import { Projects } from "./Projects";

const project: Project = {
  slug: "example",
  name: "Example project",
  tagline: "A short tagline.",
  context: "Personal project",
  problem: "The problem.",
  contribution: "My part.",
  decisions: ["One decision."],
  status: { label: "Early development", note: "Checked in November 2026." },
  stack: ["Java", "PostgreSQL"],
  links: [{ label: "Source on GitHub", href: "https://github.com/example/example" }],
};

describe("Projects", () => {
  it("renders nothing when there are no projects", () => {
    const { container } = render(<Projects projects={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each project with its status and link", () => {
    render(<Projects projects={[project]} />);

    expect(screen.getByRole("heading", { name: "Selected projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Example project" })).toBeInTheDocument();
    expect(screen.getByText("Early development")).toBeInTheDocument();
    expect(screen.getByText("Checked in November 2026.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Source on GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/example/example",
    );
  });
});

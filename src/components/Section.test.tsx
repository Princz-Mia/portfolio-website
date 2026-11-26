import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Section } from "./Section";

describe("Section", () => {
  it("shows the number and short label above a separate big title", () => {
    render(
      <Section id="work" number="01" label="Work" title="Experience">
        <p>Body</p>
      </Section>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Experience" });
    expect(heading).toHaveAttribute("id", "work-title");
    expect(screen.getByText("01")).toBeInTheDocument();
    const label = screen.getByText("Work");
    expect(label).not.toBe(heading);
    expect(label.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("names the region after the big title", () => {
    render(
      <Section id="contact" number="06" label="Contact" title="Reach out">
        <p>Body</p>
      </Section>,
    );

    expect(screen.getByRole("region", { name: "Reach out" })).toHaveAttribute("id", "contact");
  });

  it("marks the illustration size so compact drawings can stay clear of the text", () => {
    const { rerender } = render(
      <Section id="projects" number="03" label="Projects" title="Portfolio" art={<svg />}>
        <p>Body</p>
      </Section>,
    );
    expect(screen.getByRole("region", { name: "Portfolio" })).toHaveAttribute("data-art-size", "default");

    rerender(
      <Section id="projects" number="03" label="Projects" title="Portfolio" art={<svg />} artSize="compact">
        <p>Body</p>
      </Section>,
    );
    expect(screen.getByRole("region", { name: "Portfolio" })).toHaveAttribute("data-art-size", "compact");
  });
});

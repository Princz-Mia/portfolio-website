import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeachingAction } from "./Teaching";

const base = {
  email: "someone@example.com",
  siteLinkLabel: "Visit my teaching site",
  contactPrompt: "No site yet, email instead.",
};

describe("TeachingAction", () => {
  it("links to the teaching site when a URL is configured", () => {
    render(<TeachingAction {...base} teachingSiteUrl="https://teaching.example.com" />);

    const link = screen.getByRole("link", { name: "Visit my teaching site" });
    expect(link).toHaveAttribute("href", "https://teaching.example.com");
    expect(screen.queryByText(base.contactPrompt)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /email me/i })).not.toBeInTheDocument();
  });

  it("offers an email contact when no teaching site exists", () => {
    render(<TeachingAction {...base} teachingSiteUrl={null} />);

    expect(screen.getByText(base.contactPrompt)).toBeInTheDocument();
    const email = screen.getByRole("link", { name: /email me about teaching/i });
    expect(email.getAttribute("href")).toMatch(/^mailto:someone@example\.com/);
    expect(screen.queryByRole("link", { name: "Visit my teaching site" })).not.toBeInTheDocument();
  });

  it("never renders a placeholder link", () => {
    render(<TeachingAction {...base} teachingSiteUrl={null} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toBe("#");
    }
  });
});

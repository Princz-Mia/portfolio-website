import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Profile, SiteConfig } from "@/content";
import { Intro } from "./Intro";

const site: SiteConfig = {
  name: "Mia Princz",
  role: "Software engineer",
  url: "https://example.com",
  description: "A description.",
  email: "someone@example.com",
  github: { label: "GitHub", href: "https://github.com/example" },
  linkedin: { label: "LinkedIn", href: "https://www.linkedin.com/in/example/" },
  teachingSiteUrl: null,
  cvUrl: null,
};

const profile: Profile = {
  headline: "A headline.",
  intro: ["An opening paragraph."],
};

const heroLinks = () =>
  within(screen.getByRole("list", { name: "Find me elsewhere" })).getAllByRole("link");

describe("Intro", () => {
  it("links to LinkedIn and GitHub in new tabs, LinkedIn first and primary", () => {
    render(<Intro site={site} profile={profile} />);

    const links = heroLinks();
    expect(links).toHaveLength(2);

    const [linkedin, github] = links;
    expect(linkedin).toHaveAccessibleName("LinkedIn (opens in a new tab)");
    expect(linkedin).toHaveAttribute("href", site.linkedin.href);
    expect(linkedin).toHaveClass("button--primary");
    expect(github).toHaveAccessibleName("GitHub (opens in a new tab)");
    expect(github).toHaveAttribute("href", site.github.href);
    expect(github).not.toHaveClass("button--primary");

    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
  });

  it("shows no teaching or CV link while their addresses are not set", () => {
    render(<Intro site={site} profile={profile} />);

    expect(screen.queryByRole("link", { name: /teaching/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /\bCV\b/ })).not.toBeInTheDocument();
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toBe("#");
    }
  });

  it("adds the teaching site and the CV once they are set", () => {
    render(
      <Intro
        site={{ ...site, teachingSiteUrl: "https://teaching.example.com", cvUrl: "/cv/cv.pdf" }}
        profile={profile}
      />,
    );

    const links = heroLinks();
    expect(links).toHaveLength(4);

    const teaching = screen.getByRole("link", { name: "Teaching site (opens in a new tab)" });
    expect(teaching).toHaveAttribute("href", "https://teaching.example.com");
    expect(teaching).toHaveAttribute("target", "_blank");

    const cv = screen.getByRole("link", { name: "CV (PDF, opens in a new tab)" });
    expect(cv).toHaveAttribute("href", "/cv/cv.pdf");
    expect(cv).toHaveAttribute("target", "_blank");
    expect(cv).not.toHaveAttribute("download");
  });

  it("no longer offers a scroll cue", () => {
    render(<Intro site={site} profile={profile} />);
    expect(screen.queryByText(/scroll to my work/i)).not.toBeInTheDocument();
  });
});

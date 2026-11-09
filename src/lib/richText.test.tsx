import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RichText, extractLinks, plainText } from "./richText";

describe("RichText", () => {
  it("renders inline links inside a sentence", () => {
    render(
      <p>
        <RichText text="I play on [Quelthara](https://example.com/q), for the Horde." />
      </p>,
    );
    const link = screen.getByRole("link", { name: "Quelthara" });
    expect(link).toHaveAttribute("href", "https://example.com/q");
    expect(screen.getByText(/for the Horde/)).toBeInTheDocument();
  });

  it("renders plain text unchanged", () => {
    render(<p><RichText text="No links here." /></p>);
    expect(screen.getByText("No links here.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("extracts link targets and strips markup", () => {
    const text = "See [a](https://a.example) and [b](https://b.example).";
    expect(extractLinks(text)).toEqual(["https://a.example", "https://b.example"]);
    expect(plainText(text)).toBe("See a and b.");
  });
});

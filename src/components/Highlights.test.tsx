import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Highlights } from "./Highlights";

const items = ["one", "two", "three", "four", "five"];

describe("Highlights", () => {
  it("shows the first items and folds the rest behind a disclosure", () => {
    const { container } = render(<Highlights items={items} visible={3} moreLabel="from X" />);

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("2 more from X")).toBeInTheDocument();
    for (const item of items) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    expect(details?.textContent).toContain("four");
    expect(details?.textContent).not.toContain("one");
  });

  it("renders no disclosure when everything fits", () => {
    const { container } = render(<Highlights items={["a", "b"]} visible={3} />);
    expect(container.querySelector("details")).toBeNull();
  });
});

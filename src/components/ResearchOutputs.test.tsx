import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResearchOutputs } from "./ResearchOutputs";

describe("ResearchOutputs", () => {
  it("renders nothing while there are no outputs", () => {
    const { container } = render(<ResearchOutputs outputs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders populated entries with their links", () => {
    render(
      <ResearchOutputs
        outputs={[
          {
            title: "A model-based study",
            type: "TDK paper",
            status: "submitted",
            date: "2027-11",
            summary: "Short summary.",
            links: [{ label: "PDF", href: "https://example.com/paper.pdf" }],
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Research outputs" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A model-based study" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /PDF/ })).toHaveAttribute(
      "href",
      "https://example.com/paper.pdf",
    );
  });
});

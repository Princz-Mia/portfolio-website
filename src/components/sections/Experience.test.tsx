import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImpactFigures } from "./Experience";

describe("ImpactFigures", () => {
  it("pairs each value with its label", () => {
    render(
      <ImpactFigures
        label="Impact at TGF"
        figures={[
          { value: "−44%", label: "SQL statements per job deletion" },
          { value: "5", label: "consumer services migrated" },
        ]}
      />,
    );

    const list = screen.getByLabelText("Impact at TGF");
    expect(list.tagName).toBe("DL");
    const terms = list.querySelectorAll("dt");
    const values = list.querySelectorAll("dd");
    expect([...terms].map((t) => t.textContent)).toEqual([
      "SQL statements per job deletion",
      "consumer services migrated",
    ]);
    expect([...values].map((v) => v.textContent)).toEqual(["−44%", "5"]);
  });

  it("renders nothing without figures", () => {
    const { container } = render(<ImpactFigures label="Impact" figures={undefined} />);
    expect(container).toBeEmptyDOMElement();

    const empty = render(<ImpactFigures label="Impact" figures={[]} />);
    expect(empty.container).toBeEmptyDOMElement();
  });
});

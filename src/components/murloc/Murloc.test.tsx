import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const playMurlocGurgle = vi.fn(() => true);
vi.mock("@/lib/sound", () => ({ playMurlocGurgle: () => playMurlocGurgle() }));

const { Murloc, MURLOC_CALLS, MURLOC_LABEL, JUMP_MS } = await import("./Murloc");

const murlocButton = () => screen.getByRole("button", { name: MURLOC_LABEL });

describe("Murloc", () => {
  beforeEach(() => {
    playMurlocGurgle.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is only a still drawing in the server HTML", () => {
    const html = renderToString(<Murloc />);
    expect(html).toContain("<svg");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("data-ready");
  });

  it("renders its button after mount, named after its visible hint", () => {
    render(<Murloc />);
    const button = murlocButton();
    expect(button).toHaveAttribute("type", "button");
    expect(button.closest("[data-ready]")).not.toBeNull();
  });

  it("jumps, shows a speech bubble and gurgles when clicked", () => {
    vi.useFakeTimers();
    render(<Murloc />);
    fireEvent.click(murlocButton());

    expect(playMurlocGurgle).toHaveBeenCalledTimes(1);
    expect(murlocButton().closest("[data-jump]")).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(MURLOC_CALLS[0]);
    expect(screen.getAllByText(MURLOC_CALLS[0]).length).toBeGreaterThanOrEqual(1);

    act(() => {
      vi.advanceTimersByTime(JUMP_MS);
    });
    expect(murlocButton().closest("[data-jump]")).toBeNull();
    expect(screen.queryByText(MURLOC_CALLS[0], { selector: "span" })).toBeNull();
  });

  it("says something different on each click", () => {
    vi.useFakeTimers();
    render(<Murloc />);
    const heard = MURLOC_CALLS.map(() => {
      fireEvent.click(murlocButton());
      return screen.getByRole("status").textContent;
    });
    expect(heard).toEqual([...MURLOC_CALLS]);
    expect(playMurlocGurgle).toHaveBeenCalledTimes(MURLOC_CALLS.length);
  });

  it("clears its timer when unmounted", () => {
    vi.useFakeTimers();
    const { unmount } = render(<Murloc />);
    fireEvent.click(murlocButton());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

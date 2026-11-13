import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BongoCat } from "./BongoCat";

const moodOf = () =>
  screen
    .getByRole("img", { name: /cat with headphones/i })
    .closest("[data-mood]")
    ?.getAttribute("data-mood");

const petButton = () => screen.getByRole("button", { name: "Pet the cat" });

const pet = (times: number) => {
  for (let i = 0; i < times; i += 1) {
    fireEvent.click(petButton());
  }
};

describe("BongoCat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a named drawing with a pet button", () => {
    render(<BongoCat />);

    expect(screen.getByRole("img", { name: /cat with headphones/i })).toBeInTheDocument();
    expect(petButton().tagName).toBe("BUTTON");
    expect(moodOf()).toBe("calm");
  });

  it("renders only the still drawing on the server", () => {
    const html = renderToString(<BongoCat />);

    expect(html).toContain("<svg");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("pet the cat");
  });

  it("closes its eyes briefly when petted", () => {
    render(<BongoCat />);

    pet(1);
    expect(moodOf()).toBe("happy");

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(moodOf()).toBe("calm");
  });

  it("squeezes its eyes shut after three quick pets", () => {
    render(<BongoCat />);

    pet(3);
    expect(moodOf()).toBe("giddy");
  });

  it("starts a new streak when pets are far apart", () => {
    render(<BongoCat />);

    pet(2);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    pet(1);
    expect(moodOf()).toBe("happy");
  });

  it("gets grumpy after five quick pets, ignores pets meanwhile, then calms down", () => {
    render(<BongoCat />);

    pet(5);
    expect(moodOf()).toBe("grumpy");
    expect(screen.getByText("#$!")).toBeInTheDocument();

    pet(1);
    expect(moodOf()).toBe("grumpy");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(moodOf()).toBe("calm");
    expect(screen.queryByText("#$!")).not.toBeInTheDocument();
  });

  it("clears its timers when unmounted", () => {
    const { unmount } = render(<BongoCat />);

    pet(5);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("hides the hint after the first pet", () => {
    render(<BongoCat />);

    const hint = screen.getByText("psst: pet the cat");
    expect(hint).not.toHaveAttribute("data-gone");

    pet(1);
    expect(hint).toHaveAttribute("data-gone");
  });
});

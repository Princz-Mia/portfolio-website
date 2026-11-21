import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeskScene, HOT_WORDS } from "./DeskScene";
import { BREW, BREW_MS } from "./CoffeeWindow";
import {
  ART_SCREEN,
  ART_VIEWBOX,
  BONSAI_BOX,
  MUG_BOX,
  NOTE_BOX,
  WorkArt,
} from "@/components/illustrations/WorkArt";

// The windows read the desk content when they render, so a test can set a
// support page.
const content = vi.hoisted(() => ({
  desk: {
    notePassword: "y0u-g0t-th1s",
    lockedFolder: "cats",
    supportUrl: null as string | null,
  },
}));

vi.mock("@/content", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/content")>();
  return { ...actual, desk: content.desk };
});

const mugButton = () => screen.getByRole("button", { name: "Touch the coffee mug" });
const noteButton = () => screen.getByRole("button", { name: "Read the sticky note" });

const touchMug = (times: number) => {
  for (let i = 0; i < times; i += 1) fireEvent.click(mugButton());
};

const openDialog = (container: HTMLElement) => container.querySelector("dialog[open]");

const renderScene = () =>
  render(
    <DeskScene>
      <svg />
    </DeskScene>,
  );

/** Lets the brew run to the end, one line at a time. */
const brew = () => {
  for (const step of BREW) {
    act(() => {
      vi.advanceTimersByTime(step.wait);
    });
  }
};

describe("coffee mug", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    content.desk.supportUrl = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("gets hot on each touch, saying a word in turn", () => {
    const { container } = renderScene();
    const scene = container.querySelector('[data-scene="desk"]');

    touchMug(1);
    expect(scene).toHaveAttribute("data-mug", "a");
    expect(screen.getByText(HOT_WORDS[0])).toBeInTheDocument();

    touchMug(1);
    expect(scene).toHaveAttribute("data-mug", "b");
    expect(screen.getByText(HOT_WORDS[1])).toBeInTheDocument();
    expect(openDialog(container)).toBeNull();
  });

  it("opens the coffee window on the third touch", () => {
    const { container } = renderScene();

    touchMug(2);
    expect(openDialog(container)).toBeNull();

    touchMug(1);
    expect(screen.getByText(HOT_WORDS[2])).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "coffee.jar" });
    expect(dialog).toHaveAttribute("open");
  });

  it("keeps the coffee window one size, with the log scrolling inside it", () => {
    renderScene();
    touchMug(3);
    const dialog = screen.getByRole("dialog", { name: "coffee.jar" });
    expect(dialog).toHaveAttribute("data-size", "fixed");

    brew();

    // The log is the scrolling part, reachable by keyboard; the closing lines
    // and the button come after it, outside the scrolling area.
    const log = within(dialog).getByRole("log", { name: "coffee.jar output" });
    expect(log).toHaveAttribute("tabindex", "0");
    const close = within(dialog).getByRole("button", { name: "Close" });
    expect(log.contains(close)).toBe(false);
    expect(log.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("brews line by line, and offers no payment link without a support page", () => {
    renderScene();
    touchMug(3);
    const dialog = screen.getByRole("dialog", { name: "coffee.jar" });

    expect(within(dialog).queryByText(BREW[BREW.length - 1].text)).toBeNull();

    brew();

    expect(within(dialog).getByText(BREW[0].text)).toBeInTheDocument();
    expect(within(dialog).getByText(BREW[BREW.length - 1].text)).toBeInTheDocument();
    expect(within(dialog).getByText(/No tip jar yet/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("link")).toBeNull();
    expect(dialog.querySelector("a")).toBeNull();
  });

  it("links to the support page when one is set", () => {
    content.desk.supportUrl = "https://example.com/mia";
    renderScene();
    touchMug(3);
    brew();

    const link = within(screen.getByRole("dialog", { name: "coffee.jar" })).getByRole("link", {
      name: /^Buy me a coffee/,
    });
    expect(link).toHaveAttribute("href", "https://example.com/mia");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("shows the whole brew at once without motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("reduce"),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    renderScene();
    touchMug(3);

    const dialog = screen.getByRole("dialog", { name: "coffee.jar" });
    expect(within(dialog).getByText(BREW[BREW.length - 1].text)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes, gives the focus back to the mug, and opens again every third touch", () => {
    const { container } = renderScene();
    touchMug(3);
    brew();

    fireEvent.click(
      within(screen.getByRole("dialog", { name: "coffee.jar" })).getByRole("button", {
        name: "Close",
      }),
    );
    expect(openDialog(container)).toBeNull();
    expect(document.activeElement).toBe(mugButton());

    touchMug(2);
    expect(openDialog(container)).toBeNull();
    touchMug(1);
    expect(openDialog(container)).not.toBeNull();

    // The brew starts over.
    expect(within(screen.getByRole("dialog", { name: "coffee.jar" })).queryByText(/No tip jar/)).toBeNull();
  });

  it("stops brewing when the window closes mid-brew", () => {
    const { container } = renderScene();
    touchMug(3);
    act(() => {
      vi.advanceTimersByTime(BREW[0].wait);
    });

    fireEvent.click(screen.getByRole("button", { name: "Close coffee.jar" }));

    expect(openDialog(container)).toBeNull();
    expect(container.querySelector("ol")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(BREW_MS);
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(openDialog(container)).toBeNull();
  });
});

describe("sticky note", () => {
  it("opens up close with the password written on it", () => {
    const { container } = render(
      <DeskScene>
        <svg />
      </DeskScene>,
    );

    fireEvent.click(noteButton());

    const dialog = screen.getByRole("dialog", { name: "note to self" });
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByText("y0u-g0t-th1s")).toBeInTheDocument();
    expect(within(dialog).getByText(/password:/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close the note" }));
    expect(openDialog(container)).toBeNull();
    expect(document.activeElement).toBe(noteButton());
  });
});

describe("desk touch targets", () => {
  const overlapsScreen = (box: { x: number; y: number; w: number; h: number }) =>
    box.x < ART_SCREEN.x + ART_SCREEN.w &&
    box.x + box.w > ART_SCREEN.x &&
    box.y < ART_SCREEN.y + ART_SCREEN.h &&
    box.y + box.h > ART_SCREEN.y;

  it("keep clear of the laptop's screen, which opens the terminal", () => {
    expect(overlapsScreen(MUG_BOX)).toBe(false);
  });

  it("keep the turned sticky note above the screen", () => {
    const cy = NOTE_BOX.y + NOTE_BOX.h / 2;
    const angle = (NOTE_BOX.rotate * Math.PI) / 180;
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([sx, sy]) => {
      const dx = (sx * NOTE_BOX.w) / 2;
      const dy = (sy * NOTE_BOX.h) / 2;
      return cy + dx * Math.sin(angle) + dy * Math.cos(angle);
    });

    expect(Math.max(...corners)).toBeLessThan(ART_SCREEN.y);
  });
});

describe("desk drawing", () => {
  it("has a bonsai on the desk and no Lich King", () => {
    const { container } = render(
      <DeskScene>
        <WorkArt />
      </DeskScene>,
    );

    expect(container.querySelector('[data-part="bonsai"]')).not.toBeNull();
    expect(container.querySelector('[data-part="lich"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /Lich King/ })).toBeNull();
    expect(container.querySelector("[data-lich]")).toBeNull();
    expect(screen.getByRole("button", { name: "Read the sticky note" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Touch the coffee mug" })).toBeInTheDocument();
  });

  it("keeps the bonsai out of the strip under the text column and clear of the screen", () => {
    // On wide screens up to about 13% of the drawing's width sits under the
    // section's text column.
    expect((BONSAI_BOX.x - ART_VIEWBOX.x) / ART_VIEWBOX.w).toBeGreaterThan(0.14);
    expect(BONSAI_BOX.x + BONSAI_BOX.w).toBeLessThanOrEqual(ART_SCREEN.x);
  });
});

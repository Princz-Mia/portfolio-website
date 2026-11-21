import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_EVENT, THEME_KEY, ThemeToggle } from "./ThemeToggle";

const root = document.documentElement;

beforeEach(() => {
  window.localStorage.clear();
  root.dataset.theme = "light";
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete root.dataset.theme;
  root.classList.remove("theme-switching");
});

describe("ThemeToggle", () => {
  it("offers the dark theme while the page is light", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });

  it("offers the light theme while the page is dark", () => {
    root.dataset.theme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("switches the page theme and remembers the choice", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(root.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");

    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(root.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });

  it("tells other components about the switch", () => {
    const heard: unknown[] = [];
    const listener = (e: Event) => heard.push((e as CustomEvent).detail);
    window.addEventListener(THEME_EVENT, listener);
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    window.removeEventListener(THEME_EVENT, listener);
    expect(heard).toEqual([{ theme: "dark" }]);
  });

  it("still switches when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(root.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("cross-fades briefly and then lets go of the page", () => {
    vi.useFakeTimers();
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(root).toHaveClass("theme-switching");
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(root).not.toHaveClass("theme-switching");
  });

  it("follows a theme changed elsewhere on the page", () => {
    render(<ThemeToggle />);
    act(() => {
      root.dataset.theme = "dark";
      window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: "dark" } }));
    });
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("follows a switch made in another tab", () => {
    render(<ThemeToggle />);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY, newValue: "dark" }));
    });
    expect(root.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("ignores other stored values from other tabs", () => {
    render(<ThemeToggle />);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "something-else", newValue: "dark" }));
    });
    expect(root.dataset.theme).toBe("light");
  });

  it("stops listening to other tabs once it is gone", () => {
    const { unmount } = render(<ThemeToggle />);
    unmount();
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY, newValue: "dark" }));
    expect(root.dataset.theme).toBe("light");
  });
});

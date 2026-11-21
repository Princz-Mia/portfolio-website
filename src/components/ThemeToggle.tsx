"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.css";

export type Theme = "light" | "dark";

/** localStorage key for the visitor's choice; the inline head script reads it too. */
export const THEME_KEY = "theme";

/** Dispatched on window after the theme changes, with `{ theme }` as its detail. */
export const THEME_EVENT = "themechange";

/** How long the cross-fade class stays on <html> after a switch. */
const SWITCH_MS = 320;

const DARK_QUERY = "(prefers-color-scheme: dark)";

const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

function systemTheme(): Theme {
  return typeof window.matchMedia === "function" && window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** The theme the page shows now: the attribute the head script set, else the system's. */
export function currentTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : systemTheme();
}

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Shows `theme` on the page and tells the components that draw in colour. */
function showTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

const getServerSnapshot = () => null;

function SunIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.2" className={styles.fill} />
      <path
        d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.35 5.35l1.55 1.55M17.1 17.1l1.55 1.55M5.35 18.65l1.55-1.55M17.1 6.9l1.55-1.55"
        className={styles.rays}
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M19.6 14.6A8 8 0 0 1 9.4 4.4a8 8 0 1 0 10.2 10.2Z" className={styles.fill} />
      <path d="M17 3.2l.55 1.45L19 5.2l-1.45.55L17 7.2l-.55-1.45L15 5.2l1.45-.55Z" className={styles.star} />
    </svg>
  );
}

/**
 * Switches between the light and the dark theme. The page's theme is set before
 * the first paint by the head script, so this only renders once it can read it;
 * until then an empty box of the same size holds its place in the header.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, getServerSnapshot);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The icon turns in only after a switch, not when it first appears.
  const [switched, setSwitched] = useState(false);

  // Follows the system theme while the visitor has not picked one, and a
  // switch made in another tab of the site.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY && event.key !== null) return;
      const value = event.key === null ? null : event.newValue;
      const next = isTheme(value) ? value : systemTheme();
      if (next !== currentTheme()) showTheme(next);
    };
    window.addEventListener("storage", onStorage);

    const query = typeof window.matchMedia === "function" ? window.matchMedia(DARK_QUERY) : null;
    const onSystemChange = () => {
      if (!storedTheme()) showTheme(systemTheme());
    };
    query?.addEventListener?.("change", onSystemChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      query?.removeEventListener?.("change", onSystemChange);
    };
  }, []);

  useEffect(
    () => () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      document.documentElement.classList.remove("theme-switching");
    },
    [],
  );

  if (!theme) {
    return <span className={`${styles.toggle} ${styles.placeholder} ${className}`} aria-hidden="true" />;
  }

  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    const root = document.documentElement;
    if (!prefersReducedMotion()) {
      root.classList.add("theme-switching");
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => {
        fadeTimer.current = null;
        root.classList.remove("theme-switching");
      }, SWITCH_MS);
    }
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage can be blocked; the switch still holds for this page view.
    }
    setSwitched(true);
    showTheme(next);
  };

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className}`}
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-switched={switched ? "" : undefined}
    >
      <span key={theme} className={styles.swap}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}

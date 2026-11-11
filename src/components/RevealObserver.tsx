"use client";

import { useEffect } from "react";

/**
 * Fades `.reveal` elements in as they scroll into view. Only elements that start
 * below the fold are ever hidden, so nothing visible flickers on load, and
 * without script or with reduced motion everything is simply shown.
 */
export function RevealObserver() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal--pending");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const fold = window.innerHeight * 0.92;
    for (const element of document.querySelectorAll<HTMLElement>(".reveal")) {
      if (element.getBoundingClientRect().top > fold) {
        element.classList.add("reveal--pending");
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, []);

  return null;
}

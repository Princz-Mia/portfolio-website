import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatPhoto } from "@/content";
import {
  PERSONAL_BOXES,
  PERSONAL_POINTS,
  PERSONAL_VIEW,
  PersonalArt,
  type ArtBox,
} from "@/components/illustrations/PersonalArt";
import { PersonalScene, PETS_FOR_SURPRISE } from "./PersonalScene";

const sound = vi.hoisted(() => ({
  playPurr: vi.fn(() => true),
  playHordeHorn: vi.fn(() => true),
}));

vi.mock("@/lib/sound", () => ({
  HORN_SECONDS: 2.6,
  playPurr: sound.playPurr,
  playHordeHorn: sound.playHordeHorn,
}));

const photos: CatPhoto[] = [
  { src: "/cats/one.jpg", alt: "A grey cat on a sofa", width: 800, height: 600, caption: "Nap time" },
  { src: "/cats/two.jpg", alt: "A cat in a box", width: 600, height: 800 },
];

function renderScene(catPhotos: CatPhoto[] = []) {
  return render(
    <PersonalScene catPhotos={catPhotos} hornSrc={null}>
      <PersonalArt />
    </PersonalScene>,
  );
}

beforeEach(() => {
  sound.playPurr.mockClear();
  sound.playHordeHorn.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PersonalScene", () => {
  it("offers the five interactions once mounted", () => {
    renderScene();
    expect(screen.getByRole("button", { name: "Grab a handful of popcorn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Poke the Lich King figure" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pet the cat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sound the Horde war horn" })).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: "Raider.IO: open my World of Warcraft character (opens in a new tab)",
    });
    expect(link).toHaveAttribute("href", "https://raider.io/characters/eu/ragnaros/Quelthara");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("keeps the still drawing inside the scene", () => {
    renderScene();
    expect(
      screen.getByRole("img", { name: /Horde war banner/ }),
    ).toBeInTheDocument();
  });

  it("spills popcorn on each grab, up to a limit", () => {
    const { container } = renderScene();
    const bucket = screen.getByRole("button", { name: "Grab a handful of popcorn" });
    expect(container.querySelectorAll("[data-kernel]")).toHaveLength(0);

    fireEvent.click(bucket);
    const first = container.querySelectorAll("[data-kernel]").length;
    expect(first).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-kernel="spill"]').length).toBeGreaterThan(0);

    fireEvent.click(bucket);
    expect(container.querySelectorAll("[data-kernel]").length).toBeGreaterThan(first);

    for (let i = 0; i < 10; i++) fireEvent.click(bucket);
    expect(container.querySelectorAll("[data-kernel]").length).toBeLessThanOrEqual(40);
  });

  it("clears the popcorn after a few seconds", () => {
    vi.useFakeTimers();
    const { container } = renderScene();
    fireEvent.click(screen.getByRole("button", { name: "Grab a handful of popcorn" }));
    expect(container.querySelectorAll("[data-kernel]").length).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(container.querySelectorAll("[data-kernel]")).toHaveLength(0);
  });

  it("purrs and sends up hearts when the cat is petted", () => {
    const { container } = renderScene();
    fireEvent.click(screen.getByRole("button", { name: "Pet the cat" }));
    expect(sound.playPurr).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("[data-heart]").length).toBeGreaterThan(0);
    expect(container.querySelector('[data-scene="personal"]')).toHaveAttribute(
      "data-purring",
      "true",
    );
  });

  it("does not open a photo dialog after enough pets when there are no photos", () => {
    const { container } = renderScene([]);
    const cat = screen.getByRole("button", { name: "Pet the cat" });
    for (let i = 0; i < PETS_FOR_SURPRISE; i++) fireEvent.click(cat);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelector("dialog")).toBeNull();
    // A bigger burst of hearts instead.
    expect(container.querySelectorAll("[data-heart]").length).toBeGreaterThan(10);
  });

  it("shows the cat photos after enough pets and closes back to the cat", () => {
    renderScene(photos);
    const cat = screen.getByRole("button", { name: "Pet the cat" });
    for (let i = 0; i < PETS_FOR_SURPRISE - 1; i++) fireEvent.click(cat);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(cat);
    const dialog = screen.getByRole("dialog", { name: "You found the cats" });
    expect(dialog).toHaveAttribute("open");

    const images = screen.getAllByRole("img", { name: /cat/i }).filter(
      (image) => image.tagName === "IMG",
    );
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("loading", "lazy");
    expect(images[0]).toHaveAttribute("width", "800");
    expect(screen.getByText("Nap time")).toBeInTheDocument();

    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cat).toHaveFocus();
  });

  it("sounds the war horn once until it has finished", () => {
    vi.useFakeTimers();
    const { container } = renderScene();
    const banner = screen.getByRole("button", { name: "Sound the Horde war horn" });
    fireEvent.click(banner);
    fireEvent.click(banner);
    expect(sound.playHordeHorn).toHaveBeenCalledTimes(1);
    expect(sound.playHordeHorn).toHaveBeenCalledWith(null);
    expect(container.querySelector('[data-scene="personal"]')).toHaveAttribute("data-horn", "true");

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(container.querySelector('[data-scene="personal"]')).not.toHaveAttribute("data-horn");
    fireEvent.click(banner);
    expect(sound.playHordeHorn).toHaveBeenCalledTimes(2);
  });

  it("hides the hint after the first interaction", () => {
    renderScene();
    const hint = screen.getByText("psst: everything here is clickable");
    expect(hint).not.toHaveAttribute("data-hidden");
    fireEvent.click(screen.getByRole("button", { name: "Pet the cat" }));
    expect(hint).toHaveAttribute("data-hidden", "true");
  });
});

describe("PersonalScene hotspots", () => {
  const boxes = Object.entries(PERSONAL_BOXES) as [string, ArtBox][];
  const overlaps = (a: ArtBox, b: ArtBox) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

  it("do not overlap one another", () => {
    for (const [i, [nameA, a]] of boxes.entries()) {
      for (const [nameB, b] of boxes.slice(i + 1)) {
        expect(overlaps(a, b), `${nameA} and ${nameB}`).toBe(false);
      }
    }
  });

  it("stay inside the drawing", () => {
    for (const [, box] of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(PERSONAL_VIEW.width);
      expect(box.y + box.height).toBeLessThanOrEqual(PERSONAL_VIEW.height);
    }
  });

  it("keep the Lich King figure out of the strip under the text column, large enough to tap", () => {
    // On wide screens up to about 13% of the drawing's width sits under the
    // section's text column.
    const { lich } = PERSONAL_BOXES;
    expect(lich.x / PERSONAL_VIEW.width).toBeGreaterThan(0.14);
    // At the smallest drawing, about 290px wide, the target is still 24px wide.
    expect((lich.width / PERSONAL_VIEW.width) * 290).toBeGreaterThanOrEqual(24);
    // The speech bubble points at the helm from inside the drawing.
    expect(PERSONAL_POINTS.lichHead.x).toBeGreaterThan(lich.x);
    expect(PERSONAL_POINTS.lichHead.x).toBeLessThan(lich.x + lich.width);
    expect(PERSONAL_POINTS.lichHead.y).toBeGreaterThan(60);
  });

  it("hides the hint after the figure is poked", () => {
    renderScene();
    const hint = screen.getByText("psst: everything here is clickable");
    fireEvent.click(screen.getByRole("button", { name: "Poke the Lich King figure" }));
    expect(hint).toHaveAttribute("data-hidden", "true");
  });
});

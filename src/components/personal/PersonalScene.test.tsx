import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatPhoto } from "@/content";
import { PersonalArt } from "@/components/illustrations/PersonalArt";
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
  it("offers the four interactions once mounted", () => {
    renderScene();
    expect(screen.getByRole("button", { name: "Grab a handful of popcorn" })).toBeInTheDocument();
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

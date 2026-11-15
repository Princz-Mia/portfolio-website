import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DukeState, step as realStepType } from "./duke";
import { BEST_KEY, DUKE_HINT, dukeAction, gameOverText } from "./DukeRun";
import { LaptopScreen } from "./LaptopScreen";

// The simulation runs for real unless a test decides how a step ends.
const mocks = vi.hoisted(() => ({
  step: vi.fn(),
  realStep: null as unknown as typeof realStepType,
}));
vi.mock("./duke", async (importOriginal) => {
  const real = await importOriginal<typeof import("./duke")>();
  mocks.realStep = real.step;
  return { ...real, step: mocks.step };
});

const nextFrame = () =>
  act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
const wait = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

function reducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matches && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));
}

/** Ends the game on the next step, as if Duke ran into a NullPointerException crate. */
function crashNextStep(distance = 480) {
  mocks.step.mockImplementation((s: DukeState) => ({
    ...s,
    phase: "over",
    distance,
    cause: { id: 1, kind: "npe", x: 70, y: 0, w: 26, h: 26, vx: 0 },
  }));
}

function openDuke() {
  render(
    <LaptopScreen>
      <svg />
    </LaptopScreen>,
  );
  const opener = screen.getByRole("button", { name: /Open the laptop terminal$/ });
  fireEvent.click(opener);
  const dialog = document.querySelector("dialog")!;
  fireEvent.click(within(dialog).getByRole("button", { name: "› duke" }));
  const canvas = within(dialog).getByRole("application", { name: "Duke runner" });
  return { opener, dialog, canvas };
}

const log = (dialog: HTMLElement) => within(dialog).getByRole("log");

beforeEach(() => {
  mocks.step.mockReset();
  mocks.step.mockImplementation(mocks.realStep);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("dukeAction", () => {
  it("maps jump and duck keys and leaves the rest to the browser", () => {
    const key = (code: string, key: string, mods = {}) => ({
      code,
      key,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      ...mods,
    });
    expect(dukeAction(key("Space", " "))).toBe("jump");
    expect(dukeAction(key("ArrowUp", "ArrowUp"))).toBe("jump");
    expect(dukeAction(key("KeyW", "w"))).toBe("jump");
    expect(dukeAction(key("ArrowDown", "ArrowDown"))).toBe("duck");
    expect(dukeAction(key("KeyS", "s"))).toBe("duck");
    expect(dukeAction(key("", "w"))).toBe("jump");
    expect(dukeAction(key("Tab", "Tab"))).toBeNull();
    expect(dukeAction(key("KeyW", "w", { ctrlKey: true }))).toBeNull();
    expect(dukeAction(key("KeyS", "s", { metaKey: true }))).toBeNull();
  });

  it("writes the game over text as a Java exception", () => {
    expect(gameOverText("java.lang.NullPointerException", 12, 40)).toEqual([
      'Exception in thread "main" java.lang.NullPointerException',
      "score 12 · best 40 · press space or tap to retry",
    ]);
  });
});

describe("Duke runner in the terminal", () => {
  it("starts from the button, focuses the game and runs it", async () => {
    const { dialog, canvas } = openDuke();
    expect(canvas).toHaveFocus();
    expect(within(dialog).getByRole("heading")).toHaveTextContent("mia@desk: ~/duke");
    expect(within(dialog).getByRole("status")).toHaveTextContent("Duke runner.");
    expect(canvas).toHaveAccessibleDescription(DUKE_HINT);
    expect(within(dialog).getByRole("button", { name: "quit to terminal" })).toBeInTheDocument();
    await waitFor(() => expect(mocks.step).toHaveBeenCalled());
    expect(screen.queryByTestId("duke-note")).not.toBeInTheDocument();
  });

  it("starts from the duke command too", () => {
    render(
      <LaptopScreen>
        <svg />
      </LaptopScreen>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Open the laptop terminal$/ }));
    const input = screen.getByLabelText("Command");
    fireEvent.change(input, { target: { value: "duke" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByRole("application", { name: "Duke runner" })).toBeInTheDocument();
  });

  it("takes its keys only on the canvas and never Tab or browser shortcuts", () => {
    const { canvas } = openDuke();
    expect(fireEvent.keyDown(canvas, { key: " ", code: "Space" })).toBe(false);
    expect(fireEvent.keyDown(canvas, { key: "ArrowDown", code: "ArrowDown" })).toBe(false);
    expect(fireEvent.keyDown(canvas, { key: "Tab", code: "Tab" })).toBe(true);
    expect(fireEvent.keyDown(canvas, { key: "r", code: "KeyR", ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(canvas, { key: "w", code: "KeyW", metaKey: true })).toBe(true);
  });

  it("jumps while the jump key is held", async () => {
    const { canvas } = openDuke();
    fireEvent.keyDown(canvas, { key: " ", code: "Space" });
    await waitFor(() =>
      expect(mocks.step).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.objectContaining({ jump: true }),
      ),
    );
    fireEvent.keyUp(canvas, { key: " ", code: "Space" });
    mocks.step.mockClear();
    await waitFor(() => expect(mocks.step).toHaveBeenCalled());
    expect(mocks.step).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.objectContaining({ jump: false, jumpPressed: false }),
    );
  });

  it("goes back to the terminal on Escape and prints the score", async () => {
    const { dialog, canvas } = openDuke();
    expect(fireEvent.keyDown(canvas, { key: "Escape", code: "Escape" })).toBe(false);
    expect(dialog.open).toBe(true);
    expect(log(dialog)).toHaveTextContent("duke: score 0 (best 0)");
    expect(within(dialog).getByRole("status")).toHaveTextContent("duke: score 0 (best 0)");
    expect(within(dialog).getByLabelText("Command")).toHaveFocus();
  });

  it("keeps the dialog open when Escape reaches it, and goes back to the terminal", () => {
    const { dialog } = openDuke();
    within(dialog).getByRole("button", { name: "quit to terminal" }).focus();
    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
    expect(log(dialog)).toHaveTextContent("duke: score 0 (best 0)");
  });

  it("quits from the button and stops the game loop", async () => {
    const { dialog } = openDuke();
    await waitFor(() => expect(mocks.step).toHaveBeenCalled());
    fireEvent.click(within(dialog).getByRole("button", { name: "quit to terminal" }));
    expect(log(dialog)).toHaveTextContent(/duke: score \d+ \(best \d+\)/);
    expect(within(dialog).queryByRole("application")).not.toBeInTheDocument();
    const calls = mocks.step.mock.calls.length;
    await wait(80);
    expect(mocks.step).toHaveBeenCalledTimes(calls);
  });

  it("shows a Java exception on game over, saves the best score and retries", async () => {
    const { dialog, canvas } = openDuke();
    crashNextStep(480);
    const note = await screen.findByTestId("duke-note");
    expect(note).toHaveTextContent('Exception in thread "main" java.lang.NullPointerException');
    expect(note).toHaveTextContent("score 12 · best 12 · press space or tap to retry");
    expect(within(dialog).getByRole("status")).toHaveTextContent("java.lang.NullPointerException");
    expect(window.localStorage.getItem(BEST_KEY)).toBe("12");

    // The loop has stopped.
    const calls = mocks.step.mock.calls.length;
    await wait(60);
    expect(mocks.step).toHaveBeenCalledTimes(calls);

    // A press right away is ignored; a later one starts a new run.
    mocks.step.mockImplementation(mocks.realStep);
    fireEvent.keyDown(canvas, { key: " ", code: "Space" });
    fireEvent.keyUp(canvas, { key: " ", code: "Space" });
    expect(screen.getByTestId("duke-note")).toBeInTheDocument();
    await wait(450);
    fireEvent.keyDown(canvas, { key: " ", code: "Space" });
    expect(screen.queryByTestId("duke-note")).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.step.mock.calls.length).toBeGreaterThan(calls));

    fireEvent.keyDown(canvas, { key: "Escape", code: "Escape" });
    expect(log(dialog)).toHaveTextContent(/duke: score \d+ \(best 12\)/);
  });

  it("restarts with a tap after game over", async () => {
    const { canvas } = openDuke();
    crashNextStep();
    await screen.findByTestId("duke-note");
    await wait(450);
    mocks.step.mockImplementation(mocks.realStep);
    fireEvent.pointerDown(canvas, { pointerId: 1, button: 0 });
    expect(screen.queryByTestId("duke-note")).not.toBeInTheDocument();
  });

  it("reads the stored best score", () => {
    window.localStorage.setItem(BEST_KEY, "77");
    const { dialog, canvas } = openDuke();
    expect(within(dialog).getByText(/^best 77 ·/)).toBeInTheDocument();
    fireEvent.keyDown(canvas, { key: "Escape", code: "Escape" });
    expect(log(dialog)).toHaveTextContent("duke: score 0 (best 77)");
  });

  it("still plays when storage is blocked", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const { dialog } = openDuke();
    crashNextStep(400);
    const note = await screen.findByTestId("duke-note");
    expect(note).toHaveTextContent("score 10 · best 10");
    fireEvent.click(within(dialog).getByRole("button", { name: "quit to terminal" }));
    expect(log(dialog)).toHaveTextContent("duke: score 10 (best 10)");
  });

  it("pauses when the game loses focus and resumes on a press", async () => {
    const { canvas } = openDuke();
    await waitFor(() => expect(mocks.step).toHaveBeenCalled());
    fireEvent.blur(canvas);
    expect(screen.getByTestId("duke-note")).toHaveTextContent("paused");
    const calls = mocks.step.mock.calls.length;
    await wait(60);
    expect(mocks.step).toHaveBeenCalledTimes(calls);

    fireEvent.keyDown(canvas, { key: "ArrowUp", code: "ArrowUp" });
    expect(screen.queryByTestId("duke-note")).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.step.mock.calls.length).toBeGreaterThan(calls));
  });

  it("keeps playing while the touch buttons are used", async () => {
    const { dialog, canvas } = openDuke();
    const jump = within(dialog).getByRole("button", { name: "jump" });
    fireEvent.blur(canvas, { relatedTarget: jump });
    expect(screen.queryByTestId("duke-note")).not.toBeInTheDocument();
    fireEvent.pointerDown(within(dialog).getByRole("button", { name: "duck" }), { pointerId: 2 });
    await waitFor(() =>
      expect(mocks.step).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.objectContaining({ duck: true }),
      ),
    );
  });

  it("pauses while the tab is hidden", async () => {
    openDuke();
    await waitFor(() => expect(mocks.step).toHaveBeenCalled());
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByTestId("duke-note")).toHaveTextContent("paused");
    hidden.mockRestore();
  });

  it("waits for an explicit start when reduced motion is preferred", async () => {
    reducedMotion(true);
    const { canvas } = openDuke();
    const note = screen.getByTestId("duke-note");
    expect(note).toHaveTextContent("reduced motion is on, so the game waits for you.");
    expect(note).toHaveTextContent("press space or tap to start");
    await nextFrame();
    await nextFrame();
    expect(mocks.step).not.toHaveBeenCalled();

    fireEvent.keyDown(canvas, { key: " ", code: "Space" });
    expect(screen.queryByTestId("duke-note")).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.step).toHaveBeenCalled());
  });

  it("leaves the score in the log when the dialog closes mid-run", async () => {
    const { dialog, opener } = openDuke();
    await waitFor(() => expect(mocks.step).toHaveBeenCalled());
    fireEvent.click(within(dialog).getByRole("button", { name: "Close terminal" }));
    expect(dialog.open).toBe(false);
    expect(opener).toHaveFocus();
    const calls = mocks.step.mock.calls.length;
    await wait(60);
    expect(mocks.step).toHaveBeenCalledTimes(calls);
    fireEvent.click(opener);
    expect(log(dialog)).toHaveTextContent(/duke: score \d+ \(best \d+\)/);
  });
});

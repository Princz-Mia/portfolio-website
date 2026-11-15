import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { site } from "@/content";
import { DOOM_KEYS } from "./doomEngine";
import { LaptopScreen, MAX_LINES, PANEL_SIZE, progressBar } from "./LaptopScreen";

// The engine file is never fetched in tests: each test decides what loading it does.
const loadDoomModule = vi.hoisted(() => vi.fn());
vi.mock("./doomEngine", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./doomEngine")>()),
  loadDoomModule,
}));

type Imports = { loading: { onGameInit: (w: number, h: number) => void } };

/** Stands in for the compiled engine: instantiating it gives these exports. */
function fakeEngine() {
  const engine = {
    imports: null as Imports | null,
    exports: {
      memory: new WebAssembly.Memory({ initial: 1 }),
      initGame: vi.fn(() => engine.imports?.loading.onGameInit(640, 400)),
      tickGame: vi.fn(),
      reportKeyDown: vi.fn(),
      reportKeyUp: vi.fn(),
    },
  };
  vi.spyOn(WebAssembly, "instantiate").mockImplementation((async (
    _module: WebAssembly.Module,
    imports: Imports,
  ) => {
    engine.imports = imports;
    return { exports: engine.exports };
  }) as unknown as typeof WebAssembly.instantiate);
  loadDoomModule.mockImplementation(async (onProgress?: (f: number) => void) => {
    onProgress?.(0.5);
    onProgress?.(1);
    return {} as WebAssembly.Module;
  });
  return engine;
}

function renderLaptop() {
  render(
    <LaptopScreen>
      <svg data-testid="drawing" />
    </LaptopScreen>,
  );
  return screen.getByRole("button", { name: "Can it run Doom? Open the laptop terminal" });
}

function openTerminal() {
  const opener = renderLaptop();
  fireEvent.click(opener);
  const dialog = document.querySelector("dialog")!;
  return { opener, dialog, input: within(dialog).getByLabelText("Command") };
}

function typeCommand(input: HTMLElement, command: string) {
  fireEvent.change(input, { target: { value: command } });
  fireEvent.submit(input.closest("form")!);
}

async function startGame() {
  const engine = fakeEngine();
  const terminal = openTerminal();
  fireEvent.click(within(terminal.dialog).getByRole("button", { name: "› doom" }));
  const canvas = await within(terminal.dialog).findByRole("application", { name: "Doom" });
  await waitFor(() => expect(engine.exports.initGame).toHaveBeenCalled());
  return { ...terminal, engine, canvas };
}

beforeEach(() => {
  loadDoomModule.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LaptopScreen terminal", () => {
  it("renders only the drawing on the server", () => {
    const html = renderToString(
      <LaptopScreen>
        <svg />
      </LaptopScreen>,
    );
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<dialog");
  });

  it("opens the terminal with the banner and focuses the input", () => {
    const { dialog, input } = openTerminal();
    expect(dialog.open).toBe(true);
    expect(input).toHaveFocus();
    expect(within(dialog).getByRole("log")).toHaveTextContent("can it run doom?");
  });

  it("prints the site name for whoami", () => {
    const { dialog, input } = openTerminal();
    typeCommand(input, "whoami");
    expect(within(dialog).getByRole("log")).toHaveTextContent(site.name);
    expect(input).toHaveValue("");
  });

  it("runs a command from the button row", () => {
    const { dialog } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "help" }));
    expect(within(dialog).getByRole("log")).toHaveTextContent("yes, it runs doom");
  });

  it("returns focus to the opener when closed", () => {
    const { opener, dialog } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close terminal" }));
    expect(dialog.open).toBe(false);
    expect(opener).toHaveFocus();
  });

  it("closes on exit and keeps the log for the next open", () => {
    const { opener, dialog, input } = openTerminal();
    typeCommand(input, "exit");
    expect(dialog.open).toBe(false);
    expect(opener).toHaveFocus();
    fireEvent.click(opener);
    expect(within(dialog).getByRole("log")).toHaveTextContent("exit");
  });

  it("closes on a press that starts and ends on the backdrop", () => {
    const { dialog } = openTerminal();
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    expect(dialog.open).toBe(false);
  });

  it("stays open when a drag from inside the terminal ends on the backdrop", () => {
    const { dialog } = openTerminal();
    fireEvent.pointerDown(within(dialog).getByRole("log"));
    fireEvent.click(dialog);
    expect(dialog.open).toBe(true);
  });

  it("announces the banner once the dialog is open", async () => {
    const { dialog } = openTerminal();
    const status = within(dialog).getByRole("status");
    expect(status).toHaveTextContent("");
    await act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
    expect(status).toHaveTextContent("can it run doom?");
  });

  it("lets the dialog close on Escape in the terminal", () => {
    const { dialog } = openTerminal();
    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(false);
  });

  it("never prevents Tab in the terminal", () => {
    const { input } = openTerminal();
    expect(fireEvent.keyDown(input, { key: "Tab", code: "Tab" })).toBe(true);
  });
});

describe("LaptopScreen panel size", () => {
  it("gives the panel a fixed width and height", () => {
    const { dialog } = openTerminal();
    expect(dialog.style.getPropertyValue("--panel-w")).toBe(PANEL_SIZE.width);
    expect(dialog.style.getPropertyValue("--panel-h")).toBe(PANEL_SIZE.height);
    expect(PANEL_SIZE.height).toMatch(/^min\(.*dvh.*rem\)$/);
  });

  it("keeps its size while long output scrolls inside the log", () => {
    const { dialog, input } = openTerminal();
    const log = within(dialog).getByRole("log");
    let scrollTop = 0;
    Object.defineProperty(log, "scrollHeight", { configurable: true, get: () => 9000 });
    Object.defineProperty(log, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });
    const before = dialog.getAttribute("style");

    for (let i = 0; i < 40; i++) typeCommand(input, "help");

    expect(dialog.getAttribute("style")).toBe(before);
    expect(within(log).getAllByRole("listitem")).toHaveLength(MAX_LINES);
    // The newest line is scrolled into view inside the log.
    expect(scrollTop).toBe(9000);
    // The prompt and the buttons are still rendered below the log.
    expect(within(dialog).getByLabelText("Command")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "› doom" })).toBeInTheDocument();
  });

  it("draws download progress as a text bar", () => {
    expect(progressBar(0)).toBe(`[${".".repeat(20)}]   0%`);
    expect(progressBar(0.5)).toBe(`[${"#".repeat(10)}${".".repeat(10)}]  50%`);
    expect(progressBar(2)).toBe(`[${"#".repeat(20)}] 100%`);
  });
});

describe("LaptopScreen doom loading", () => {
  it("shows the download while the engine loads", async () => {
    let finish: (value: WebAssembly.Module) => void = () => {};
    loadDoomModule.mockImplementation((onProgress?: (f: number) => void) => {
      onProgress?.(0.42);
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const { dialog } = openTerminal();
    // Let the banner's announcement go first.
    await act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
    fireEvent.click(within(dialog).getByRole("button", { name: "› doom" }));
    const log = within(dialog).getByRole("log");
    expect(log).toHaveTextContent("loading doom.wad…");
    await waitFor(() => expect(log).toHaveTextContent("42%"));
    expect(within(dialog).getByRole("status")).toHaveTextContent("loading doom");
    finish({} as WebAssembly.Module);
  });

  it("prints a segmentation fault when the engine fails to load", async () => {
    loadDoomModule.mockRejectedValue(new Error("HTTP 404"));
    const { dialog, input } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "› doom" }));
    const log = within(dialog).getByRole("log");
    await waitFor(() => expect(log).toHaveTextContent("doom: segmentation fault (core dumped)"));
    expect(within(dialog).queryByRole("application")).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("prints a segmentation fault when the download itself fails", async () => {
    const { loadDoomModule: realLoader } =
      await vi.importActual<typeof import("./doomEngine")>("./doomEngine");
    loadDoomModule.mockImplementation(realLoader);
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));
    const { dialog } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "› doom" }));
    await waitFor(() =>
      expect(within(dialog).getByRole("log")).toHaveTextContent(
        "doom: segmentation fault (core dumped)",
      ),
    );
  });

  it("prints a segmentation fault when the engine fails to start", async () => {
    const engine = fakeEngine();
    engine.exports.initGame.mockImplementation(() => {
      throw new WebAssembly.RuntimeError("unreachable");
    });
    const { dialog } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "› doom" }));
    await waitFor(() =>
      expect(within(dialog).getByRole("log")).toHaveTextContent(
        "doom: segmentation fault (core dumped)",
      ),
    );
  });

  it("cancels the load on Escape instead of closing", async () => {
    loadDoomModule.mockReturnValue(new Promise(() => {}));
    const { dialog } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "› doom" }));
    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
    expect(within(dialog).getByRole("log")).toHaveTextContent("doom: loading cancelled.");
  });

  it("refuses to start another game while the engine loads", async () => {
    loadDoomModule.mockReturnValue(new Promise(() => {}));
    const { dialog, input } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "› doom" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "› duke" }));
    typeCommand(input, "doom");
    const log = within(dialog).getByRole("log");
    expect(log).not.toHaveTextContent("java -jar duke-run.jar");
    expect(log).toHaveTextContent("doom: still loading (esc to cancel)");
    expect(log.textContent?.match(/loading doom\.wad/g)).toHaveLength(1);
    expect(within(dialog).queryByRole("application", { name: "Duke runner" })).toBeNull();
    expect(within(dialog).getByLabelText("Command")).toBeInTheDocument();
  });
});

describe("LaptopScreen doom", () => {
  it("runs the game in the terminal and focuses it", async () => {
    const { dialog, canvas } = await startGame();
    expect(canvas).toHaveFocus();
    expect(dialog.open).toBe(true);
    await waitFor(() =>
      expect(within(dialog).getByRole("status")).toHaveTextContent("Doom is running."),
    );
    expect(within(dialog).getByRole("button", { name: "quit to terminal" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /^DOOM shareware/ })).toHaveAttribute(
      "href",
      "/doom/README.txt",
    );
    expect(
      screen.getByRole("button", { name: "It runs Doom. Open the laptop terminal" }),
    ).toBeInTheDocument();
  });

  it("sends keys to the engine while the game has focus", async () => {
    const { canvas, engine } = await startGame();
    expect(fireEvent.keyDown(canvas, { key: "ArrowUp", code: "ArrowUp" })).toBe(false);
    expect(engine.exports.reportKeyDown).toHaveBeenLastCalledWith(DOOM_KEYS.up);
    // Held keys repeat in the browser; the engine hears one press.
    fireEvent.keyDown(canvas, { key: "ArrowUp", code: "ArrowUp", repeat: true });
    expect(engine.exports.reportKeyDown).toHaveBeenCalledTimes(1);
    fireEvent.keyUp(canvas, { key: "ArrowUp", code: "ArrowUp" });
    expect(engine.exports.reportKeyUp).toHaveBeenLastCalledWith(DOOM_KEYS.up);

    fireEvent.keyDown(canvas, { key: "Control", code: "ControlLeft", ctrlKey: true });
    expect(engine.exports.reportKeyDown).toHaveBeenLastCalledWith(DOOM_KEYS.fire);
    // Browser shortcuts are left alone.
    expect(fireEvent.keyDown(canvas, { key: "r", code: "KeyR", ctrlKey: true })).toBe(true);
  });

  it("never prevents Tab in the game", async () => {
    const { canvas, engine } = await startGame();
    expect(fireEvent.keyDown(canvas, { key: "Tab", code: "Tab" })).toBe(true);
    expect(engine.exports.reportKeyDown).not.toHaveBeenCalled();
  });

  it("gives Escape to Doom's menu and keeps the dialog open", async () => {
    const { dialog, canvas, engine } = await startGame();
    expect(fireEvent.keyDown(canvas, { key: "Escape", code: "Escape" })).toBe(false);
    expect(engine.exports.reportKeyDown).toHaveBeenLastCalledWith(DOOM_KEYS.escape);

    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
    expect(within(dialog).getByRole("application", { name: "Doom" })).toBeInTheDocument();
  });

  it("goes back to the terminal on Escape from the game's buttons", async () => {
    const { dialog } = await startGame();
    within(dialog).getByRole("button", { name: "quit to terminal" }).focus();
    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
    expect(within(dialog).getByRole("log")).toHaveTextContent("doom: quit.");
  });

  it("quits to the terminal from the button and focuses the input", async () => {
    const { dialog } = await startGame();
    fireEvent.click(within(dialog).getByRole("button", { name: "quit to terminal" }));
    const log = within(dialog).getByRole("log");
    expect(log).toHaveTextContent("doom: quit. type doom to play again.");
    expect(log).toHaveTextContent("DOOM shareware © id Software");
    expect(within(dialog).getByRole("status")).toHaveTextContent("doom: quit.");
    expect(within(dialog).getByLabelText("Command")).toHaveFocus();
  });

  it("drives the game from the touch pad", async () => {
    const { dialog, engine } = await startGame();
    const fire = within(dialog).getByRole("button", { name: "fire" });
    fireEvent.pointerDown(fire, { pointerId: 1 });
    expect(engine.exports.reportKeyDown).toHaveBeenLastCalledWith(DOOM_KEYS.fire);
    fireEvent.pointerUp(fire, { pointerId: 1 });
    expect(engine.exports.reportKeyUp).toHaveBeenLastCalledWith(DOOM_KEYS.fire);

    fireEvent.pointerDown(within(dialog).getByRole("button", { name: "Turn left" }));
    expect(engine.exports.reportKeyDown).toHaveBeenLastCalledWith(DOOM_KEYS.left);
  });

  it("lets go of held keys when the game loses focus", async () => {
    const { canvas, engine } = await startGame();
    fireEvent.keyDown(canvas, { key: "ArrowLeft", code: "ArrowLeft" });
    fireEvent.blur(canvas);
    expect(engine.exports.reportKeyUp).toHaveBeenCalledWith(DOOM_KEYS.left);
  });

  it("stops the game and lets go of its keys when the dialog closes", async () => {
    const { dialog, opener, engine } = await startGame();
    fireEvent.pointerDown(within(dialog).getByRole("button", { name: "Forward" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Close terminal" }));
    expect(dialog.open).toBe(false);
    expect(opener).toHaveFocus();
    expect(within(dialog).queryByRole("application")).not.toBeInTheDocument();
    expect(engine.exports.reportKeyUp).toHaveBeenCalledWith(DOOM_KEYS.up);
    const ticks = engine.exports.tickGame.mock.calls.length;
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(engine.exports.tickGame).toHaveBeenCalledTimes(ticks);
  });

  it("returns to the terminal when Doom quits by itself", async () => {
    const { dialog, engine } = await startGame();
    engine.exports.tickGame.mockImplementation(() => {
      throw new WebAssembly.RuntimeError("null function or function signature mismatch");
    });
    await waitFor(() =>
      expect(within(dialog).getByRole("log")).toHaveTextContent("doom exited. thanks for playing."),
    );
    expect(dialog.open).toBe(true);
  });
});

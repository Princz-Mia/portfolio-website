import { afterEach, describe, expect, it, vi } from "vitest";
import { DOOM_KEYS, DOOM_WASM_URL, bgraToRgba, createDoom, doomKeyCode, type KeyInput } from "./doomEngine";

const key = (k: string, extra: Partial<KeyInput> = {}): KeyInput => ({
  key: k,
  code: "",
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...extra,
});

describe("doomKeyCode", () => {
  it("maps movement, actions and menu keys to the engine's codes", () => {
    expect(doomKeyCode(key("ArrowLeft"))).toBe(DOOM_KEYS.left);
    expect(doomKeyCode(key("ArrowRight"))).toBe(DOOM_KEYS.right);
    expect(doomKeyCode(key("ArrowUp"))).toBe(DOOM_KEYS.up);
    expect(doomKeyCode(key("ArrowDown"))).toBe(DOOM_KEYS.down);
    expect(doomKeyCode(key(","))).toBe(DOOM_KEYS.strafeLeft);
    expect(doomKeyCode(key(">"))).toBe(DOOM_KEYS.strafeRight);
    expect(doomKeyCode(key(" "))).toBe(DOOM_KEYS.use);
    expect(doomKeyCode(key("Shift"))).toBe(DOOM_KEYS.run);
    expect(doomKeyCode(key("Escape"))).toBe(DOOM_KEYS.escape);
    expect(doomKeyCode(key("Enter"))).toBe(DOOM_KEYS.enter);
    expect(doomKeyCode(key("Backspace"))).toBe(DOOM_KEYS.backspace);
  });

  it("fires on Control alone and on X", () => {
    expect(doomKeyCode(key("Control", { ctrlKey: true }))).toBe(DOOM_KEYS.fire);
    expect(doomKeyCode(key("x"))).toBe(DOOM_KEYS.fire);
    expect(doomKeyCode(key("X"))).toBe(DOOM_KEYS.fire);
  });

  it("leaves Control, Alt and Meta shortcuts to the browser", () => {
    expect(doomKeyCode(key("w", { ctrlKey: true }))).toBeNull();
    expect(doomKeyCode(key("ArrowUp", { ctrlKey: true }))).toBeNull();
    expect(doomKeyCode(key("ArrowLeft", { altKey: true }))).toBeNull();
    expect(doomKeyCode(key("r", { metaKey: true }))).toBeNull();
    expect(doomKeyCode(key("Alt", { altKey: true }))).toBeNull();
  });

  it("keeps the movement keys working while Control is held as fire", () => {
    expect(doomKeyCode(key("ArrowUp", { ctrlKey: true }), true)).toBe(DOOM_KEYS.up);
    expect(doomKeyCode(key("Shift", { ctrlKey: true }), true)).toBe(DOOM_KEYS.run);
    expect(doomKeyCode(key("w", { ctrlKey: true }), true)).toBeNull();
  });

  it("never takes Tab", () => {
    expect(doomKeyCode(key("Tab", { code: "Tab" }))).toBeNull();
  });

  it("sends letters lowercase and the number row by position", () => {
    expect(doomKeyCode(key("I"))).toBe("i".charCodeAt(0));
    expect(doomKeyCode(key("d"))).toBe("d".charCodeAt(0));
    expect(doomKeyCode(key("y"))).toBe("y".charCodeAt(0));
    expect(doomKeyCode(key("3", { code: "Digit3" }))).toBe("3".charCodeAt(0));
    expect(doomKeyCode(key("#", { code: "Digit3" }))).toBe("3".charCodeAt(0));
    expect(doomKeyCode(key("-", { code: "Minus" }))).toBe("-".charCodeAt(0));
  });

  it("ignores keys the game has no use for", () => {
    expect(doomKeyCode(key("F5"))).toBeNull();
    expect(doomKeyCode(key("CapsLock"))).toBeNull();
    expect(doomKeyCode(key("é"))).toBeNull();
  });
});

describe("bgraToRgba", () => {
  it("swaps red and blue and makes every pixel opaque", () => {
    // Bytes in memory: B, G, R, unused.
    const src = new Uint32Array(new Uint8Array([0x10, 0x20, 0x30, 0x00, 0xff, 0x00, 0x80, 0x7f]).buffer);
    const dst = new Uint32Array(2);
    bgraToRgba(src, dst);
    expect([...new Uint8Array(dst.buffer)]).toEqual([0x30, 0x20, 0x10, 0xff, 0x80, 0x00, 0xff, 0xff]);
  });
});

describe("loadDoomModule", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** A fresh copy of the loader, with nothing cached. */
  async function freshLoader() {
    vi.resetModules();
    return (await import("./doomEngine")).loadDoomModule;
  }

  it("rejects on an HTTP error and fetches again on the next attempt", async () => {
    const loadDoomModule = await freshLoader();
    const fetchMock = vi.fn(async () => new Response("missing", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadDoomModule()).rejects.toThrow("404");
    await expect(loadDoomModule()).rejects.toThrow("404");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(DOOM_WASM_URL);
  });

  it("rejects when the network fails", async () => {
    const loadDoomModule = await freshLoader();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    await expect(loadDoomModule()).rejects.toThrow("offline");
  });

  it("rejects when the file is not a valid engine", async () => {
    const loadDoomModule = await freshLoader();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1, 2, 3]))));
    await expect(loadDoomModule()).rejects.toBeInstanceOf(WebAssembly.CompileError);
  });

  it("reports progress while downloading and compiles the file only once", async () => {
    const loadDoomModule = await freshLoader();
    const compiled = {} as WebAssembly.Module;
    const compile = vi.spyOn(WebAssembly, "compile").mockResolvedValue(compiled);
    const fetchMock = vi.fn(async () => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(40));
          controller.enqueue(new Uint8Array(60));
          controller.close();
        },
      });
      return new Response(body, { headers: { "content-length": "100" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const progress: number[] = [];
    await expect(loadDoomModule((f) => progress.push(f))).resolves.toBe(compiled);
    expect(progress[0]).toBeCloseTo(0.4);
    expect(progress.at(-1)).toBe(1);
    expect((compile.mock.calls[0][0] as ArrayBuffer).byteLength).toBe(100);

    await expect(loadDoomModule()).resolves.toBe(compiled);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("createDoom", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  type Imports = {
    loading: { onGameInit: (w: number, h: number) => void };
    ui: { drawFrame: (pointer: number) => void };
    runtimeControl: { timeInMilliseconds: () => bigint };
  };

  function fakeEngine() {
    const engine = {
      imports: null as Imports | null,
      exports: {
        memory: new WebAssembly.Memory({ initial: 1 }),
        initGame: vi.fn(() => engine.imports?.loading.onGameInit(64, 40)),
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
    return engine;
  }

  const engineModule = {} as WebAssembly.Module;

  it("starts the engine, sizes the canvas and ticks at most 35 times a second", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const engine = fakeEngine();
    const canvas = document.createElement("canvas");
    const game = await createDoom(engineModule, canvas, vi.fn());
    expect(engine.exports.initGame).not.toHaveBeenCalled();
    game.start();
    expect(engine.exports.initGame).toHaveBeenCalledTimes(1);
    expect([canvas.width, canvas.height]).toEqual([64, 40]);
    // Drawing without a 2D context (as here) is skipped, not an error.
    engine.imports?.ui.drawFrame(0);

    vi.advanceTimersByTime(1000);
    const ticks = engine.exports.tickGame.mock.calls.length;
    expect(ticks).toBeGreaterThan(20);
    expect(ticks).toBeLessThanOrEqual(35);

    game.keyDown(DOOM_KEYS.fire);
    expect(engine.exports.reportKeyDown).toHaveBeenCalledWith(DOOM_KEYS.fire);
    game.stop();
  });

  it("freezes the game and its clock while paused", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const engine = fakeEngine();
    const game = await createDoom(engineModule, document.createElement("canvas"), vi.fn());
    game.start();
    vi.advanceTimersByTime(200);
    const time = () => Number(engine.imports!.runtimeControl.timeInMilliseconds());
    expect(typeof engine.imports!.runtimeControl.timeInMilliseconds()).toBe("bigint");
    const before = time();

    game.setPaused(true);
    const ticks = engine.exports.tickGame.mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect(engine.exports.tickGame).toHaveBeenCalledTimes(ticks);

    game.setPaused(false);
    expect(time() - before).toBeLessThan(50);
    vi.advanceTimersByTime(200);
    expect(engine.exports.tickGame.mock.calls.length).toBeGreaterThan(ticks);
    game.stop();
  });

  it("reports an exit once and stops when the engine ends itself", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const engine = fakeEngine();
    engine.exports.tickGame.mockImplementation(() => {
      throw new WebAssembly.RuntimeError("null function or function signature mismatch");
    });
    const onExit = vi.fn();
    const game = await createDoom(engineModule, document.createElement("canvas"), onExit);
    game.start();
    vi.advanceTimersByTime(1000);
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(engine.exports.tickGame).toHaveBeenCalledTimes(1);
    game.keyDown(DOOM_KEYS.up);
    expect(engine.exports.reportKeyDown).not.toHaveBeenCalled();
  });

  it("does nothing more once stopped", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const engine = fakeEngine();
    const game = await createDoom(engineModule, document.createElement("canvas"), vi.fn());
    game.start();
    game.stop();
    game.setPaused(false);
    vi.advanceTimersByTime(1000);
    expect(engine.exports.tickGame).not.toHaveBeenCalled();
    expect(() => game.start()).toThrow();
  });
});

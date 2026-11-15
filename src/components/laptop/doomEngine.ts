/**
 * The shareware Doom engine (doom.wasm, GPL-2.0, with id Software's DOOM1.WAD
 * built in), driven from the browser: fetching and compiling the module once,
 * mapping keyboard keys to the engine's key codes, copying frames to a canvas
 * and running the game clock.
 */

export const DOOM_WASM_URL = "/doom/doom.wasm";

/** Size of the uncompressed module, for progress when the server compresses it. */
export const DOOM_WASM_BYTES = 4_559_928;

/** The engine's key codes (fixed by the build; also exported as globals). */
export const DOOM_KEYS = {
  left: 0xac,
  right: 0xae,
  up: 0xad,
  down: 0xaf,
  strafeLeft: 0xa0,
  strafeRight: 0xa1,
  fire: 0xa3,
  use: 0xa2,
  run: 0xb6,
  escape: 0x1b,
  enter: 0x0d,
  backspace: 0x7f,
} as const;

/** Doom runs its game logic 35 times a second. */
const TIC_MS = 1000 / 35;

// ---------------------------------------------------------------------------
// Loading

type Progress = (fraction: number) => void;

let modulePromise: Promise<WebAssembly.Module> | null = null;
const listeners = new Set<Progress>();

function report(fraction: number) {
  for (const listener of listeners) listener(fraction);
}

/** Reads the whole body, reporting how much has arrived. */
async function readBody(response: Response): Promise<ArrayBuffer> {
  const reader = response.body?.getReader();
  if (!reader) return response.arrayBuffer();

  // A compressed response's Content-Length counts compressed bytes, while the
  // stream yields decompressed ones, so only trust it for an uncompressed body.
  const length = Number(response.headers.get("content-length"));
  const compressed = response.headers.get("content-encoding");
  const total = !compressed && length > 0 ? length : DOOM_WASM_BYTES;

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    report(Math.min(received / total, 0.99));
  }

  const buffer = new ArrayBuffer(received);
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}

async function fetchAndCompile(): Promise<WebAssembly.Module> {
  const response = await fetch(DOOM_WASM_URL);
  if (!response.ok) throw new Error(`doom.wasm: HTTP ${response.status}`);
  const compiled = await WebAssembly.compile(await readBody(response));
  report(1);
  return compiled;
}

/**
 * Fetches and compiles the engine once per page. A failed load is forgotten,
 * so the next attempt fetches again. `onProgress` receives 0 to 1 while the
 * file downloads.
 */
export function loadDoomModule(onProgress?: Progress): Promise<WebAssembly.Module> {
  if (onProgress) listeners.add(onProgress);
  if (!modulePromise) {
    modulePromise = fetchAndCompile();
    modulePromise.catch(() => {
      modulePromise = null;
    });
  }
  const done = () => {
    if (onProgress) listeners.delete(onProgress);
  };
  modulePromise.then(done, done);
  return modulePromise;
}

// ---------------------------------------------------------------------------
// Keys

export type KeyInput = Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "altKey" | "metaKey">;

const NAMED: Record<string, number> = {
  ArrowLeft: DOOM_KEYS.left,
  ArrowRight: DOOM_KEYS.right,
  ArrowUp: DOOM_KEYS.up,
  ArrowDown: DOOM_KEYS.down,
  ",": DOOM_KEYS.strafeLeft,
  "<": DOOM_KEYS.strafeLeft,
  ".": DOOM_KEYS.strafeRight,
  ">": DOOM_KEYS.strafeRight,
  " ": DOOM_KEYS.use,
  Shift: DOOM_KEYS.run,
  Escape: DOOM_KEYS.escape,
  Enter: DOOM_KEYS.enter,
  Backspace: DOOM_KEYS.backspace,
  Control: DOOM_KEYS.fire,
  x: DOOM_KEYS.fire,
  X: DOOM_KEYS.fire,
};

/** Keys that may be pressed while Control is held down as the fire button. */
const WHILE_FIRING = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", ",", ".", "<", ">", "Shift", " "]);

/**
 * The engine key code for a keyboard key, or null when the game should not
 * take it. Control alone (or X) fires; while it is held, the movement keys
 * still work, but any other Control, Alt or Meta combination is left to the
 * browser. Tab is never taken. Letters are sent lowercase (cheat codes work)
 * and the number row by position, so 1 to 7 pick weapons while running.
 */
export function doomKeyCode(e: KeyInput, firing = false): number | null {
  if (e.altKey || e.metaKey) return null;
  if (e.key === "Control") return DOOM_KEYS.fire;
  if (e.ctrlKey && !(firing && WHILE_FIRING.has(e.key))) return null;

  const named = NAMED[e.key];
  if (named !== undefined) return named;

  const digit = /^Digit([0-9])$/.exec(e.code);
  if (digit) return 48 + Number(digit[1]);

  if (e.key.length === 1) {
    const code = e.key.toLowerCase().charCodeAt(0);
    if (code > 32 && code < 127) return code;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Frames

/**
 * Copies one frame of the engine's pixels (bytes B, G, R, unused) into
 * canvas pixels (bytes R, G, B, A), fully opaque.
 */
export function bgraToRgba(src: Uint32Array, dst: Uint32Array) {
  const n = Math.min(src.length, dst.length);
  for (let i = 0; i < n; i++) {
    const p = src[i];
    dst[i] = 0xff000000 | ((p & 0xff) << 16) | (p & 0xff00) | ((p >>> 16) & 0xff);
  }
}

// ---------------------------------------------------------------------------
// Running

type DoomExports = {
  memory: WebAssembly.Memory;
  initGame: () => void;
  tickGame: () => void;
  reportKeyDown: (code: number) => void;
  reportKeyUp: (code: number) => void;
};

export type DoomGame = {
  /** Initialises the engine and starts the loop. Throws if the engine fails to start. */
  start(): void;
  keyDown(code: number): void;
  keyUp(code: number): void;
  /** Freezes the game and its clock, or carries on from where it stopped. */
  setPaused(paused: boolean): void;
  /** Stops for good and lets go of the engine and its memory. */
  stop(): void;
};

/**
 * Instantiates a fresh engine that draws into `canvas`. The engine has no
 * restart, so every game needs its own instance; the compiled module is shared.
 * `onExit` is called once if the engine stops by itself (choosing Quit Game in
 * its menu ends the module with an error).
 */
export async function createDoom(
  module: WebAssembly.Module,
  canvas: HTMLCanvasElement,
  onExit: () => void,
): Promise<DoomGame> {
  let exports: DoomExports | null = null;
  let context: CanvasRenderingContext2D | null = null;
  let image: ImageData | null = null;
  let width = 0;
  let height = 0;

  // The game clock runs on performance.now() minus the time spent paused, so
  // Doom does not jump ahead after a pause. It never stands still while the
  // engine runs: the engine waits for the clock to move.
  let offset = 0;
  let pausedAt: number | null = null;
  let lastTime = 0;
  const clock = () => {
    lastTime = Math.max(lastTime, Math.trunc(performance.now() - offset));
    return lastTime;
  };

  const imports = {
    loading: {
      onGameInit(w: number, h: number) {
        width = w;
        height = h;
        canvas.width = w;
        canvas.height = h;
        context = canvas.getContext("2d");
        image = context?.createImageData(w, h) ?? null;
      },
      // Reporting no WADs makes the engine use the shareware episode it embeds.
      wadSizes() {},
      readWads() {},
    },
    ui: {
      drawFrame(pointer: number) {
        if (!exports || !context || !image) return;
        // Fresh views every frame: growing memory detaches the old buffer.
        bgraToRgba(
          new Uint32Array(exports.memory.buffer, pointer, width * height),
          new Uint32Array(image.data.buffer),
        );
        context.putImageData(image, 0, 0);
      },
    },
    runtimeControl: { timeInMilliseconds: () => BigInt(clock()) },
    console: { onInfoMessage() {}, onErrorMessage() {} },
    gameSaving: { sizeOfSaveGame: () => 0, readSaveGame: () => 0, writeSaveGame: () => 0 },
  };

  const instance = await WebAssembly.instantiate(module, imports);
  exports = instance.exports as unknown as DoomExports;

  let frame = 0;
  let lastTick = 0;
  let started = false;
  let running = false;
  let stopped = false;

  function stop() {
    stopped = true;
    running = false;
    cancelAnimationFrame(frame);
    frame = 0;
    exports = null;
    context = null;
    image = null;
  }

  function loop() {
    frame = 0;
    if (!running || !exports) return;
    // Only call in once a whole tic has passed: called sooner, the engine
    // spins until the next tic is due. Measured on the same clock as lastTick.
    const now = performance.now();
    if (now - lastTick >= TIC_MS) {
      lastTick = now;
      try {
        exports.tickGame();
      } catch {
        stop();
        onExit();
        return;
      }
    }
    frame = requestAnimationFrame(loop);
  }

  function run() {
    if (!started || running || stopped || pausedAt !== null) return;
    running = true;
    lastTick = performance.now();
    frame = requestAnimationFrame(loop);
  }

  return {
    start() {
      if (!exports) throw new Error("doom: stopped");
      exports.initGame();
      started = true;
      run();
    },
    keyDown(code) {
      exports?.reportKeyDown(code);
    },
    keyUp(code) {
      exports?.reportKeyUp(code);
    },
    setPaused(paused) {
      if (stopped) return;
      if (paused && pausedAt === null) {
        pausedAt = performance.now();
        running = false;
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!paused && pausedAt !== null) {
        offset += performance.now() - pausedAt;
        pausedAt = null;
        run();
      }
    },
    stop,
  };
}

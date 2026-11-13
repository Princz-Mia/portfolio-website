/**
 * A tiny grid raycaster: map, player movement and a frame renderer that writes
 * packed pixels into a buffer. Pure apart from writing into the given buffer.
 * The map's y axis grows downward.
 */

export const WIDTH = 118;
export const HEIGHT = 72;

/** `#` wall, `.` floor, `E` the exit door (a wall cell), `P` the spawn. */
export const MAP: readonly string[] = [
  "############",
  "#P....#....#",
  "#.###.#.##.#",
  "#.#...#..#.#",
  "#.#.####.#.#",
  "#.#....#.#.#",
  "#.####.#.#.#",
  "#......#...#",
  "######.#.###",
  "#..........E",
  "#.##.####..#",
  "############",
];

export type Grid = readonly string[];
export type Player = { x: number; y: number; dirX: number; dirY: number; planeX: number; planeY: number };
export type Action = "forward" | "back" | "left" | "right";
export type Hit = { perp: number; side: 0 | 1; cell: string };

const FOV = 0.66;
const RADIUS = 0.2;

/** The cell at a position; anything outside the map is wall. */
export function cellAt(x: number, y: number, grid: Grid = MAP): string {
  return grid[Math.floor(y)]?.[Math.floor(x)] ?? "#";
}

const solid = (cell: string) => cell === "#" || cell === "E";

/** A player at a cell centre facing along (dirX, dirY), with the camera plane to its right. */
export function facing(x: number, y: number, dirX: number, dirY: number): Player {
  return { x, y, dirX, dirY, planeX: -dirY * FOV, planeY: dirX * FOV };
}

/** The start position: the `P` cell, facing south. */
export function spawn(grid: Grid = MAP): Player {
  const row = grid.findIndex((line) => line.includes("P"));
  return facing(grid[row].indexOf("P") + 0.5, row + 0.5, 0, 1);
}

/** Casts one ray (lodev DDA); `cameraX` runs from -1 (left edge) to 1 (right edge). */
export function cast(p: Player, cameraX: number, grid: Grid = MAP): Hit {
  const rayX = p.dirX + p.planeX * cameraX;
  const rayY = p.dirY + p.planeY * cameraX;
  let mapX = Math.floor(p.x);
  let mapY = Math.floor(p.y);
  const deltaX = Math.abs(1 / rayX);
  const deltaY = Math.abs(1 / rayY);
  const stepX = rayX < 0 ? -1 : 1;
  const stepY = rayY < 0 ? -1 : 1;
  let sideX = (rayX < 0 ? p.x - mapX : mapX + 1 - p.x) * deltaX;
  let sideY = (rayY < 0 ? p.y - mapY : mapY + 1 - p.y) * deltaY;
  let side: 0 | 1 = 0;
  for (let i = 0; i < 64; i++) {
    if (sideX < sideY) {
      sideX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      sideY += deltaY;
      mapY += stepY;
      side = 1;
    }
    if (solid(cellAt(mapX, mapY, grid))) break;
  }
  const perp = side === 0 ? sideX - deltaX : sideY - deltaY;
  return { perp, side, cell: cellAt(mapX, mapY, grid) };
}

/** Rotates the view; a positive angle turns right. */
export function turn(p: Player, angle: number): Player {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    ...p,
    dirX: p.dirX * cos - p.dirY * sin,
    dirY: p.dirX * sin + p.dirY * cos,
    planeX: p.planeX * cos - p.planeY * sin,
    planeY: p.planeX * sin + p.planeY * cos,
  };
}

/**
 * Walks `distance` cells along the view (negative walks back), sliding along
 * walls with a collision radius per axis. Bumping into the exit wins.
 */
export function move(p: Player, distance: number, grid: Grid = MAP): { player: Player; won: boolean } {
  const dx = p.dirX * distance;
  const dy = p.dirY * distance;
  let { x, y } = p;
  const probeX = cellAt(x + dx + Math.sign(dx) * RADIUS, y, grid);
  if (probeX === "E") return { player: p, won: true };
  if (probeX !== "#") x += dx;
  const probeY = cellAt(x, y + dy + Math.sign(dy) * RADIUS, grid);
  if (probeY === "E") return { player: { ...p, x }, won: true };
  if (probeY !== "#") y += dy;
  return { player: { ...p, x, y }, won: false };
}

/** Moves to the centre of the current cell and faces the nearest compass direction. */
export function snap(p: Player): Player {
  const horizontal = Math.abs(p.dirX) >= Math.abs(p.dirY);
  return facing(
    Math.floor(p.x) + 0.5,
    Math.floor(p.y) + 0.5,
    horizontal ? Math.sign(p.dirX) : 0,
    horizontal ? 0 : Math.sign(p.dirY),
  );
}

/** Step mode: one whole cell forward or back, or a quarter turn. Expects a snapped player. */
export function step(p: Player, action: Action, grid: Grid = MAP): { player: Player; won: boolean } {
  if (action === "left" || action === "right") {
    const sign = action === "right" ? 1 : -1;
    return { player: facing(p.x, p.y, -p.dirY * sign, p.dirX * sign), won: false };
  }
  const sign = action === "forward" ? 1 : -1;
  const x = p.x + Math.round(p.dirX) * sign;
  const y = p.y + Math.round(p.dirY) * sign;
  const cell = cellAt(x, y, grid);
  if (cell === "E") return { player: p, won: true };
  if (cell === "#") return { player: p, won: false };
  return { player: { ...p, x, y }, won: false };
}

const PAPER = [0xf6, 0xf1, 0xea];
/** Colour slots, in the drawing's palette. */
const COLOURS = [
  PAPER, // 0 ceiling
  [0xeb, 0xe4, 0xda], // 1 floor (shade)
  [0xe7, 0xdf, 0xd5], // 2 wall, x side (fur)
  [0xf1, 0xe2, 0xdd], // 3 wall, y side (tint)
  [0x6f, 0x65, 0x5d], // 4 wall line
  [0xa1, 0x4d, 0x59], // 5 door, x side (accent)
  [0x9b, 0x34, 0x43], // 6 door, y side (banner)
  [0x3f, 0x35, 0x32], // 7 door line (dark)
];
const FOG_LEVELS = 6;

/** Packs a colour into a 32-bit pixel in the machine's byte order. */
export function pack(r: number, g: number, b: number): number {
  return new Uint32Array(new Uint8Array([r, g, b, 255]).buffer)[0];
}

/** Every colour at every fog level, each level a step closer to paper. */
export function palette(): Uint32Array {
  const table = new Uint32Array(COLOURS.length * FOG_LEVELS);
  COLOURS.forEach((rgb, c) => {
    for (let level = 0; level < FOG_LEVELS; level++) {
      const [r, g, b] = rgb.map((v, i) => Math.round(v + (PAPER[i] - v) * (level / 8)));
      table[c * FOG_LEVELS + level] = pack(r, g, b);
    }
  });
  return table;
}

/**
 * Renders one frame into `pixels` (WIDTH x HEIGHT, row major). Walls are flat
 * fills with their top and bottom pixel in the line colour, and a full line
 * column wherever the silhouette breaks, so the view looks hand drawn.
 */
export function render(p: Player, pixels: Uint32Array, colours: Uint32Array, grid: Grid = MAP): void {
  const ceiling = colours[0];
  const floor = colours[FOG_LEVELS];
  let prev: Hit | null = null;
  for (let x = 0; x < WIDTH; x++) {
    const hit = cast(p, (2 * x) / WIDTH - 1, grid);
    const door = hit.cell === "E";
    const level = Math.min(FOG_LEVELS - 1, Math.floor(hit.perp / 1.5));
    const fillSlot = door ? 5 + hit.side : 2 + hit.side;
    const fill = colours[fillSlot * FOG_LEVELS + level];
    const line = colours[(door ? 7 : 4) * FOG_LEVELS + level];
    const edge =
      prev !== null &&
      (prev.side !== hit.side || prev.cell !== hit.cell || Math.abs(hit.perp - prev.perp) > 0.6);
    const lineHeight = HEIGHT / hit.perp;
    const top = Math.max(0, Math.floor((HEIGHT - lineHeight) / 2));
    const bottom = Math.min(HEIGHT - 1, Math.floor((HEIGHT + lineHeight) / 2));
    for (let y = 0; y < HEIGHT; y++) {
      pixels[y * WIDTH + x] =
        y < top ? ceiling : y > bottom ? floor : edge || y === top || y === bottom ? line : fill;
    }
    prev = hit;
  }
}

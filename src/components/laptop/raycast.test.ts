import { describe, expect, it } from "vitest";
import {
  HEIGHT,
  MAP,
  WIDTH,
  cast,
  cellAt,
  facing,
  move,
  pack,
  palette,
  render,
  snap,
  spawn,
  step,
  turn,
} from "./raycast";

/** An open 9x9 room with walls all round. */
const ROOM = [
  "#########",
  ...Array.from({ length: 7 }, () => "#.......#"),
  "#########",
];

describe("cast", () => {
  it("has no fisheye: a flat wall is equally far at the centre and the edges", () => {
    const player = facing(5.5, 4.5, 1, 0);
    const centre = cast(player, 0, ROOM);
    expect(centre.perp).toBeCloseTo(2.5);
    expect(cast(player, -1, ROOM).perp).toBeCloseTo(centre.perp);
    expect(cast(player, 1, ROOM).perp).toBeCloseTo(centre.perp);
  });

  it("reports which side of a cell the ray hit", () => {
    expect(cast(facing(4.5, 4.5, 1, 0), 0, ROOM).side).toBe(0);
    expect(cast(facing(4.5, 4.5, 0, 1), 0, ROOM).side).toBe(1);
  });

  it("puts the right edge of the screen to the player's right", () => {
    const east = facing(4.5, 4.5, 1, 0);
    expect(east.dirY + east.planeY * 1).toBeGreaterThan(0);
  });

  it("turns right for a positive angle", () => {
    const turned = turn(facing(4.5, 4.5, 1, 0), 0.3);
    expect(turned.dirY).toBeGreaterThan(0);
  });
});

describe("move", () => {
  it("is blocked by walls", () => {
    const start = facing(1.5, 1.5, -1, 0);
    const { player, won } = move(start, 0.5);
    expect(won).toBe(false);
    expect(player.x).toBe(1.5);
  });

  it("wins when it bumps into the exit", () => {
    const { won } = move(facing(10.5, 9.5, 1, 0), 0.4);
    expect(won).toBe(true);
  });

  it("moves freely on open floor", () => {
    const { player } = move(spawn(), 0.5);
    expect(player.y).toBeCloseTo(2);
  });
});

describe("step mode", () => {
  it("moves exactly one cell and turns a quarter", () => {
    const start = snap(turn(spawn(), 0.2));
    expect(start).toMatchObject({ x: 1.5, y: 1.5, dirX: 0, dirY: 1 });
    expect(step(start, "forward").player).toMatchObject({ x: 1.5, y: 2.5 });
    expect(step(start, "back").player).toMatchObject({ x: 1.5, y: 1.5 });
    const left = step(start, "left").player;
    expect(left.dirX).toBe(1);
    expect(left.dirY).toBeCloseTo(0);
  });

  it("wins on the exit", () => {
    expect(step(facing(10.5, 9.5, 1, 0), "forward").won).toBe(true);
  });
});

describe("map", () => {
  it("has a path from the spawn to the exit", () => {
    const start = spawn();
    const queue: [number, number][] = [[Math.floor(start.x), Math.floor(start.y)]];
    const seen = new Set(queue.map(String));
    let found = false;
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ]) {
        const cell = cellAt(nx, ny);
        if (cell === "E") found = true;
        if (cell === "#" || cell === "E" || seen.has(`${nx},${ny}`)) continue;
        seen.add(`${nx},${ny}`);
        queue.push([nx, ny]);
      }
    }
    expect(found).toBe(true);
    expect(MAP.every((row) => row.length === MAP.length)).toBe(true);
  });
});

describe("render", () => {
  it("fills the frame with ceiling, wall and floor pixels", () => {
    const colours = palette();
    const pixels = new Uint32Array(WIDTH * HEIGHT);
    render(spawn(), pixels, colours);
    expect(pixels[WIDTH / 2]).toBe(pack(0xf6, 0xf1, 0xea));
    expect(pixels[(HEIGHT - 1) * WIDTH + WIDTH / 2]).toBe(pack(0xeb, 0xe4, 0xda));
    expect(pixels.every((v) => v !== 0)).toBe(true);
  });
});

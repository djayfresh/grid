import type { Rng } from '@djayfresh/engine-kit';

// The town, as the 2026 rebuild laid it out (legacy/game/src/zombie/world.ts
// generateMap): a 3 x 4 grid of 40 px streets, a dead-end spur off the bottom
// right corner gated by a barricade you must shoot down, and the safe house at
// its end. Two optional barricades block shortcuts, spawner houses sit flush
// against the streets, and two homes with driveways stand on the west side.
// Rounds get harder: more spawner houses, tougher ones and barricades, faster
// zombies that notice you from further away.
//
// Movement follows the 2020 engine's Holding rule (shared/world.ts
// noCollisions): roads, driveways and house floors hold you, so you can only
// step out of one if you land strictly inside another; walls, barricades and
// spawner houses block. Zombies ignore the roads and only walls and barricades
// stop them. World units are the 2020 game's pixels. Pure, tested in node.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Barricade extends Rect {
  id: number;
  health: number;
  max: number;
  /** The one between you and the safe house. */
  mandatory: boolean;
  /** Seconds of hit flash left, for the art. */
  flash: number;
}

export interface Spawner extends Rect {
  id: number;
  health: number;
  max: number;
  /** Seconds between zombies. */
  rate: number;
  timer: number;
  spawned: number;
  maxSpawns: number;
  /** Zombie base speed, px/s. */
  enemySpeed: number;
  /** How close you have to be before its zombies come for you. */
  siteRange: number;
  flash: number;
}

export interface House extends Rect {
  /** Absolute wall rects: they block you and zombies. */
  walls: Rect[];
}

export interface TownMap {
  roads: Rect[];
  paths: Rect[];
  houses: House[];
  barricades: Barricade[];
  spawners: Spawner[];
  objective: Rect;
  /** The outer edge nobody leaves (Holding + NoExit in 2020). */
  bounds: Rect;
  /** The player's starting top-left. */
  start: { x: number; y: number };
}

export const STREET = 40;
export const COLS_X = [0, 340, 680, 1020];
export const ROWS_Y = [0, 260, 520];
export const GRID_W = COLS_X[COLS_X.length - 1] + STREET;
export const GRID_H = ROWS_Y[ROWS_Y.length - 1] + STREET;
export const SPUR = 300;
export const PLAYER_SIZE = 10;

/** The legacy spawner-house spots: flush against a vertical street's east edge. */
export const SPAWNER_SPOTS = [
  { x: COLS_X[1] + STREET, y: ROWS_Y[0] + STREET + 10 },
  { x: COLS_X[2] + STREET, y: ROWS_Y[0] + STREET + 10 },
  { x: COLS_X[1] + STREET, y: ROWS_Y[1] + STREET + 10 },
  { x: COLS_X[2] + STREET, y: ROWS_Y[1] + STREET + 10 },
];

/** Per-round difficulty, the legacy formulas (speeds converted from px/ms to px/s). */
export function roundTuning(round: number) {
  const r = Math.max(1, round);
  return {
    spawnerCount: Math.min(2 + r, SPAWNER_SPOTS.length),
    spawnerHealth: 30 + (r - 1) * 10,
    barricadeHealth: 20 + (r - 1) * 8,
    enemySpeed: 26 + (r - 1) * 4,
    siteRange: 300 + (r - 1) * 20,
    maxSpawns: 12 + r * 2,
    spawnRate: 3.5,
  };
}

/** A home: a 200 x 200 floor with a door on its west wall and a kitchen in the corner. */
function house(x: number, y: number): House {
  const rel = [
    { x: 0, y: 0, w: 200, h: 2 }, // top
    { x: 198, y: 0, w: 2, h: 200 }, // right
    { x: 0, y: 198, w: 200, h: 2 }, // bottom
    { x: 0, y: 0, w: 2, h: 40 }, // left, above the door
    { x: 0, y: 80, w: 2, h: 120 }, // left, below the door
    { x: 0, y: 50, w: 60, h: 2 }, // kitchen, bottom
    { x: 60, y: 0, w: 2, h: 15 }, // kitchen door, top
    { x: 60, y: 35, w: 2, h: 17 }, // kitchen door, bottom
  ];
  return { x, y, w: 200, h: 200, walls: rel.map((r) => ({ x: x + r.x, y: y + r.y, w: r.w, h: r.h })) };
}

export function generateMap(round: number, rng: Rng): TownMap {
  const t = roundTuning(round);
  let id = 1;
  // Full-span streets, so every crossing overlaps by a whole street width.
  const roads: Rect[] = [
    ...ROWS_Y.map((y) => ({ x: 0, y, w: GRID_W, h: STREET })),
    ...COLS_X.map((x) => ({ x, y: 0, w: STREET, h: GRID_H })),
  ];
  const spurY = ROWS_Y[ROWS_Y.length - 1];
  // The 2020 spur only touched the bottom street, which the strict Holding
  // test never lets you cross; it overlaps the corner by a street width here.
  roads.push({ x: GRID_W - STREET, y: spurY, w: SPUR + STREET, h: STREET });

  const barricade = (r: Rect, health: number, mandatory: boolean): Barricade => ({ ...r, id: id++, health, max: health, mandatory, flash: 0 });
  const optional = Math.round(t.barricadeHealth * 0.7);
  const barricades = [
    barricade({ x: GRID_W + SPUR / 2 - 10, y: spurY, w: 20, h: STREET }, t.barricadeHealth, true),
    barricade({ x: COLS_X[1], y: ROWS_Y[0] + 100, w: STREET, h: 20 }, optional, false),
    barricade({ x: COLS_X[2], y: ROWS_Y[1] + 100, w: STREET, h: 20 }, optional, false),
  ];

  // The safe house's doorstep: the last stretch of the spur.
  const objective = { x: GRID_W + SPUR - 30, y: spurY, w: 40, h: STREET };

  // Which spots get a spawner house when there are fewer than four: the 2020
  // game always took the first ones; a seeded shuffle varies the town.
  const spots = rng.shuffle(SPAWNER_SPOTS).slice(0, t.spawnerCount);
  const spawners: Spawner[] = spots.map((p) => ({
    ...p,
    w: 40,
    h: 40,
    id: id++,
    health: t.spawnerHealth,
    max: t.spawnerHealth,
    rate: t.spawnRate,
    // Staggered so the houses don't all open their doors on the same beat.
    timer: rng.range(0, 1.5),
    spawned: 0,
    maxSpawns: t.maxSpawns,
    enemySpeed: t.enemySpeed,
    siteRange: t.siteRange,
    flash: 0,
  }));

  // Homes on the west side, driveways overlapping both the street and the doorway.
  const houses = [house(100, 50), house(100, 310)];
  const paths: Rect[] = [
    { x: 0, y: 90, w: 110, h: STREET },
    { x: 0, y: 350, w: 110, h: STREET },
  ];

  return {
    roads,
    paths,
    houses,
    barricades,
    spawners,
    objective,
    bounds: { x: -60, y: -60, w: GRID_W + SPUR + 200, h: GRID_H + 120 },
    start: { x: COLS_X[0] + STREET / 2 - PLAYER_SIZE / 2, y: ROWS_Y[0] + STREET / 2 - PLAYER_SIZE / 2 },
  };
}

/** Overlap, edges touching don't count (Physics.collision). */
export const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Strictly inside (Physics.insideBounds): touching an edge is out. */
export const inside = (a: Rect, b: Rect): boolean => a.x > b.x && a.x + a.w < b.x + b.w && a.y > b.y && a.y + a.h < b.y + b.h;

export const houseWalls = (map: TownMap): Rect[] => map.houses.flatMap((h) => h.walls);

/** What stops the player: walls, standing barricades and spawner houses. */
export function playerBlockers(map: TownMap): Rect[] {
  return [...houseWalls(map), ...map.barricades.filter((b) => b.health > 0), ...map.spawners.filter((s) => s.health > 0)];
}

/** What stops a zombie: walls and standing barricades. */
export function enemyBlockers(map: TownMap): Rect[] {
  return [...houseWalls(map), ...map.barricades.filter((b) => b.health > 0)];
}

/** The rects that hold you: streets, driveways and house floors. */
export const holders = (map: TownMap): Rect[] => [...map.roads, ...map.paths, ...map.houses];

/** World.noCollisions: whether a rect at `from` may move to `to`. */
export function canMove(map: TownMap, from: Rect, to: Rect, blockers = playerBlockers(map)): boolean {
  if (blockers.some((b) => overlaps(to, b))) return false;
  // The boundary is NoExit: leaving it is never allowed.
  if (inside(from, map.bounds) && !inside(to, map.bounds)) return false;
  const held = holders(map);
  const leaving = held.some((h) => inside(from, h) && !inside(to, h));
  if (!leaving) return true;
  // Leaving one holder is fine only straight into another (a junction, a driveway, a doorway).
  return held.some((h) => inside(to, h));
}

/** World.validateMove: the whole move, else just its y, else just its x; returns where you end up. */
export function slide(map: TownMap, rect: Rect, dx: number, dy: number, blockers = playerBlockers(map)): { x: number; y: number } {
  const at = (x: number, y: number): Rect => ({ x, y, w: rect.w, h: rect.h });
  if (canMove(map, rect, at(rect.x + dx, rect.y + dy), blockers)) return { x: rect.x + dx, y: rect.y + dy };
  if (dy && canMove(map, rect, at(rect.x, rect.y + dy), blockers)) return { x: rect.x, y: rect.y + dy };
  if (dx && canMove(map, rect, at(rect.x + dx, rect.y), blockers)) return { x: rect.x + dx, y: rect.y };
  // Turning help (new): walking straight into a kerb a few pixels short of a
  // side street, ease sideways toward the opening so the turn takes.
  if (!dx !== !dy) {
    const step = Math.abs(dx || dy);
    for (let off = 1; off <= CORNER_HELP; off++)
      for (const side of [-1, 1]) {
        const ox = dx ? 0 : side * off;
        const oy = dy ? 0 : side * off;
        const shifted = at(rect.x + ox, rect.y + oy);
        if (canMove(map, rect, shifted, blockers) && canMove(map, shifted, at(shifted.x + dx, shifted.y + dy), blockers)) {
          return { x: rect.x + Math.sign(ox) * Math.min(step, off), y: rect.y + Math.sign(oy) * Math.min(step, off) };
        }
      }
  }
  return { x: rect.x, y: rect.y };
}

/** How far, in px, a blocked straight move looks sideways for an opening. */
export const CORNER_HELP = 8;

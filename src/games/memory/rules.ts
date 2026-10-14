import { createRng } from '@djayfresh/engine-kit';

// Memory Grid's rules, as the 2020 game had them (legacy/game/src/memory/): 36
// tiles face down on a 6x6 grid, 18 pairs. Turn two over; a pair stays face up
// and earns 2 points, two that don't match cost a point each and turn back. You
// start on 100 points and the game ends when every pair is found.
// In 2020 a pair was only a colour, picked at random, so two pairs could look
// alike and colour-blind players couldn't play it. Here every pair is a shape
// and a fill (6 x 3 = 18), told apart without colour; the colour helps too.
// Pure, so it is tested in node (tests/memory.test.ts).

export const SIZE = 6;
export const PAIRS = (SIZE * SIZE) / 2;
export const START_POINTS = 100;
export const MATCH_POINTS = 2;
export const MISS_POINTS = 1;

export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon'] as const;
export const FILLS = ['solid', 'outline', 'striped'] as const;
export type Shape = (typeof SHAPES)[number];
export type Fill = (typeof FILLS)[number];

/** Face `n` (0..17): its shape and fill. */
export const face = (n: number): { shape: Shape; fill: Fill } => ({ shape: SHAPES[n % SHAPES.length], fill: FILLS[Math.floor(n / SHAPES.length)] });

export type TileState = 'down' | 'up' | 'matched';
export interface Tile {
  face: number;
  state: TileState;
}

export type FlipOutcome = 'ignored' | 'first' | 'match' | 'miss';

export interface Memory {
  readonly tiles: readonly Tile[];
  readonly points: number;
  readonly pairs: number;
  readonly over: boolean;
  /** Two face up that don't match, waiting to turn back (settle). */
  readonly waiting: boolean;
  /** Turns tile i over. */
  flip(i: number): FlipOutcome;
  /** Turns a missed pair back face down. */
  settle(): void;
}

export function createMemory(seed: number): Memory {
  const rng = createRng(seed);
  const faces = Array.from({ length: PAIRS * 2 }, (_, i) => i % PAIRS);
  for (let i = faces.length - 1; i > 0; i--) {
    const j = rng.int(0, i + 1);
    [faces[i], faces[j]] = [faces[j], faces[i]];
  }
  const tiles: Tile[] = faces.map((f) => ({ face: f, state: 'down' }));
  let points = START_POINTS;
  let pairs = 0;
  let open: number[] = [];

  return {
    tiles,
    get points() {
      return points;
    },
    get pairs() {
      return pairs;
    },
    get over() {
      return pairs === PAIRS;
    },
    get waiting() {
      return open.length === 2;
    },
    flip(i) {
      const t = tiles[i];
      if (!t || t.state !== 'down' || open.length === 2) return 'ignored';
      t.state = 'up';
      open.push(i);
      if (open.length === 1) return 'first';
      const [a, b] = open;
      if (tiles[a].face === tiles[b].face) {
        tiles[a].state = 'matched';
        tiles[b].state = 'matched';
        open = [];
        points += MATCH_POINTS;
        pairs += 1;
        return 'match';
      }
      points -= MISS_POINTS * 2;
      return 'miss';
    },
    settle() {
      if (open.length !== 2) return;
      for (const i of open) tiles[i].state = 'down';
      open = [];
    },
  };
}

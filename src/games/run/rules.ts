import type { Rng } from '@djayfresh/engine-kit';
import { countedRng } from '../../arcade/rng';

// Grid Run's rules, as the 2020 game had them (legacy/game/src/grid/): a 6x6
// board with you, a flag and as many red squares as the board's number. Step to
// any of the eight cells around you; every step is a move. Reach the flag and
// the next board has one more red square; step on red and this board is dealt
// again. After board 25 the game is over, and the fewest moves wins. From board
// 11 a blue bonus sometimes appears: picking it up takes 10 moves off.
// Pure, so it is tested in node (tests/run.test.ts).

export const SIZE = 6;
/** The last board: one more red square would leave too little room. */
export const BOARDS = (SIZE - 1) * (SIZE - 1);
const BONUS_FROM = 11;
const BONUS_CHANCE = 0.25;
const BONUS_MOVES = 10;
/** Deals that fail to leave a path before the board is taken as dealt. */
const DEAL_TRIES = 15;

export type Cell = 'empty' | 'enemy' | 'flag' | 'bonus';
export interface Point {
  x: number;
  y: number;
}
export interface Board {
  /** cells[x][y]; the player's cell is 'empty' (where they stand is `player`). */
  cells: Cell[][];
  player: Point;
}

export type Outcome = 'blocked' | 'step' | 'bonus' | 'hit' | 'flag' | 'done';

const empty = (): Cell[][] => Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill('empty'));

function freeCell(rng: Rng, cells: Cell[][], taken: Point[]): Point {
  const free: Point[] = [];
  for (let x = 0; x < SIZE; x++) for (let y = 0; y < SIZE; y++) if (cells[x][y] === 'empty' && !taken.some((p) => p.x === x && p.y === y)) free.push({ x, y });
  return free[rng.int(0, free.length)];
}

/** Whether the player can reach the flag, stepping in eight directions and never onto red. */
export function reachable(board: Board): boolean {
  const seen = new Set<string>();
  const queue: Point[] = [board.player];
  while (queue.length) {
    const p = queue.shift()!;
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (board.cells[p.x][p.y] === 'flag') return true;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const x = p.x + dx;
        const y = p.y + dy;
        if ((dx || dy) && x >= 0 && y >= 0 && x < SIZE && y < SIZE && board.cells[x][y] !== 'enemy') queue.push({ x, y });
      }
  }
  return false;
}

/** Deals board `number`: you, the flag, maybe a bonus, and `number` red squares, with a way through. */
export function deal(rng: Rng, number: number): Board {
  let board: Board;
  let tries = 0;
  do {
    const cells = empty();
    const player = freeCell(rng, cells, []);
    const flag = freeCell(rng, cells, [player]);
    cells[flag.x][flag.y] = 'flag';
    if (number >= BONUS_FROM && rng.next() < BONUS_CHANCE) {
      const b = freeCell(rng, cells, [player]);
      cells[b.x][b.y] = 'bonus';
    }
    for (let i = 0; i < number; i++) {
      const e = freeCell(rng, cells, [player]);
      if (!e) break;
      cells[e.x][e.y] = 'enemy';
    }
    board = { cells, player };
  } while (!reachable(board) && ++tries < DEAL_TRIES);
  return board;
}

export interface Run {
  readonly board: Board;
  /** 1 to BOARDS. */
  readonly number: number;
  readonly moves: number;
  readonly over: boolean;
  /** Step by dx, dy (each -1, 0 or 1). */
  step(dx: number, dy: number): Outcome;
  /** The run as plain data, for the save: createRun(seed, saved) carries on from it. */
  save(): SavedRun;
}

export interface SavedRun {
  seed: number;
  draws: number;
  number: number;
  moves: number;
  board: Board;
}

export function createRun(seed: number, saved?: SavedRun): Run {
  const rng = countedRng(saved?.seed ?? seed, saved?.draws ?? 0);
  let number = saved?.number ?? 1;
  let moves = saved?.moves ?? 0;
  let over = false;
  let board = saved ? structuredClone(saved.board) : deal(rng, number);

  return {
    get board() {
      return board;
    },
    get number() {
      return number;
    },
    get moves() {
      return moves;
    },
    get over() {
      return over;
    },
    save: () => ({ seed: saved?.seed ?? seed, draws: rng.draws, number, moves, board: structuredClone(board) }),
    step(dx, dy) {
      if (over || (!dx && !dy) || Math.abs(dx) > 1 || Math.abs(dy) > 1) return 'blocked';
      const x = board.player.x + dx;
      const y = board.player.y + dy;
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return 'blocked';
      const cell = board.cells[x][y];
      if (cell === 'enemy') {
        moves += 1;
        board = deal(rng, number);
        return 'hit';
      }
      if (cell === 'flag') {
        moves += 1;
        number += 1;
        if (number > BOARDS) {
          over = true;
          board = { ...board, player: { x, y } };
          return 'done';
        }
        board = deal(rng, number);
        return 'flag';
      }
      if (cell === 'bonus') {
        moves -= BONUS_MOVES;
        board.cells[x][y] = 'empty';
        board.player = { x, y };
        return 'bonus';
      }
      moves += 1;
      board.player = { x, y };
      return 'step';
    },
  };
}

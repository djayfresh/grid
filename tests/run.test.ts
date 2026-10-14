import { describe, expect, it } from 'vitest';
import { createRng } from '@djayfresh/engine-kit';
import { BOARDS, type Board, createRun, deal, reachable, SIZE } from '../src/games/run/rules';

const count = (b: Board, cell: string) => b.cells.flat().filter((c) => c === cell).length;

/** A step toward the flag that avoids red, found by breadth-first search. */
function nextStep(b: Board): [number, number] {
  const key = (x: number, y: number) => `${x},${y}`;
  const start = key(b.player.x, b.player.y);
  const prev = new Map<string, string | null>([[start, null]]);
  const queue = [b.player];
  while (queue.length) {
    const p = queue.shift()!;
    if (b.cells[p.x][p.y] === 'flag') {
      let k = key(p.x, p.y);
      while (prev.get(k) !== start) k = prev.get(k)!;
      const [x, y] = k.split(',').map(Number);
      return [x - b.player.x, y - b.player.y];
    }
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const x = p.x + dx;
        const y = p.y + dy;
        if ((dx || dy) && x >= 0 && y >= 0 && x < SIZE && y < SIZE && b.cells[x][y] !== 'enemy' && !prev.has(key(x, y))) {
          prev.set(key(x, y), key(p.x, p.y));
          queue.push({ x, y });
        }
      }
  }
  throw new Error('no path');
}

describe('Grid Run', () => {
  it('deals board n with n red squares, one flag and a way through', () => {
    const rng = createRng(7);
    for (let n = 1; n <= BOARDS; n++) {
      const b = deal(rng, n);
      expect(count(b, 'enemy')).toBe(n);
      expect(count(b, 'flag')).toBe(1);
      expect(b.cells[b.player.x][b.player.y]).toBe('empty');
      expect(reachable(b)).toBe(true);
    }
  });

  it('only offers the bonus from board 11', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) expect(count(deal(rng, 1 + (i % 10)), 'bonus')).toBe(0);
    let seen = 0;
    for (let i = 0; i < 200; i++) seen += count(deal(rng, 11 + (i % 14)), 'bonus');
    expect(seen).toBeGreaterThan(0);
  });

  it('blocks the edge and still moves, and deals again on red', () => {
    const run = createRun(11);
    expect(run.step(0, 0)).toBe('blocked');
    expect(run.step(2, 0)).toBe('blocked');
    const p = run.board.player;
    if (p.x === 0) expect(run.step(-1, 0)).toBe('blocked');
    expect(run.moves).toBe(0);
    for (let seed = 1; seed < 50; seed++) {
      const r = createRun(seed);
      const q = r.board.player;
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const x = q.x + dx;
          const y = q.y + dy;
          if ((dx || dy) && x >= 0 && y >= 0 && x < SIZE && y < SIZE && r.board.cells[x][y] === 'enemy') {
            expect(r.step(dx, dy)).toBe('hit');
            expect(r.moves).toBe(1);
            expect(r.number).toBe(1);
            return;
          }
        }
    }
    throw new Error('no seed put red beside the player');
  });

  it('ends after board 25, counting every move', () => {
    const run = createRun(42);
    let steps = 0;
    let last = '';
    while (!run.over && steps < 2000) {
      const before = run.moves;
      last = run.step(...nextStep(run.board));
      steps++;
      if (last === 'bonus') expect(run.moves).toBe(before - 10);
      else expect(run.moves).toBe(before + 1);
    }
    expect(last).toBe('done');
    expect(run.over).toBe(true);
    expect(run.number).toBe(BOARDS + 1);
    expect(run.step(1, 0)).toBe('blocked');
  });

  it('replays the same boards from the same seed', () => {
    expect(createRun(5).board).toEqual(createRun(5).board);
  });
});

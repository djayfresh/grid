import { describe, expect, it } from 'vitest';
import { createMemory, face, FILLS, type Memory, PAIRS, SHAPES, START_POINTS } from '../src/games/memory/rules';

const pairOf = (m: Memory, i: number) => m.tiles.findIndex((t, j) => j !== i && t.face === m.tiles[i].face);
const notPairOf = (m: Memory, i: number) => m.tiles.findIndex((t, j) => j !== i && t.face !== m.tiles[i].face && t.state === 'down');

describe('Memory Grid', () => {
  it('deals 18 pairs, each a different shape and fill', () => {
    const m = createMemory(1);
    expect(m.tiles).toHaveLength(36);
    const faces = new Set<string>();
    for (let n = 0; n < PAIRS; n++) faces.add(`${face(n).shape}/${face(n).fill}`);
    expect(faces.size).toBe(PAIRS);
    expect(SHAPES.length * FILLS.length).toBe(PAIRS);
    for (let n = 0; n < PAIRS; n++) expect(m.tiles.filter((t) => t.face === n)).toHaveLength(2);
  });

  it('earns 2 for a pair and keeps it face up', () => {
    const m = createMemory(2);
    expect(m.flip(0)).toBe('first');
    expect(m.flip(pairOf(m, 0))).toBe('match');
    expect(m.points).toBe(START_POINTS + 2);
    expect(m.pairs).toBe(1);
    expect(m.tiles[0].state).toBe('matched');
    expect(m.flip(0)).toBe('ignored');
  });

  it('costs 2 for a miss, and turns them back on settle', () => {
    const m = createMemory(3);
    m.flip(0);
    const j = notPairOf(m, 0);
    expect(m.flip(j)).toBe('miss');
    expect(m.points).toBe(START_POINTS - 2);
    expect(m.waiting).toBe(true);
    expect(m.flip(pairOf(m, 0))).toBe('ignored');
    m.settle();
    expect(m.tiles[0].state).toBe('down');
    expect(m.tiles[j].state).toBe('down');
  });

  it('is over when every pair is found', () => {
    const m = createMemory(4);
    for (let i = 0; i < m.tiles.length; i++) {
      if (m.tiles[i].state !== 'down') continue;
      m.flip(i);
      m.flip(pairOf(m, i));
    }
    expect(m.over).toBe(true);
    expect(m.points).toBe(START_POINTS + PAIRS * 2);
  });

  it('deals the same board from the same seed', () => {
    expect(createMemory(9).tiles).toEqual(createMemory(9).tiles);
  });
});

describe('a saved Memory Grid', () => {
  it('keeps the board, the points and a tile turned up', () => {
    const a = createMemory(5);
    a.flip(0);
    a.flip(pairOf(a, 0));
    a.flip(1);
    const b = createMemory(77, JSON.parse(JSON.stringify(a.save())));
    expect(b.tiles).toEqual(a.tiles);
    expect(b.points).toBe(a.points);
    expect(b.pairs).toBe(1);
    expect(b.flip(pairOf(b, 1))).toBe(a.flip(pairOf(a, 1)));
  });

  it('turns a missed pair back down in the save', () => {
    const a = createMemory(6);
    a.flip(0);
    const j = notPairOf(a, 0);
    a.flip(j);
    const b = createMemory(1, a.save());
    expect(b.tiles[0].state).toBe('down');
    expect(b.tiles[j].state).toBe('down');
    expect(b.waiting).toBe(false);
    expect(b.points).toBe(a.points);
  });
});

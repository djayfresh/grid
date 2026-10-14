// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createGame, type Game } from '../src/game';
import type { Round } from '../src/roundFields';

// The placeholder round, through the contract main.ts relies on (reset, update,
// pointer, and the score, timeLeft and over it reads back). When game.ts is
// replaced these go with it: a test of the placeholder is not a test of the
// game. They are here so `npm test` means something from the first commit.

// A canvas that draws nothing. The game needs a 2D context that takes the
// calls, and a size; a context whose every method is a no-op is enough.
function canvas(width = 400, height = 300): HTMLCanvasElement {
  const ctx = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  return { clientWidth: width, clientHeight: height, width, height, getContext: () => ctx } as unknown as HTMLCanvasElement;
}

const STEP = 1 / 60;
// A round of the test's own, so changing content/rounds/ never changes these.
const ROUND: Round = { id: 'test', name: 'Test', seconds: 30, targetLife: 2.2, spawnEvery: 0.9, maxTargets: 3, missPenalty: 0.5 };
const ROUND_SECONDS = ROUND.seconds;
const run = (game: Game, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) game.update(STEP);
};

// So small that every target spawns at its middle (the spawn keeps a margin
// from each edge, and here the margins meet): a tap there always hits.
const TINY = 90;
const MIDDLE = TINY / 2;

describe('the placeholder round', () => {
  it('starts full and runs down to over', () => {
    const game = createGame(canvas(), ROUND);
    game.reset(1);
    expect(game.timeLeft).toBe(ROUND_SECONDS);
    expect(game.over).toBe(false);
    run(game, ROUND_SECONDS + 1);
    expect(game.timeLeft).toBe(0);
    expect(game.over).toBe(true);
  });

  it('charges a miss half a second, never below zero', () => {
    const game = createGame(canvas(), ROUND);
    game.reset(1);
    game.pointer(-1000, -1000);
    expect(game.timeLeft).toBeCloseTo(ROUND_SECONDS - 0.5);
    for (let i = 0; i < 100; i++) game.pointer(-1000, -1000);
    expect(game.timeLeft).toBe(0);
    expect(game.over).toBe(true);
  });

  it('pops the target under the pointer for a point', () => {
    const game = createGame(canvas(TINY, TINY), ROUND);
    game.reset(1);
    run(game, 0.5);
    game.pointer(MIDDLE, MIDDLE);
    expect(game.score).toBe(1);
    expect(game.timeLeft).toBeCloseTo(ROUND_SECONDS - 0.5, 1);
  });

  it('replays the same run from the same seed', () => {
    const play = (seed: number): [number, number] => {
      const game = createGame(canvas(TINY, TINY), ROUND);
      game.reset(seed);
      run(game, 2);
      for (let i = 0; i < 6; i++) game.pointer(MIDDLE, MIDDLE);
      return [game.score, game.timeLeft];
    };
    expect(play(7)).toEqual(play(7));
    expect(play(7)[0]).toBeGreaterThan(0);
  });
});

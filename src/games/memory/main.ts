import { randomSeed } from '@djayfresh/engine-kit';
import { tone, tones } from '@djayfresh/engine-ui';
import { arcadePage, type Input, type Result, type Round } from '../../arcade/page';
import { backdrop, board, withAlpha } from '../../arcade/theme';
import { gameById } from '../../site';
import { drawBack, drawFront } from './art';
import { createMemory, type FlipOutcome, type Memory, PAIRS, type SavedMemory, SIZE, START_POINTS } from './rules';

// Memory Grid's page: the rules (rules.ts) on the arcade's board. Tap a tile to
// turn it over; two that don't match stay up long enough to remember, then
// turn back. Arrow keys move a cursor and Enter or Space turns its tile.

const game = gameById('memory');
const FLIP = 0.22;
const LOOK = 0.75;

function sound(o: FlipOutcome): void {
  if (o === 'first') tone({ freq: 440, duration: 0.05, volume: 0.05, type: 'triangle' });
  else if (o === 'match') tones([{ freq: 660, duration: 0.08, volume: 0.07, type: 'triangle' }, { freq: 990, start: 0.07, duration: 0.12, volume: 0.07, type: 'triangle' }]);
  else if (o === 'miss') tone({ freq: 180, duration: 0.18, volume: 0.06, type: 'sawtooth' });
}

function createRound(ctx: CanvasRenderingContext2D, input: Input): Round {
  let memory: Memory = createMemory(randomSeed());
  let width = 1;
  let height = 1;
  let t = 0;
  let look = 0;
  /** Each tile's turn, 0 face down to 1 face up, easing toward its state. */
  let turn: number[] = memory.tiles.map(() => 0);
  let pop: number[] = memory.tiles.map(() => 0);
  let cursor = -1;
  let result: Result | null = null;

  const layout = () => {
    const cell = Math.floor(Math.min((width - 32) / SIZE, (height - 48) / SIZE, 104));
    return { cell, x: Math.round((width - cell * SIZE) / 2), y: Math.round((height - cell * SIZE) / 2 + 8) };
  };

  function flip(i: number): void {
    if (result) return;
    if (memory.waiting) {
      memory.settle();
      look = 0;
    }
    const o = memory.flip(i);
    sound(o);
    if (o === 'miss') look = LOOK;
    if (o === 'match') {
      memory.tiles.forEach((tl, j) => {
        if (tl.state === 'matched' && pop[j] === 0) pop[j] = 1;
      });
    }
    if (memory.over) {
      const misses = (START_POINTS + PAIRS * 2 - memory.points) / 2;
      result = {
        heading: 'All pairs found!',
        text: `You finished on ${memory.points} points${misses ? `, with ${misses} ${misses === 1 ? 'miss' : 'misses'}` : ' without a single miss'}.`,
        success: true,
        score: memory.points,
      };
    }
  }

  window.addEventListener('keydown', (e) => {
    if (result) return;
    const move: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -SIZE, ArrowDown: SIZE };
    if (e.code in move) {
      cursor = cursor < 0 ? 0 : Math.min(SIZE * SIZE - 1, Math.max(0, cursor + move[e.code]));
    } else if ((e.code === 'Enter' || e.code === 'Space') && cursor >= 0) {
      e.preventDefault();
      flip(cursor);
    }
  });

  return {
    reset(seed = randomSeed(), saved?: unknown) {
      memory = createMemory(seed, saved as SavedMemory | undefined);
      // A saved board comes back as it was, not flipping into place.
      turn = memory.tiles.map((tl) => (tl.state === 'down' ? 0 : 1));
      pop = memory.tiles.map(() => 0);
      look = 0;
      cursor = -1;
      result = null;
    },
    update(dt) {
      t += dt;
      if (look > 0) {
        look -= dt;
        if (look <= 0) memory.settle();
      }
      memory.tiles.forEach((tl, i) => {
        const goal = tl.state === 'down' ? 0 : 1;
        const d = dt / FLIP;
        turn[i] = goal > turn[i] ? Math.min(goal, turn[i] + d) : Math.max(goal, turn[i] - d);
        if (pop[i] > 0 && pop[i] < 2) pop[i] = Math.min(2, pop[i] + dt * 3);
      });
    },
    fit(w, h) {
      width = w;
      height = h;
    },
    pointer(px, py) {
      const { cell, x, y } = layout();
      const cx = Math.floor((px - x) / cell);
      const cy = Math.floor((py - y) / cell);
      if (cx < 0 || cy < 0 || cx >= SIZE || cy >= SIZE) return;
      cursor = -1;
      flip(cy * SIZE + cx);
    },
    hud: () => `${memory.points} pts · ${memory.pairs}/${PAIRS} pairs`,
    save: () => memory.save(),
    progress: () => `${memory.pairs} of ${PAIRS} pairs found, ${memory.points} points`,
    get result() {
      return result;
    },
    render() {
      backdrop(ctx, width, height, game.accent, t);
      const { cell, x, y } = layout();
      board(ctx, x, y, cell, SIZE, SIZE, game.accent);
      const g = cell * 0.06;
      const { pointer } = input;
      memory.tiles.forEach((tl, i) => {
        const cx = x + (i % SIZE) * cell + g;
        const cy = y + Math.floor(i / SIZE) * cell + g;
        const s = cell - g * 2;
        const k = turn[i];
        const hover = !pointer.touch && tl.state === 'down' && pointer.x >= cx && pointer.x < cx + s && pointer.y >= cy && pointer.y < cy + s;
        // A pair just found grows a little and settles back.
        const p = pop[i] > 0 && pop[i] < 2 ? Math.sin((pop[i] - 1) * Math.PI) * 0.08 : 0;
        ctx.save();
        ctx.translate(cx + s / 2, cy + s / 2);
        ctx.scale(Math.max(0.02, Math.abs(Math.cos(k * Math.PI))) * (1 + p), 1 + p);
        ctx.translate(-(cx + s / 2), -(cy + s / 2));
        if (k < 0.5) drawBack(ctx, cx, cy, s, game.accent, hover);
        else drawFront(ctx, cx, cy, s, tl.face, tl.state === 'matched');
        ctx.restore();
        if (i === cursor) {
          ctx.save();
          ctx.strokeStyle = withAlpha('#ffffff', 0.85);
          ctx.lineWidth = 3;
          ctx.strokeRect(cx - 2, cy - 2, s + 4, s + 4);
          ctx.restore();
        }
      });
    },
  };
}

arcadePage({
  game,
  intro: 'Turn two tiles over at a time and find all 18 pairs. Every pair has its own shape and fill. You start on 100 points: a pair earns 2, two that don\'t match cost 2.',
  create: (ctx, input) => createRound(ctx, input),
});

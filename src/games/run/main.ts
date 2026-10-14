import { randomSeed } from '@djayfresh/engine-kit';
import { tone, tones } from '@djayfresh/engine-ui';
import { arcadePage, type Result, type Round } from '../../arcade/page';
import { backdrop, board, easeOut, INK, PIECE, roundRect, withAlpha } from '../../arcade/theme';
import { drawBonus, drawEnemy, drawFlag, drawPlayer } from './art';
import { gameById } from '../../site';
import { BOARDS, type Board, createRun, type Outcome, type Run, SIZE } from './rules';

// Grid Run's page: the rules (rules.ts) on the arcade's board. Tap a cell next
// to you, or use the arrow keys (diagonals on Q, E, Z and C, or the numpad).
// Between boards a banner says which board is next, the way the 2020 game
// paused on its round number.

const game = gameById('run');
const BANNER = 0.9;
const SLIDE = 0.12;

const KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1], KeyW: [0, -1], Numpad8: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1], KeyX: [0, 1], Numpad2: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], Numpad4: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0], Numpad6: [1, 0],
  KeyQ: [-1, -1], Numpad7: [-1, -1], KeyE: [1, -1], Numpad9: [1, -1],
  KeyZ: [-1, 1], Numpad1: [-1, 1], KeyC: [1, 1], Numpad3: [1, 1],
};

function sound(o: Outcome): void {
  if (o === 'step') tone({ freq: 520, duration: 0.05, volume: 0.05, type: 'triangle' });
  else if (o === 'bonus') tones([{ freq: 700, duration: 0.08, volume: 0.07, type: 'triangle' }, { freq: 1050, start: 0.06, duration: 0.1, volume: 0.07, type: 'triangle' }]);
  else if (o === 'hit') tone({ freq: 130, duration: 0.25, volume: 0.09, type: 'sawtooth' });
  else if (o === 'flag' || o === 'done') tones([523, 659, 784].map((freq, i) => ({ freq, start: i * 0.07, duration: 0.12, volume: 0.07, type: 'square' as const })));
  else tone({ freq: 220, duration: 0.05, volume: 0.03, type: 'square' });
}

function createRound(ctx: CanvasRenderingContext2D): Round {
  let run: Run = createRun(randomSeed());
  let width = 1;
  let height = 1;
  let t = 0;
  let banner = BANNER;
  let slide = 1;
  let from = { ...run.board.player };
  let look: [number, number] = [0, 0];
  let shake = 0;
  let flash = 0;
  let result: Result | null = null;
  let shown: Board = run.board;
  const layout = () => {
    const cell = Math.floor(Math.min((width - 32) / SIZE, (height - 72) / SIZE, 96));
    return { cell, x: Math.round((width - cell * SIZE) / 2), y: Math.round((height - cell * SIZE) / 2 + 18) };
  };

  function step(dx: number, dy: number): void {
    if (banner > 0 || result) return;
    const before = { ...run.board.player };
    const o = run.step(dx, dy);
    sound(o);
    if (o === 'blocked') return;
    look = [dx, dy];
    if (o === 'step' || o === 'bonus') {
      from = before;
      slide = 0;
    } else if (o === 'hit') {
      shake = 0.35;
      flash = 0.3;
      banner = BANNER;
    } else if (o === 'flag') {
      flash = 0.25;
      banner = BANNER;
    } else if (o === 'done') {
      result = {
        heading: 'All 25 boards!',
        text: `You cleared every board in ${run.moves} moves.`,
        success: true,
        score: run.moves,
      };
    }
    shown = run.board;
    if (banner > 0) from = { ...run.board.player };
  }

  window.addEventListener('keydown', (e) => {
    const move = KEYS[e.code];
    if (move && !e.repeat) step(move[0], move[1]);
  });

  return {
    reset(seed = randomSeed()) {
      run = createRun(seed);
      shown = run.board;
      from = { ...run.board.player };
      banner = BANNER;
      slide = 1;
      shake = 0;
      flash = 0;
      result = null;
    },
    update(dt) {
      t += dt;
      banner = Math.max(0, banner - dt);
      slide = Math.min(1, slide + dt / SLIDE);
      shake = Math.max(0, shake - dt);
      flash = Math.max(0, flash - dt);
    },
    fit(w, h) {
      width = w;
      height = h;
    },
    pointer(px, py) {
      const { cell, x, y } = layout();
      const cx = Math.floor((px - x) / cell);
      const cy = Math.floor((py - y) / cell);
      step(cx - run.board.player.x, cy - run.board.player.y);
    },
    hud: () => `${run.moves} moves · ${Math.min(run.number, BOARDS)}/${BOARDS}`,
    get result() {
      return result;
    },
    render() {
      backdrop(ctx, width, height, game.accent, t);
      const { cell, x: bx, y: by } = layout();
      const jx = shake > 0 ? Math.sin(t * 90) * shake * 14 : 0;
      ctx.save();
      ctx.translate(jx, 0);
      board(ctx, bx, by, cell, SIZE, SIZE, game.accent);
      const at = (cx: number, cy: number) => [bx + cx * cell, by + cy * cell] as const;
      for (let cx = 0; cx < SIZE; cx++)
        for (let cy = 0; cy < SIZE; cy++) {
          const c = shown.cells[cx][cy];
          const [px, py] = at(cx, cy);
          if (c === 'enemy') drawEnemy(ctx, px, py, cell, (Math.sin(t * 3 + cx + cy) + 1) / 2);
          else if (c === 'flag') drawFlag(ctx, px, py, cell, t);
          else if (c === 'bonus') drawBonus(ctx, px, py, cell, t);
        }
      // Where a tap can go: the cells around you, faintly lit.
      const p = shown.player;
      if (!banner && !result)
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++) {
            const nx = p.x + dx;
            const ny = p.y + dy;
            if ((dx || dy) && nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && shown.cells[nx][ny] === 'empty') {
              const [px, py] = at(nx, ny);
              roundRect(ctx, px + cell * 0.08, py + cell * 0.08, cell * 0.84, cell * 0.84, cell * 0.18);
              ctx.fillStyle = withAlpha(game.accent, 0.08);
              ctx.fill();
            }
          }
      const k = easeOut(slide);
      const [fx, fy] = at(from.x, from.y);
      const [tx, ty] = at(p.x, p.y);
      drawPlayer(ctx, fx + (tx - fx) * k, fy + (ty - fy) * k, cell, look);
      ctx.restore();
      if (flash > 0) {
        ctx.fillStyle = withAlpha(shake > 0 ? PIECE.enemy : PIECE.flag, flash * 0.5);
        ctx.fillRect(0, 0, width, height);
      }
      if (banner > 0 && !result) {
        const a = Math.min(1, banner / 0.25);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(10, 12, 24, 0.6)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = INK.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `800 ${Math.round(Math.min(width, height) * 0.09)}px system-ui, sans-serif`;
        ctx.shadowColor = game.accent;
        ctx.shadowBlur = 24;
        ctx.fillText(`Board ${run.number}`, width / 2, height / 2 - 8);
        ctx.shadowBlur = 0;
        ctx.font = `600 ${Math.round(Math.min(width, height) * 0.035)}px system-ui, sans-serif`;
        ctx.fillStyle = INK.muted;
        ctx.fillText(run.number === 1 ? 'Reach the flag' : `${run.number} red ${run.number === 1 ? 'square' : 'squares'}`, width / 2, height / 2 + Math.min(width, height) * 0.07);
        ctx.restore();
      }
    },
  };
}

arcadePage({
  game,
  intro: 'Tap a square next to you to step there, diagonals too, or use the arrow keys. Reach the flag in as few moves as you can and keep off the red squares: touch one and the board is dealt again. 25 boards in all.',
  create: (ctx) => createRound(ctx),
});

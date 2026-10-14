import { board, INK, PIECE, tile, withAlpha } from '../../arcade/theme';
import { SIZE } from './rules';

// Grid Run's pieces, drawn in code: the game, the home's cabinet and the dev
// Art page all draw them from here.

/** The flag: a pennant on a pole, in its cell. Also drawn by the Art dev page. */
export function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t = 0): void {
  tile(ctx, x, y, s, withAlpha(PIECE.flag, 0.22));
  ctx.save();
  ctx.strokeStyle = INK.text;
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.32, y + s * 0.2);
  ctx.lineTo(x + s * 0.32, y + s * 0.82);
  ctx.stroke();
  const wave = Math.sin(t * 5) * s * 0.03;
  ctx.fillStyle = PIECE.flag;
  ctx.shadowColor = PIECE.flag;
  ctx.shadowBlur = s * 0.25;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.34, y + s * 0.2);
  ctx.lineTo(x + s * 0.78, y + s * 0.32 + wave);
  ctx.lineTo(x + s * 0.34, y + s * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A red square: a block with a hazard cross. */
export function drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, pulse = 0): void {
  const inset = s * 0.08;
  tile(ctx, x + inset, y + inset, s - inset * 2, PIECE.enemy, 0.4 + pulse * 0.4);
  ctx.save();
  ctx.strokeStyle = 'rgba(40, 0, 10, 0.55)';
  ctx.lineWidth = s * 0.07;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.36, y + s * 0.36);
  ctx.lineTo(x + s * 0.64, y + s * 0.64);
  ctx.moveTo(x + s * 0.64, y + s * 0.36);
  ctx.lineTo(x + s * 0.36, y + s * 0.64);
  ctx.stroke();
  ctx.restore();
}

/** The blue bonus: a diamond worth 10 moves. */
export function drawBonus(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t = 0): void {
  const c = s / 2;
  const r = s * (0.28 + Math.sin(t * 4) * 0.02);
  ctx.save();
  ctx.fillStyle = PIECE.bonus;
  ctx.shadowColor = PIECE.bonus;
  ctx.shadowBlur = s * 0.4;
  ctx.beginPath();
  ctx.moveTo(x + c, y + c - r);
  ctx.lineTo(x + c + r, y + c);
  ctx.lineTo(x + c, y + c + r);
  ctx.lineTo(x + c - r, y + c);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = INK.bg;
  ctx.font = `800 ${Math.round(s * 0.18)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('-10', x + c, y + c + 1);
  ctx.restore();
}

/** You: the green block, with eyes looking where you last stepped. */
export function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, look: [number, number] = [0, 0]): void {
  const inset = s * 0.1;
  tile(ctx, x + inset, y + inset, s - inset * 2, PIECE.player, 0.8);
  ctx.save();
  ctx.fillStyle = '#062a1e';
  const ex = look[0] * s * 0.06;
  const ey = look[1] * s * 0.06;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + s / 2 + side * s * 0.12 + ex, y + s * 0.44 + ey, s * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The home cabinet's picture: a board mid-run, the player one step from the flag. */
export function attract(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, accent: string): void {
  const cell = Math.floor(Math.min(w, h) / (SIZE + 1));
  const x = Math.round((w - cell * SIZE) / 2);
  const y = Math.round((h - cell * SIZE) / 2);
  board(ctx, x, y, cell, SIZE, SIZE, accent);
  const enemies = [[1, 1], [4, 0], [2, 3], [5, 4], [0, 4], [3, 5]];
  enemies.forEach(([cx, cy], i) => drawEnemy(ctx, x + cx * cell, y + cy * cell, cell, (Math.sin(t * 3 + i) + 1) / 2));
  drawFlag(ctx, x + 4 * cell, y + 2 * cell, cell, t);
  const hop = (Math.sin(t * 2) + 1) / 2;
  drawPlayer(ctx, x + (2 + hop * 0.15) * cell, y + 2 * cell, cell, [1, 0]);
}

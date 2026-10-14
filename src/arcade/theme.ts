// The arcade's look, shared by the home and every game so they read as one
// set: a deep night-blue board, a faint glowing grid, rounded tiles with a lit
// top edge, and one accent per game (src/site.ts). Drawn in code, so it ships
// no images; the dev server's Art page shows every piece over the board.

export const INK = {
  bg: '#0a0c18',
  board: '#10142a',
  cell: '#161b38',
  cellHi: '#1d2349',
  line: '#262d5c',
  text: '#eef1ff',
  muted: '#9aa3cc',
  shadow: 'rgba(0, 0, 0, 0.45)',
};

/** The 2020 game's colours, brightened: green you, red danger, yellow goal, blue bonus. */
export const PIECE = {
  player: '#3ef0b0',
  enemy: '#ff5d73',
  flag: '#ffc94a',
  bonus: '#5ad7ff',
  wall: '#6b4a2b',
};

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** A tile: a rounded block in `color`, a lit top edge and a soft drop shadow; `glow` haloes it. */
export function tile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, glow = 0): void {
  const r = size * 0.22;
  ctx.save();
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.35 * glow;
  } else {
    ctx.shadowColor = INK.shadow;
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.05;
  }
  roundRect(ctx, x, y, size, size, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  // The lit edge: a lighter band across the top third.
  ctx.save();
  roundRect(ctx, x, y, size, size, r);
  ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + size);
  g.addColorStop(0, 'rgba(255,255,255,0.28)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.04)');
  g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, size, size);
  ctx.restore();
}

/** The board under a grid game: its panel, and an empty slot in every cell. */
export function board(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, cols: number, rows: number, accent: string): void {
  const pad = cell * 0.08;
  ctx.save();
  roundRect(ctx, x - pad * 2, y - pad * 2, cell * cols + pad * 4, cell * rows + pad * 4, cell * 0.3);
  ctx.fillStyle = INK.board;
  ctx.shadowColor = accent;
  ctx.shadowBlur = cell * 0.5;
  ctx.globalAlpha = 1;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x - pad * 2, y - pad * 2, cell * cols + pad * 4, cell * rows + pad * 4, cell * 0.3);
  ctx.strokeStyle = withAlpha(accent, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      roundRect(ctx, x + cx * cell + pad, y + cy * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.18);
      ctx.fillStyle = INK.cell;
      ctx.fill();
    }
  }
}

/** The faint grid behind everything, drifting slowly when `t` moves. */
export function backdrop(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string, t = 0): void {
  ctx.fillStyle = INK.bg;
  ctx.fillRect(0, 0, w, h);
  const step = 32;
  const off = (t * 6) % step;
  ctx.save();
  ctx.strokeStyle = withAlpha(accent, 0.06);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -off; x < w; x += step) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = -off; y < h; y += step) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** `#rrggbb` at an alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Ease out: fast then settling, for a piece sliding into its cell. */
export const easeOut = (t: number): number => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

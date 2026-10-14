import { board, INK, roundRect, tile, withAlpha } from '../../arcade/theme';
import { face, type Fill, type Shape, SIZE } from './rules';

// Memory Grid's tiles, drawn in code: the game, the home's cabinet and the dev
// Art page all draw them from here. A face is a shape and a fill, so it reads
// without colour; each shape also has its own colour.

export const SHAPE_COLOR: Record<Shape, string> = {
  circle: '#ff6b81',
  square: '#3ef0b0',
  triangle: '#ffc94a',
  diamond: '#5ad7ff',
  star: '#ff8fd8',
  hexagon: '#b69bff',
};

function shapePath(ctx: CanvasRenderingContext2D, shape: Shape, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  const poly = (n: number, rot: number, radii?: number[]) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      const rr = radii ? r * radii[i % radii.length] : r;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  if (shape === 'circle') ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
  else if (shape === 'square') roundRect(ctx, cx - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6, r * 0.18);
  else if (shape === 'triangle') poly(3, -Math.PI / 2);
  else if (shape === 'diamond') poly(4, -Math.PI / 2, [1, 0.72]);
  else if (shape === 'star') poly(10, -Math.PI / 2, [1, 0.45]);
  else poly(6, 0);
}

/** One face: `shape` drawn `fill`, centred at cx, cy, radius r. */
export function drawFace(ctx: CanvasRenderingContext2D, shape: Shape, fill: Fill, cx: number, cy: number, r: number): void {
  const color = SHAPE_COLOR[shape];
  const lw = Math.max(2, r * 0.18);
  ctx.save();
  ctx.lineJoin = 'round';
  shapePath(ctx, shape, cx, cy + (shape === 'triangle' ? r * 0.12 : 0), r);
  if (fill === 'solid') {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = r * 0.5;
    ctx.fill();
  } else if (fill === 'outline') {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.shadowColor = color;
    ctx.shadowBlur = r * 0.4;
    ctx.stroke();
  } else {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.beginPath();
    for (let d = -r * 2; d < r * 2; d += r * 0.32) {
      ctx.moveTo(cx + d - r, cy - r * 1.2);
      ctx.lineTo(cx + d + r, cy + r * 1.2);
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
  }
  ctx.restore();
}

/** A tile face down: the accent block with a small grid stamped on it. */
export function drawBack(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, accent: string, hover = false): void {
  tile(ctx, x, y, s, hover ? withAlpha(accent, 0.75) : withAlpha(accent, 0.5));
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = Math.max(1, s * 0.025);
  const m = s * 0.3;
  const step = (s - m * 2) / 3;
  ctx.beginPath();
  for (let i = 0; i <= 3; i++) {
    ctx.moveTo(x + m + i * step, y + m);
    ctx.lineTo(x + m + i * step, y + s - m);
    ctx.moveTo(x + m, y + m + i * step);
    ctx.lineTo(x + s - m, y + m + i * step);
  }
  ctx.stroke();
  ctx.restore();
}

/** A tile face up (or found, dimmed and ringed): the face on a dark tile. */
export function drawFront(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, n: number, found = false): void {
  const { shape, fill } = face(n);
  tile(ctx, x, y, s, found ? INK.cell : INK.cellHi);
  if (found) {
    ctx.save();
    roundRect(ctx, x + 1.5, y + 1.5, s - 3, s - 3, s * 0.22);
    ctx.strokeStyle = withAlpha(SHAPE_COLOR[shape], 0.55);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = found ? 0.75 : 1;
  drawFace(ctx, shape, fill, x + s / 2, y + s / 2, s * 0.3);
  ctx.restore();
}

/** The home cabinet's picture: a board part found, two tiles turning. */
export function attract(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, accent: string): void {
  const cell = Math.floor(Math.min(w, h) / (SIZE + 1));
  const x = Math.round((w - cell * SIZE) / 2);
  const y = Math.round((h - cell * SIZE) / 2);
  board(ctx, x, y, cell, SIZE, SIZE, accent);
  const g = cell * 0.06;
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cx = x + (i % SIZE) * cell + g;
    const cy = y + Math.floor(i / SIZE) * cell + g;
    const s = cell - g * 2;
    const n = (i * 7) % 18;
    if ([3, 9, 14, 20, 27, 31].includes(i)) drawFront(ctx, cx, cy, s, n, true);
    else if (i === 15 || i === 22) {
      const k = Math.abs(Math.sin(t * 1.2));
      ctx.save();
      ctx.translate(cx + s / 2, 0);
      ctx.scale(Math.max(0.02, k), 1);
      ctx.translate(-(cx + s / 2), 0);
      if (Math.sin(t * 1.2) > 0) drawFront(ctx, cx, cy, s, 4);
      else drawBack(ctx, cx, cy, s, accent);
      ctx.restore();
    } else drawBack(ctx, cx, cy, s, accent);
  }
}

export const ART = [
  ...Array.from({ length: 18 }, (_, n) => ({
    name: `${face(n).fill} ${face(n).shape}`,
    draw: (ctx: CanvasRenderingContext2D, size: number) => drawFront(ctx, 2, 2, size - 4, n),
  })),
  { name: 'Face down', draw: (ctx: CanvasRenderingContext2D, size: number) => drawBack(ctx, 2, 2, size - 4, '#b69bff') },
  { name: 'Found', draw: (ctx: CanvasRenderingContext2D, size: number) => drawFront(ctx, 2, 2, size - 4, 4, true) },
];


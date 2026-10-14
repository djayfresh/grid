import { devNav, devNotes } from '@djayfresh/engine-dev';
import { roundRect } from '../src/arcade/theme';
import { attract as memoryArt } from '../src/games/memory/art';
import { attract as runArt } from '../src/games/run/art';
import { attract as zombiesArt } from '../src/games/zombies/art';
import { PAGES } from '../src/pages';
import { GAMES } from '../src/site';

// The face lift's three looks, side by side. A is what the games are built in
// (the real art.ts drawings); B and C are drawn here, as sketches, for the pick.
devNav(PAGES);

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

interface Look {
  id: string;
  title: string;
  blurb: string;
  built?: boolean;
  paint: Paint;
}

const ARTS = [runArt, memoryArt, zombiesArt];

/**
 * Three cabinets, a title over them: the home in any look. Across on a wide
 * screen, stacked on a phone (the canvas is taller there, see mockups.html).
 */
function cabinets(w: number, h: number, face: (i: number, x: number, y: number, cw: number, ch: number) => void, title: (x: number, y: number) => void): void {
  title(24, 40);
  const gap = 18;
  const across = w >= 600;
  const cw = across ? (w - 48 - gap * 2) / 3 : w - 48;
  const ch = across ? h - 90 : (h - 90 - gap * 2) / 3;
  for (let i = 0; i < 3; i++) face(i, across ? 24 + i * (cw + gap) : 24, across ? 70 : 70 + i * (ch + gap), cw, ch);
}

/** Sets `font` at `size` px, or smaller until `text` fits in `room`. */
function fit(ctx: CanvasRenderingContext2D, font: (px: number) => string, size: number, text: string, room: number): void {
  let px = size;
  ctx.font = font(px);
  while (px > 9 && ctx.measureText(text).width > room) ctx.font = font(--px);
}

const neon: Paint = (ctx, w, h, t) => {
  ctx.fillStyle = '#0a0c18';
  ctx.fillRect(0, 0, w, h);
  cabinets(
    w, h,
    (i, x, y, cw, ch) => {
      const g = GAMES[i];
      ctx.save();
      roundRect(ctx, x, y, cw, ch, 16);
      ctx.fillStyle = '#141936';
      ctx.shadowColor = g.accent;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(x + 10, y + 10);
      ARTS[i](ctx, cw - 20, ch - 60, t, g.accent);
      ctx.restore();
      ctx.fillStyle = g.accent;
      fit(ctx, (px) => `900 ${px}px system-ui, sans-serif`, 20, g.title, cw - 28);
      ctx.fillText(g.title, x + 14, y + ch - 20);
    },
    (x, y) => {
      ctx.fillStyle = '#eef1ff';
      ctx.font = '900 30px system-ui, sans-serif';
      ctx.shadowColor = '#7c8cff';
      ctx.shadowBlur = 18;
      ctx.fillText('The Grid', x, y);
      ctx.shadowBlur = 0;
    },
  );
};

/** B: graph paper and ink, the pieces drawn like a notebook doodle. */
const paper: Paint = (ctx, w, h, t) => {
  ctx.fillStyle = '#f6f1e3';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(70, 120, 200, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < w; x += 16) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
  for (let y = 0; y < h; y += 16) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
  ctx.stroke();
  const ink = '#1e2a4a';
  const pencil = ['#2a9d74', '#7a5cc8', '#5b8a1e'];
  const wobble = (x: number, y: number, s: number, i: number) => Math.sin(x * 0.05 + y * 0.07 + i + t * 0.3) * s * 0.03;
  cabinets(
    w, h,
    (i, x, y, cw, ch) => {
      ctx.save();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      roundRect(ctx, x, y, cw, ch, 6);
      ctx.stroke();
      const n = 6;
      const cell = Math.min(cw - 30, ch - 70) / n;
      const ox = x + (cw - cell * n) / 2;
      const oy = y + 12;
      ctx.lineWidth = 1.5;
      for (let k = 0; k <= n; k++) {
        ctx.beginPath();
        ctx.moveTo(ox + k * cell + wobble(k, 0, cell, i), oy);
        ctx.lineTo(ox + k * cell + wobble(k, 9, cell, i), oy + n * cell);
        ctx.moveTo(ox, oy + k * cell + wobble(0, k, cell, i));
        ctx.lineTo(ox + n * cell, oy + k * cell + wobble(9, k, cell, i));
        ctx.stroke();
      }
      // A few pencil-shaded cells.
      ctx.fillStyle = pencil[i];
      ctx.globalAlpha = 0.55;
      for (let k = 0; k < 7; k++) {
        const cx = (k * 5 + i * 2) % n;
        const cy = (k * 3 + i) % n;
        ctx.fillRect(ox + cx * cell + 4, oy + cy * cell + 4, cell - 8, cell - 8);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = ink;
      fit(ctx, (px) => `italic 700 ${px}px Georgia, serif`, 20, GAMES[i].title, cw - 28);
      ctx.fillText(GAMES[i].title, x + 14, y + ch - 18);
      ctx.restore();
    },
    (x, y) => {
      ctx.fillStyle = ink;
      ctx.font = 'italic 800 32px Georgia, serif';
      ctx.fillText('The Grid', x, y);
    },
  );
};

/** C: the 2020 game remastered: black, white tiles, pure primaries, chunky type. */
const remaster: Paint = (ctx, w, h, t) => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const prim = ['#00c853', '#ffd600', '#2962ff', '#d50000', '#6d3b0e'];
  cabinets(
    w, h,
    (i, x, y, cw, ch) => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, cw, ch);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 6, y + 6, cw - 12, ch - 56);
      const n = 6;
      const cell = Math.min(cw - 24, ch - 70) / n;
      const ox = x + (cw - cell * n) / 2;
      const oy = y + 10;
      for (let cx = 0; cx < n; cx++)
        for (let cy = 0; cy < n; cy++) {
          const k = (cx * 7 + cy * 3 + i * 5 + Math.floor(t)) % 11;
          ctx.fillStyle = k < prim.length ? prim[k] : '#fff';
          ctx.fillRect(ox + cx * cell + 2, oy + cy * cell + 2, cell - 4, cell - 4);
        }
      ctx.fillStyle = '#000';
      fit(ctx, (px) => `900 ${px}px ui-monospace, monospace`, 22, GAMES[i].title.toUpperCase(), cw - 24);
      ctx.fillText(GAMES[i].title.toUpperCase(), x + 12, y + ch - 16);
    },
    (x, y) => {
      ctx.fillStyle = '#fff';
      ctx.font = '900 32px ui-monospace, monospace';
      ctx.fillText('THE GRID', x, y);
    },
  );
};

const LOOKS: Look[] = [
  { id: 'neon', title: 'A. Neon arcade', built: true, blurb: 'Night-blue boards, glowing rounded tiles, an accent colour per game. What the games are built in now.', paint: neon },
  { id: 'paper', title: 'B. Graph paper', blurb: 'Cream graph paper, ink lines that wobble a little, pencil-shaded pieces. Light, calm, notebook doodles.', paint: paper },
  { id: 'remaster', title: 'C. 2020 remastered', blurb: 'The 2020 game made crisp: black, white tiles, pure primary colours and chunky monospace type.', paint: remaster },
];

const list = document.querySelector('.looks')!;
const notes = await devNotes('mockups');

const canvases: { canvas: HTMLCanvasElement; look: Look }[] = [];
for (const look of LOOKS) {
  const section = document.createElement('section');
  section.className = 'look';
  const h2 = document.createElement('h2');
  h2.textContent = look.title;
  if (look.built) h2.append(Object.assign(document.createElement('span'), { className: 'tag', textContent: 'built' }));
  const canvas = document.createElement('canvas');
  section.append(h2, Object.assign(document.createElement('p'), { textContent: look.blurb }), canvas, notes.box(look.id, `Notes on ${look.title}`));
  list.append(section);
  canvases.push({ canvas, look });
}
list.append(notes.box('all', 'Which look, and anything to change'));

function frame(now: number): void {
  for (const { canvas, look } of canvases) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    look.paint(ctx, w, h, now / 1000);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

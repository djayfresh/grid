import { INK, PIECE, roundRect, tile, withAlpha } from '../../arcade/theme';
import type { Bullet, Enemy, Player } from './rules';
import type { Barricade, House, Rect, Spawner, TownMap } from './world';

// Zombie Grid's pieces, drawn in code in the arcade's neon look: the game
// draws them in world units (the 2020 game's pixels) under its camera, the
// home's cabinet and the dev Art page draw them from here too.

export const ZC = {
  grass: '#0b1719',
  grassHi: '#12262a',
  tuft: '#1b3a33',
  asphalt: '#161b36',
  dash: '#3b4478',
  path: '#242b52',
  floor: '#261b2c',
  plank: '#2f2236',
  wall: '#f0bf7e',
  rot: '#86b83c',
  rotDark: '#3e5a1b',
  eye: '#ff3b4f',
  you: PIECE.bonus,
  bullet: '#fff4b0',
  spawner: '#3a2150',
  roof: '#56306c',
  toxic: '#b6f53c',
  wood: '#8c5a2c',
  woodDark: '#5a3717',
  hazard: '#ffb02e',
  safe: PIECE.flag,
};

/** A small bar: dark track, coloured fill. */
export function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frac: number, color: string, glow = 0): void {
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(5, 6, 14, 0.75)';
  ctx.fill();
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0) {
    roundRect(ctx, x, y, Math.max(h, w * f), h, h / 2);
    ctx.fillStyle = color;
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.fill();
  }
  ctx.restore();
}

const hash = (x: number, y: number): number => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** The grass inside the town's edge, a faint lime grid and scattered tufts, over `view` only. */
export function drawGround(ctx: CanvasRenderingContext2D, bounds: Rect, view: Rect, accent: string): void {
  ctx.save();
  ctx.shadowColor = withAlpha(accent, 0.5);
  ctx.shadowBlur = 30;
  roundRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, 24);
  ctx.fillStyle = ZC.grass;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, 24);
  ctx.clip();
  const x0 = Math.max(bounds.x, Math.floor(view.x / 20) * 20);
  const y0 = Math.max(bounds.y, Math.floor(view.y / 20) * 20);
  const x1 = Math.min(bounds.x + bounds.w, view.x + view.w);
  const y1 = Math.min(bounds.y + bounds.h, view.y + view.h);
  ctx.strokeStyle = withAlpha(accent, 0.05);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 20) {
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
  }
  for (let y = y0; y <= y1; y += 20) {
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
  ctx.strokeStyle = ZC.tuft;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let x = x0; x < x1; x += 20)
    for (let y = y0; y < y1; y += 20) {
      const h = hash(x, y);
      if (h > 0.55) continue;
      const tx = x + hash(y, x) * 16 + 2;
      const ty = y + h * 30;
      ctx.moveTo(tx - 2, ty);
      ctx.lineTo(tx - 3, ty - 3);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty - 4);
      ctx.moveTo(tx + 2, ty);
      ctx.lineTo(tx + 3, ty - 3);
    }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  roundRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, 24);
  ctx.strokeStyle = withAlpha(accent, 0.3);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** Streets: lit kerbs, asphalt over them (so crossings merge), and centre dashes between crossings. */
export function drawRoads(ctx: CanvasRenderingContext2D, roads: Rect[], accent: string): void {
  ctx.save();
  ctx.strokeStyle = withAlpha(accent, 0.55);
  ctx.shadowColor = accent;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  for (const r of roads) ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
  ctx.fillStyle = ZC.asphalt;
  for (const r of roads) ctx.fillRect(r.x, r.y, r.w, r.h);
  // A soft sheen down the middle of each street.
  for (const r of roads) {
    const along = r.w > r.h;
    const g = along ? ctx.createLinearGradient(0, r.y, 0, r.y + r.h) : ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(120,140,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.save();
  ctx.strokeStyle = ZC.dash;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  for (const r of roads) {
    const along = r.w > r.h;
    // The stretches of this street not covered by a crossing one.
    const cuts = roads
      .filter((o) => o !== r && (o.w > o.h) !== along)
      .map((o) => (along ? [o.x, o.x + o.w] : [o.y, o.y + o.h]))
      .sort((a, b) => a[0] - b[0]);
    let from = along ? r.x : r.y;
    const end = along ? r.x + r.w : r.y + r.h;
    const segs: [number, number][] = [];
    for (const [a, b] of cuts) {
      if (b <= from || a >= end) continue;
      if (a > from) segs.push([from, a]);
      from = Math.max(from, b);
    }
    if (from < end) segs.push([from, end]);
    ctx.beginPath();
    for (const [a, b] of segs) {
      if (b - a < 24) continue;
      if (along) {
        ctx.moveTo(a + 6, r.y + r.h / 2);
        ctx.lineTo(b - 6, r.y + r.h / 2);
      } else {
        ctx.moveTo(r.x + r.w / 2, a + 6);
        ctx.lineTo(r.x + r.w / 2, b - 6);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** A driveway: paving stones. */
export function drawPath(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.fillStyle = ZC.path;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(10, 12, 30, 0.55)';
  ctx.lineWidth = 1;
  const along = r.w >= r.h;
  const len = along ? r.w : r.h;
  for (let i = 10; i < len; i += 10) {
    ctx.beginPath();
    if (along) {
      ctx.moveTo(r.x + i, r.y);
      ctx.lineTo(r.x + i, r.y + r.h);
    } else {
      ctx.moveTo(r.x, r.y + i);
      ctx.lineTo(r.x + r.w, r.y + i);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** A home seen from above: plank floor, a rug and a table, warm lit walls. */
export function drawHouse(ctx: CanvasRenderingContext2D, h: House): void {
  ctx.save();
  ctx.shadowColor = INK.shadow;
  ctx.shadowBlur = 12;
  ctx.fillStyle = ZC.floor;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.restore();
  ctx.strokeStyle = ZC.plank;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = h.y + 8; y < h.y + h.h; y += 8) {
    ctx.moveTo(h.x, y);
    ctx.lineTo(h.x + h.w, y);
  }
  ctx.stroke();
  // Furniture, scaled to the house.
  const s = h.w / 200;
  roundRect(ctx, h.x + 90 * s, h.y + 90 * s, 70 * s, 50 * s, 6 * s);
  ctx.fillStyle = 'rgba(182, 155, 255, 0.12)';
  ctx.fill();
  roundRect(ctx, h.x + 110 * s, h.y + 105 * s, 30 * s, 20 * s, 3 * s);
  ctx.fillStyle = '#4a3326';
  ctx.fill();
  roundRect(ctx, h.x + 8 * s, h.y + 8 * s, 40 * s, 10 * s, 2 * s);
  ctx.fillStyle = '#3a3f5c';
  ctx.fill();
  roundRect(ctx, h.x + 150 * s, h.y + 160 * s, 40 * s, 30 * s, 4 * s);
  ctx.fillStyle = '#35284a';
  ctx.fill();
  ctx.save();
  ctx.fillStyle = ZC.wall;
  ctx.shadowColor = ZC.wall;
  ctx.shadowBlur = 8;
  for (const w of h.walls) ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.restore();
}

function hitFlash(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, flash: number, r: number): void {
  if (flash <= 0) return;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, flash * 6)})`;
  ctx.fill();
  ctx.restore();
}

/** A spawner house: a boarded-up purple shack, its door and windows glowing toxic green. */
export function drawSpawner(ctx: CanvasRenderingContext2D, s: Pick<Spawner, 'x' | 'y' | 'w' | 'h' | 'health' | 'max' | 'flash'>, t: number): void {
  const { x, y, w, h } = s;
  const pulse = (Math.sin(t * 3 + x) + 1) / 2;
  tile(ctx, x, y, w, ZC.spawner);
  // Roof: two slopes meeting at a ridge.
  ctx.save();
  roundRect(ctx, x, y, w, h, w * 0.22);
  ctx.clip();
  ctx.fillStyle = ZC.roof;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h * 0.42);
  ctx.lineTo(x + w / 2, y + h * 0.22);
  ctx.lineTo(x, y + h * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = w * 0.03;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(x + (w / 4) * i, y);
    ctx.lineTo(x + (w / 4) * i, y + h * 0.3);
  }
  ctx.stroke();
  ctx.restore();
  // Glowing windows and the door the zombies come out of.
  ctx.save();
  ctx.fillStyle = withAlpha(ZC.toxic, 0.55 + pulse * 0.45);
  ctx.shadowColor = ZC.toxic;
  ctx.shadowBlur = w * (0.2 + pulse * 0.25);
  ctx.fillRect(x + w * 0.14, y + h * 0.5, w * 0.18, h * 0.14);
  ctx.fillRect(x + w * 0.68, y + h * 0.5, w * 0.18, h * 0.14);
  roundRect(ctx, x + w * 0.4, y + h * 0.62, w * 0.2, h * 0.38, w * 0.05);
  ctx.fill();
  ctx.restore();
  // Boards nailed across the windows.
  ctx.strokeStyle = ZC.woodDark;
  ctx.lineWidth = w * 0.05;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.53);
  ctx.lineTo(x + w * 0.34, y + h * 0.62);
  ctx.moveTo(x + w * 0.66, y + h * 0.62);
  ctx.lineTo(x + w * 0.88, y + h * 0.53);
  ctx.stroke();
  hitFlash(ctx, x, y, w, h, s.flash, w * 0.22);
  if (s.health < s.max) bar(ctx, x + 2, y - 7, w - 4, 4, s.health / s.max, PIECE.enemy, 4);
}

/** A barricade: planks across the street with hazard stripes; the one gating the safe house glows. */
export function drawBarricade(ctx: CanvasRenderingContext2D, b: Pick<Barricade, 'x' | 'y' | 'w' | 'h' | 'health' | 'max' | 'flash' | 'mandatory'>, t: number): void {
  const { x, y, w, h } = b;
  const r = Math.min(w, h) * 0.25;
  ctx.save();
  if (b.mandatory) {
    ctx.shadowColor = ZC.hazard;
    ctx.shadowBlur = 10 + Math.sin(t * 4) * 4;
  } else {
    ctx.shadowColor = INK.shadow;
    ctx.shadowBlur = 6;
  }
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = ZC.wood;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  // Plank seams along the long side.
  const along = w > h;
  ctx.strokeStyle = ZC.woodDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 3; i++) {
    if (along) {
      ctx.moveTo(x, y + (h / 3) * i);
      ctx.lineTo(x + w, y + (h / 3) * i);
    } else {
      ctx.moveTo(x + (w / 3) * i, y);
      ctx.lineTo(x + (w / 3) * i, y + h);
    }
  }
  ctx.stroke();
  // Hazard stripes.
  ctx.fillStyle = withAlpha(ZC.hazard, 0.85);
  const long = Math.max(w, h);
  for (let i = -long; i < long * 2; i += 10) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + 4, y);
    ctx.lineTo(x + i + 4 - h, y + h);
    ctx.lineTo(x + i - h, y + h);
    ctx.closePath();
    ctx.globalAlpha = 0.5;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Damage: cracks as it weakens.
  const dmg = 1 - b.health / b.max;
  if (dmg > 0.3) {
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y);
    ctx.lineTo(x + w * 0.45, y + h * 0.5);
    ctx.lineTo(x + w * 0.35, y + h);
    if (dmg > 0.6) {
      ctx.moveTo(x + w * 0.7, y);
      ctx.lineTo(x + w * 0.6, y + h * 0.6);
      ctx.lineTo(x + w * 0.75, y + h);
    }
    ctx.stroke();
  }
  ctx.restore();
  hitFlash(ctx, x, y, w, h, b.flash, r);
  if (b.health < b.max) bar(ctx, x + w / 2 - 12, y - 7, 24, 4, b.health / b.max, ZC.hazard, 4);
}

/** The safe house at the end of the spur: a gold house with a beacon pulsing out of it. */
export function drawSafeHouse(ctx: CanvasRenderingContext2D, o: Rect, t: number, open = true): void {
  const cx = o.x + o.w / 2;
  const cy = o.y + o.h / 2;
  const pulse = (t * 0.8) % 1;
  ctx.save();
  // Rings spreading from the doorstep.
  if (open) {
    ctx.strokeStyle = withAlpha(ZC.safe, 0.6 * (1 - pulse));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, o.w * (0.4 + pulse * 0.9), 0, Math.PI * 2);
    ctx.stroke();
  }
  // The house itself, beyond the end of the street.
  const hx = o.x + o.w - 4;
  const hy = o.y - 20;
  const hw = 70;
  const hh = o.h + 40;
  ctx.shadowColor = ZC.safe;
  ctx.shadowBlur = open ? 24 : 10;
  roundRect(ctx, hx, hy, hw, hh, 10);
  ctx.fillStyle = '#3a2f12';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = ZC.safe;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Roof ridge and a cross on top: a safe place.
  ctx.strokeStyle = withAlpha(ZC.safe, 0.5);
  ctx.beginPath();
  ctx.moveTo(hx + 6, hy + hh / 2);
  ctx.lineTo(hx + hw - 6, hy + hh / 2);
  ctx.stroke();
  ctx.fillStyle = ZC.safe;
  ctx.shadowColor = ZC.safe;
  ctx.shadowBlur = 12;
  const px = hx + hw / 2 + 4;
  const py = hy + hh / 2;
  ctx.fillRect(px - 3, py - 10, 6, 20);
  ctx.fillRect(px - 10, py - 3, 20, 6);
  ctx.restore();
  // The doorstep: a lit mat on the street.
  ctx.save();
  roundRect(ctx, o.x + 4, o.y + 6, o.w - 4, o.h - 12, 6);
  ctx.fillStyle = withAlpha(ZC.safe, open ? 0.28 + Math.sin(t * 4) * 0.08 : 0.12);
  ctx.fill();
  ctx.restore();
}

/** A zombie: a rotting green lump with patches, reaching arms and red eyes when it has seen you. */
export function drawZombie(ctx: CanvasRenderingContext2D, e: Pick<Enemy, 'x' | 'y' | 'w' | 'h' | 'health' | 'max' | 'flash' | 'chasing'>, t: number, toward: { x: number; y: number } = { x: 0, y: 1 }): void {
  const s = e.w * 1.3;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const wob = Math.sin(t * 7 + e.x * 0.3) * 0.12;
  const ang = Math.atan2(toward.y, toward.x);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang - Math.PI / 2 + wob);
  // Arms, reaching.
  ctx.strokeStyle = ZC.rotDark;
  ctx.lineWidth = s * 0.18;
  ctx.lineCap = 'round';
  const reach = s * (0.55 + Math.sin(t * 6 + e.y) * 0.08);
  ctx.beginPath();
  ctx.moveTo(-s * 0.32, s * 0.1);
  ctx.lineTo(-s * 0.3, reach);
  ctx.moveTo(s * 0.32, s * 0.1);
  ctx.lineTo(s * 0.3, reach * 0.9);
  ctx.stroke();
  // Body.
  ctx.shadowColor = e.chasing ? withAlpha(ZC.eye, 0.6) : 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = s * 0.5;
  roundRect(ctx, -s / 2, -s / 2, s, s, s * 0.32);
  ctx.fillStyle = ZC.rot;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Rot patches.
  ctx.fillStyle = ZC.rotDark;
  ctx.beginPath();
  ctx.arc(-s * 0.18, -s * 0.22, s * 0.12, 0, Math.PI * 2);
  ctx.arc(s * 0.22, -s * 0.05, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Eyes, facing you.
  ctx.fillStyle = e.chasing ? ZC.eye : '#c9c26a';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = e.chasing ? s * 0.6 : 0;
  ctx.beginPath();
  ctx.arc(-s * 0.16, s * 0.18, s * 0.09, 0, Math.PI * 2);
  ctx.arc(s * 0.16, s * 0.18, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  hitFlash(ctx, cx - s / 2, cy - s / 2, s, s, e.flash, s * 0.32);
  if (e.health < e.max) bar(ctx, cx - 9, e.y - 7, 18, 3, e.health / e.max, PIECE.enemy);
}

/** You: a glowing blue block with a gun pointing where you aim. */
export function drawPlayer(ctx: CanvasRenderingContext2D, p: Pick<Player, 'x' | 'y' | 'w' | 'h' | 'aimX' | 'aimY' | 'flash'>, t: number, weapon = 0): void {
  const s = p.w * 1.4;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  ctx.save();
  // A soft pool of light under you, so you read on any ground.
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 2.4);
  g.addColorStop(0, withAlpha(ZC.you, 0.25));
  g.addColorStop(1, withAlpha(ZC.you, 0));
  ctx.fillStyle = g;
  ctx.fillRect(cx - s * 2.4, cy - s * 2.4, s * 4.8, s * 4.8);
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(p.aimY, p.aimX));
  // The gun: longer for the sniper, chunkier for the machine gun.
  const len = [s * 0.75, s * 0.7, s * 1.05][weapon] ?? s * 0.75;
  const thick = [s * 0.2, s * 0.28, s * 0.16][weapon] ?? s * 0.2;
  ctx.fillStyle = '#d8e4ff';
  ctx.fillRect(s * 0.2, -thick / 2, len, thick);
  ctx.rotate(-Math.atan2(p.aimY, p.aimX));
  tile(ctx, -s / 2, -s / 2, s, ZC.you, 0.9 + Math.sin(t * 5) * 0.1);
  // Eyes toward the aim.
  ctx.fillStyle = '#04202e';
  const ex = p.aimX * s * 0.12;
  const ey = p.aimY * s * 0.12;
  const nx = -p.aimY;
  const ny = p.aimX;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(ex + nx * side * s * 0.16, ey + ny * side * s * 0.16, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (p.flash > 0) {
    ctx.save();
    roundRect(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.22);
    ctx.fillStyle = withAlpha(PIECE.enemy, Math.min(0.9, p.flash * 4));
    ctx.fill();
    ctx.restore();
  }
}

/** A bullet: a bright streak behind it; sniper rounds burn longer and whiter. */
export function drawBullet(ctx: CanvasRenderingContext2D, b: Pick<Bullet, 'x' | 'y' | 'vx' | 'vy' | 'damage'>): void {
  const sniper = b.damage >= 2;
  const tail = sniper ? 0.06 : 0.03;
  ctx.save();
  ctx.strokeStyle = sniper ? '#ffffff' : ZC.bullet;
  ctx.shadowColor = sniper ? PIECE.bonus : '#ffd84a';
  ctx.shadowBlur = 8;
  ctx.lineWidth = sniper ? 2.4 : 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(b.x - b.vx * tail, b.y - b.vy * tail);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

/** The whole town under the camera: ground, streets, homes, the safe house, spawners and barricades. */
export function drawTown(ctx: CanvasRenderingContext2D, map: TownMap, view: Rect, t: number, accent: string): void {
  drawGround(ctx, map.bounds, view, accent);
  drawRoads(ctx, map.roads, accent);
  for (const p of map.paths) drawPath(ctx, p);
  for (const h of map.houses) drawHouse(ctx, h);
  drawSafeHouse(ctx, map.objective, t, !map.barricades.some((b) => b.mandatory && b.health > 0));
  for (const s of map.spawners) if (s.health > 0) drawSpawner(ctx, s, t);
  for (const b of map.barricades) if (b.health > 0) drawBarricade(ctx, b, t);
}

/** Draws `fn` (which draws in a box of `world` units) centred in a size x size square. */
function fit(ctx: CanvasRenderingContext2D, size: number, world: number, fn: () => void): void {
  ctx.save();
  ctx.scale(size / world, size / world);
  fn();
  ctx.restore();
}

export const ART: { name: string; draw(ctx: CanvasRenderingContext2D, size: number): void }[] = [
  { name: 'You', draw: (ctx, s) => fit(ctx, s, 28, () => drawPlayer(ctx, { x: 9, y: 9, w: 10, h: 10, aimX: 1, aimY: -0.3, flash: 0 }, 0)) },
  { name: 'You (sniper)', draw: (ctx, s) => fit(ctx, s, 28, () => drawPlayer(ctx, { x: 7, y: 9, w: 10, h: 10, aimX: 1, aimY: 0, flash: 0 }, 0, 2)) },
  { name: 'Zombie', draw: (ctx, s) => fit(ctx, s, 26, () => drawZombie(ctx, { x: 8, y: 6, w: 10, h: 10, health: 3, max: 3, flash: 0, chasing: true }, 0)) },
  { name: 'Zombie (idle, hurt)', draw: (ctx, s) => fit(ctx, s, 26, () => drawZombie(ctx, { x: 8, y: 8, w: 10, h: 10, health: 2, max: 5, flash: 0, chasing: false }, 0.5)) },
  { name: 'Spawner house', draw: (ctx, s) => fit(ctx, s, 56, () => drawSpawner(ctx, { x: 8, y: 10, w: 40, h: 40, health: 30, max: 30, flash: 0 }, 0)) },
  { name: 'Spawner (damaged)', draw: (ctx, s) => fit(ctx, s, 56, () => drawSpawner(ctx, { x: 8, y: 10, w: 40, h: 40, health: 12, max: 30, flash: 0 }, 1)) },
  { name: 'Barricade', draw: (ctx, s) => fit(ctx, s, 56, () => { drawRoads(ctx, [{ x: 8, y: 0, w: 40, h: 56 }], ZC.toxic); drawBarricade(ctx, { x: 8, y: 18, w: 40, h: 20, health: 14, max: 14, flash: 0, mandatory: false }, 0); }) },
  { name: 'Barricade (gate)', draw: (ctx, s) => fit(ctx, s, 56, () => { drawRoads(ctx, [{ x: 0, y: 8, w: 56, h: 40 }], ZC.toxic); drawBarricade(ctx, { x: 18, y: 8, w: 20, h: 40, health: 8, max: 20, flash: 0, mandatory: true }, 0); }) },
  { name: 'Safe house', draw: (ctx, s) => fit(ctx, s, 130, () => { drawRoads(ctx, [{ x: -10, y: 45, w: 60, h: 40 }], ZC.toxic); drawSafeHouse(ctx, { x: 10, y: 45, w: 40, h: 40 }, 0.3); }) },
  { name: 'Home', draw: (ctx, s) => fit(ctx, s, 220, () => drawHouse(ctx, { x: 10, y: 10, w: 200, h: 200, walls: [[0, 0, 200, 2], [198, 0, 2, 200], [0, 198, 200, 2], [0, 0, 2, 40], [0, 80, 2, 120], [0, 50, 60, 2], [60, 0, 2, 15], [60, 35, 2, 17]].map(([x, y, w, h]) => ({ x: x + 10, y: y + 10, w, h })) })) },
  { name: 'Crossing', draw: (ctx, s) => fit(ctx, s, 100, () => drawRoads(ctx, [{ x: 0, y: 30, w: 100, h: 40 }, { x: 30, y: 0, w: 40, h: 100 }], ZC.toxic)) },
  { name: 'Driveway', draw: (ctx, s) => fit(ctx, s, 60, () => drawPath(ctx, { x: 0, y: 10, w: 60, h: 40 })) },
  { name: 'Grass', draw: (ctx, s) => fit(ctx, s, 80, () => drawGround(ctx, { x: 0, y: 0, w: 80, h: 80 }, { x: 0, y: 0, w: 80, h: 80 }, ZC.toxic)) },
  { name: 'Bullets', draw: (ctx, s) => fit(ctx, s, 40, () => { drawBullet(ctx, { x: 30, y: 12, vx: 320, vy: 0, damage: 1 }); drawBullet(ctx, { x: 34, y: 26, vx: 320, vy: 0, damage: 10 }); }) },
];

/**
 * The home cabinet's picture: a crossing at night, a spawner house letting
 * zombies out, and you in the middle turning to shoot them down.
 */
export function attract(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, accent: string): void {
  const world = 150;
  const k = Math.min(w, h) / world;
  ctx.save();
  ctx.translate((w - world * k) / 2, (h - world * k) / 2);
  ctx.scale(k, k);
  const view = { x: 0, y: 0, w: world, h: world };
  ctx.save();
  roundRect(ctx, 0, 0, world, world, 14);
  ctx.clip();
  ctx.fillStyle = ZC.grass;
  ctx.fillRect(0, 0, world, world);
  drawGround(ctx, { x: 0, y: 0, w: world, h: world }, view, accent);
  const roads = [
    { x: -10, y: 75, w: world + 20, h: 40 },
    { x: 45, y: -10, w: 40, h: world + 20 },
  ];
  drawRoads(ctx, roads, accent);
  drawSpawner(ctx, { x: 98, y: 22, w: 40, h: 40, health: 30, max: 30, flash: 0 }, t);
  drawBarricade(ctx, { x: 45, y: 8, w: 40, h: 14, health: 10, max: 14, flash: 0, mandatory: false }, t);
  const you = { x: 60, y: 90, w: 10, h: 10 };
  const c = { x: 65, y: 95 };
  // Three zombies loop out of the door and walk at you; each one drops in turn.
  const zs = [0, 1, 2].map((i) => {
    const phase = ((t * 0.3 + i / 3) % 1 + 1) % 1;
    const door = { x: 118, y: 62 };
    const end = { x: c.x + 14, y: c.y - 6 + i * 4 };
    return { x: door.x + (end.x - door.x) * phase - 5, y: door.y + (end.y - door.y) * phase - 5, phase };
  });
  const target = zs.reduce((a, b) => (b.phase > a.phase ? b : a));
  const ax = target.x + 5 - c.x;
  const ay = target.y + 5 - c.y;
  const len = Math.hypot(ax, ay) || 1;
  for (const z of zs) {
    if (z.phase > 0.85) continue;
    drawZombie(ctx, { x: z.x, y: z.y, w: 10, h: 10, health: 3, max: 3, flash: z === target && z.phase > 0.7 ? 0.1 : 0, chasing: z.phase > 0.2 }, t, { x: c.x - z.x, y: c.y - z.y });
  }
  // A shot every so often toward the leading zombie.
  const shot = (t * 3) % 1;
  drawBullet(ctx, { x: c.x + (ax / len) * (8 + shot * len * 0.9), y: c.y + (ay / len) * (8 + shot * len * 0.9), vx: (ax / len) * 320, vy: (ay / len) * 320, damage: 1 });
  drawPlayer(ctx, { ...you, aimX: ax / len, aimY: ay / len, flash: 0 }, t);
  ctx.restore();
  ctx.restore();
}

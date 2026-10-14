import { shareButton, topBar } from '@djayfresh/engine-ui';
import { initMode, modeButton } from '../arcade/mode';
import { beats } from '../arcade/score';
import { backdrop, INK, withAlpha } from '../arcade/theme';
import { attract as memoryArt } from '../games/memory/art';
import { attract as runArt } from '../games/run/art';
import { attract as zombiesArt } from '../games/zombies/art';
import { type ArcadeGame, DESCRIPTION, GAME_URL, GAMES, TITLE } from '../site';
import '../style.css';
import './home.css';

// The Grid's home, playallday.games/grid/: a cabinet per game with a moving
// picture of it, the player's best, and the way in; under them, the high
// scores the 2020 version kept on its own server, as a plaque.

type Art = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, accent: string) => void;
const ART: Record<ArcadeGame['id'], Art> = { run: runArt, memory: memoryArt, zombies: zombiesArt };

/** The 2020 server's high-score.json, as it was left. */
const PLAQUE: { game: ArcadeGame['id']; name: string; score: number }[] = [
  { game: 'run', name: 'DJF', score: 28 },
  { game: 'zombies', name: 'TTT', score: 10 },
  { game: 'memory', name: 'DJF', score: 108 },
];

initMode();
topBar({ title: TITLE, right: [modeButton(), shareButton({ url: GAME_URL, title: TITLE, text: DESCRIPTION }, 'Share', 'link')] });

/** The best from a game's save, read straight from storage.js (same prefix as the game writes). */
function best(game: ArcadeGame): number | null {
  const v = window.playallday?.storage?.(game.slug)?.getJSON<number | null>('best', null) ?? null;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

const list = document.querySelector<HTMLUListElement>('.cabinets')!;
const pictures: { canvas: HTMLCanvasElement; game: ArcadeGame }[] = [];
const bests: { el: HTMLElement; game: ArcadeGame }[] = [];

for (const game of GAMES) {
  const li = document.createElement('li');
  li.className = 'cabinet';
  li.style.setProperty('--accent', game.accent);
  const a = document.createElement('a');
  a.href = `/${game.slug}/`;
  const canvas = document.createElement('canvas');
  canvas.className = 'screen';
  canvas.setAttribute('aria-hidden', 'true');
  const h2 = Object.assign(document.createElement('h2'), { textContent: game.title });
  const p = Object.assign(document.createElement('p'), { textContent: game.tagline });
  const meta = document.createElement('p');
  meta.className = 'meta';
  const b = document.createElement('span');
  b.className = 'cab-best';
  const play = Object.assign(document.createElement('span'), { className: 'play', textContent: 'Play' });
  meta.append(b, play);
  a.append(canvas, h2, p, meta);
  li.append(a);
  list.append(li);
  pictures.push({ canvas, game });
  bests.push({ el: b, game });
}

function showBests(): void {
  for (const { el, game } of bests) {
    const v = best(game);
    el.textContent = v === null ? `${game.direction === 'low' ? 'Fewest' : game.metric === 'Score' ? 'Highest' : 'Most'} ${game.metric.toLowerCase()} wins` : `Your best: ${v}${game.metric === 'Score' ? '' : ` ${game.metric.toLowerCase()}`}`;
  }
}
showBests();
window.addEventListener('playallday:sync', showBests);

const plaque = document.querySelector<HTMLElement>('.plaque')!;
plaque.innerHTML = '<h2>High scores, 2020</h2>';
const ol = document.createElement('ol');
for (const row of PLAQUE) {
  const game = GAMES.find((g) => g.id === row.game)!;
  const li = document.createElement('li');
  li.style.setProperty('--accent', game.accent);
  const mine = best(game);
  const beaten = mine !== null && beats(game.direction, mine, row.score);
  li.innerHTML = `<span class="pg">${game.title}</span><span class="pn">${row.name}</span><span class="ps">${row.score}</span>${beaten ? '<span class="pb">beaten</span>' : ''}`;
  ol.append(li);
}
plaque.append(ol, Object.assign(document.createElement('p'), { textContent: 'Kept by the 2020 version on its own little server. Sign in on playallday.games and your scores go on the leaderboards.' }));

// The pictures and the hero's grid: drawn while on screen, still when motion is reduced.
const hero = document.querySelector<HTMLCanvasElement>('.hero-grid')!;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
function size(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = c.clientWidth || 1;
  const h = c.clientHeight || 1;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
function frame(now: number): void {
  const t = still ? 2 : now / 1000;
  const hc = size(hero);
  backdrop(hc, hero.clientWidth, hero.clientHeight, '#7c8cff', t);
  // A few lit cells drifting across the hero, one per game.
  GAMES.forEach((g, i) => {
    const cellSize = 32;
    const cols = Math.ceil(hero.clientWidth / cellSize);
    const cx = Math.floor((t * 0.6 + i * 7) % cols);
    const cy = 1 + ((i * 3) % Math.max(1, Math.floor(hero.clientHeight / cellSize) - 1));
    hc.fillStyle = withAlpha(g.accent, 0.35);
    hc.fillRect(cx * cellSize + 1, cy * cellSize + 1, cellSize - 1, cellSize - 1);
  });
  for (const { canvas, game } of pictures) {
    const ctx = size(canvas);
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ART[game.id](ctx, canvas.clientWidth, canvas.clientHeight, t, game.accent);
  }
  if (!still) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Held still (reduced motion), the pictures only redraw when the colours change.
window.addEventListener('grid:theme', () => {
  if (still) requestAnimationFrame(frame);
});

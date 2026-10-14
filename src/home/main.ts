import { shareButton, topBar } from '@djayfresh/engine-ui';
import { initMode, modeButton } from '../arcade/mode';
import { INK } from '../arcade/theme';
import { attract as memoryArt } from '../games/memory/art';
import { attract as runArt } from '../games/run/art';
import { attract as zombiesArt } from '../games/zombies/art';
import { type ArcadeGame, DESCRIPTION, GAME_URL, GAMES, MENU, TITLE } from '../site';
import '../style.css';
import './home.css';

// The main menu, playallday.games/grid/: a cabinet per game with a moving
// picture of it, the player's best, and the way in. Every game's Main menu
// comes back here. It has no hub card ("card": false in the hub's games.json);
// The Grid's story and its 2020 high scores are on djayfresh.com.

type Art = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, accent: string) => void;
const ART: Record<ArcadeGame['id'], Art> = { run: runArt, memory: memoryArt, zombies: zombiesArt };

initMode();
topBar({ title: MENU, right: [modeButton(), shareButton({ url: GAME_URL, title: TITLE, text: DESCRIPTION }, 'Share', 'link')] });

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

// The pictures: drawn every frame, still when motion is reduced.
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

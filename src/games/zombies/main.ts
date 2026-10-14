import { randomSeed } from '@djayfresh/engine-kit';
import { tone, tones } from '@djayfresh/engine-ui';
import { arcadePage, type Input, type Result, type Round } from '../../arcade/page';
// The town is always at night, light mode or not, so its HUD keeps the dark palette.
import { backdrop, DARK as NIGHT, PIECE, roundRect, withAlpha } from '../../arcade/theme';
import { gameById } from '../../site';
import { bar, drawBullet, drawPlayer, drawTown, drawZombie, ZC } from './art';
import { levelProgress } from './leveling';
import { createGame, type Controls, type Game, type GameEvent, MAX_HEALTH, type SavedGame, WEAPONS } from './rules';

// Zombie Grid's page: the rules (rules.ts, world.ts, leveling.ts) under a
// camera that follows you around the town. Desktop: WASD or the arrows to
// walk, the mouse to aim, hold the button to fire (Space fires at the nearest
// target, so the keyboard alone plays too), X or 1-3 to switch guns. Touch:
// the stick walks and you fire on your own at whatever is nearest in reach;
// the gun button bottom right switches guns.

const game = gameById('zombies');
/** How long the last bite plays out before the result card. */
const DEATH = 1.1;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

let lastShot = 0;
function sound(e: GameEvent): void {
  const now = performance.now();
  switch (e.type) {
    case 'shot':
      if (now - lastShot < 60) return;
      lastShot = now;
      if (e.weapon === 2) tones([{ freq: 180, duration: 0.12, volume: 0.07, type: 'sawtooth' }, { freq: 90, start: 0.02, duration: 0.14, volume: 0.06, type: 'square' }]);
      else tone({ freq: e.weapon === 1 ? 760 : 520, duration: 0.04, volume: 0.035, type: 'square' });
      return;
    case 'hit':
      tone({ freq: e.target === 'enemy' ? 300 : 200, duration: 0.03, volume: 0.03, type: 'triangle' });
      return;
    case 'kill':
      tones([{ freq: 220, duration: 0.06, volume: 0.06, type: 'sawtooth' }, { freq: 140, start: 0.04, duration: 0.08, volume: 0.05, type: 'square' }]);
      return;
    case 'bite':
      tones([{ freq: 120, duration: 0.2, volume: 0.1, type: 'sawtooth' }, { freq: 80, start: 0.05, duration: 0.2, volume: 0.08, type: 'square' }]);
      return;
    case 'barricade':
      tones([{ freq: 160, duration: 0.12, volume: 0.08, type: 'square' }, { freq: 110, start: 0.06, duration: 0.18, volume: 0.07, type: 'sawtooth' }]);
      return;
    case 'spawner':
      tones([400, 300, 200, 120].map((freq, i) => ({ freq, start: i * 0.05, duration: 0.1, volume: 0.07, type: 'sawtooth' as const })));
      return;
    case 'level':
      tones([523, 659, 784, 1047].map((freq, i) => ({ freq, start: i * 0.06, duration: 0.1, volume: 0.06, type: 'triangle' as const })));
      return;
    case 'round':
      tones([392, 523, 659, 784].map((freq, i) => ({ freq, start: i * 0.08, duration: 0.14, volume: 0.07, type: 'square' as const })));
      return;
    case 'dead':
      tones([300, 220, 160, 100].map((freq, i) => ({ freq, start: i * 0.1, duration: 0.18, volume: 0.08, type: 'sawtooth' as const })));
      return;
    default:
  }
}

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

function createRound(ctx: CanvasRenderingContext2D, input: Input): Round {
  let g: Game = createGame(randomSeed());
  let width = 1;
  let height = 1;
  let t = 0;
  let cam = { x: 0, y: 0 };
  let shake = 0;
  let flash = 0;
  let flashColor = PIECE.enemy;
  let dying = 0;
  let result: Result | null = null;
  let particles: Particle[] = [];
  let floaters: Floater[] = [];
  let levelBanner = 0;
  /** Whether this game has stepped yet: before Play, the title card sits over a quiet town. */
  let started = false;
  const touch = input.stick !== null;

  const zoom = (): number => Math.max(0.9, Math.min(2.4, Math.sqrt(width * height) / 560));
  const gunButton = () => ({ x: width - 76, y: height - 76, r: 34 });

  function centerCamera(snap: boolean): void {
    const z = zoom();
    const vw = width / z;
    const vh = height / z;
    const p = g.player;
    let tx = p.x + p.w / 2;
    let ty = p.y + p.h / 2;
    const b = g.map.bounds;
    const pad = 30;
    tx = vw >= b.w + pad * 2 ? b.x + b.w / 2 : Math.max(b.x - pad + vw / 2, Math.min(b.x + b.w + pad - vw / 2, tx));
    ty = vh >= b.h + pad * 2 ? b.y + b.h / 2 : Math.max(b.y - pad + vh / 2, Math.min(b.y + b.h + pad - vh / 2, ty));
    if (snap) cam = { x: tx, y: ty };
    else {
      cam.x += (tx - cam.x) * 0.15;
      cam.y += (ty - cam.y) * 0.15;
    }
  }

  const toWorld = (sx: number, sy: number) => {
    const z = zoom();
    return { x: (sx - width / 2) / z + cam.x, y: (sy - height / 2) / z + cam.y };
  };

  function burst(x: number, y: number, n: number, colors: string[], speed: number, size = 2): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      const life = 0.35 + Math.random() * 0.45;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color: colors[i % colors.length], size: size * (0.6 + Math.random() * 0.8) });
    }
  }

  function juice(e: GameEvent): void {
    sound(e);
    switch (e.type) {
      case 'hit':
        burst(e.x, e.y, 3, e.target === 'enemy' ? [ZC.rot, '#d4ff8a'] : [ZC.wood, ZC.hazard], 60, 1.4);
        break;
      case 'kill':
        burst(e.x, e.y, 14, [ZC.rot, ZC.rotDark, '#d4ff8a', ZC.eye], 110, 2.2);
        floaters.push({ x: e.x, y: e.y - 6, text: `+${e.xp}`, color: game.accent, life: 0.9 });
        break;
      case 'barricade':
        burst(e.x, e.y, 26, [ZC.wood, ZC.woodDark, ZC.hazard], 140, 2.6);
        floaters.push({ x: e.x, y: e.y - 10, text: e.mandatory ? '+15 · the way is open' : '+15', color: ZC.hazard, life: 1.4 });
        shake = Math.max(shake, 0.15);
        break;
      case 'spawner':
        burst(e.x, e.y, 40, [ZC.toxic, ZC.roof, ZC.spawner, '#ffffff'], 170, 3);
        floaters.push({ x: e.x, y: e.y - 14, text: '+25', color: ZC.toxic, life: 1.2 });
        shake = Math.max(shake, 0.25);
        flash = 0.15;
        flashColor = ZC.toxic;
        break;
      case 'spawn':
        burst(e.x, e.y, 6, [withAlpha(ZC.toxic, 0.8)], 30, 1.5);
        break;
      case 'bite':
        burst(e.x, e.y, 12, [PIECE.enemy, '#ff9aa8'], 90, 2);
        shake = 0.35;
        flash = 0.3;
        flashColor = PIECE.enemy;
        break;
      case 'level':
        levelBanner = 1.6;
        burst(g.player.x + 5, g.player.y + 5, 30, [game.accent, ZC.you, '#ffffff'], 120, 2);
        break;
      case 'round':
        particles = [];
        floaters = [];
        centerCamera(true);
        break;
      case 'dead':
        dying = DEATH;
        burst(g.player.x + 5, g.player.y + 5, 40, [ZC.you, PIECE.enemy, '#ffffff'], 150, 2.5);
        shake = 0.6;
        break;
      default:
    }
  }

  function switchWeapon(to?: number): void {
    if (g.phase === 'over') return;
    if (to === undefined) g.switchWeapon();
    else g.player.weapon = to;
    tone({ freq: 880, duration: 0.05, volume: 0.04, type: 'triangle' });
  }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyX') switchWeapon();
    else if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') switchWeapon(Number(e.code.slice(5)) - 1);
  });

  function controls(): Controls {
    let x = 0;
    let y = 0;
    for (const code of input.keys) {
      const m = MOVE_KEYS[code];
      if (m) {
        x += m[0];
        y += m[1];
      }
    }
    x = Math.sign(x);
    y = Math.sign(y);
    if (input.stick?.active) {
      x = input.stick.x;
      y = input.stick.y;
    }
    // Touch fires on its own at the nearest target; a mouse aims and fires while held.
    if (touch || input.keys.has('Space')) return { move: { x, y }, fire: true, aim: null };
    const mouse = input.pointer.down && !input.pointer.touch;
    return { move: { x, y }, fire: mouse, aim: mouse ? toWorld(input.pointer.x, input.pointer.y) : null };
  }

  function drawHud(): void {
    const p = g.player;
    const pad = 12;
    const w = Math.min(190, width * 0.45);
    ctx.save();
    roundRect(ctx, pad, pad, w + 20, 62, 12);
    ctx.fillStyle = 'rgba(10, 12, 24, 0.72)';
    ctx.fill();
    ctx.strokeStyle = withAlpha(game.accent, 0.25);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = NIGHT.muted;
    ctx.fillText('HEALTH', pad + 10, pad + 13);
    ctx.textAlign = 'right';
    ctx.fillStyle = NIGHT.text;
    ctx.fillText(`${p.health}`, pad + 10 + w, pad + 13);
    const low = p.health <= 30;
    bar(ctx, pad + 10, pad + 21, w, 8, p.health / MAX_HEALTH, low ? PIECE.enemy : '#4dff9a', low ? 8 + Math.sin(t * 10) * 4 : 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = NIGHT.muted;
    ctx.fillText(`LEVEL ${g.stats.level + 1}`, pad + 10, pad + 40);
    ctx.textAlign = 'right';
    ctx.fillStyle = NIGHT.text;
    ctx.fillText(`${g.stats.xp} XP`, pad + 10 + w, pad + 40);
    bar(ctx, pad + 10, pad + 48, w, 5, levelProgress(g.stats), game.accent, 4);
    ctx.restore();

    // The gun and what is left standing.
    const spawners = g.map.spawners.filter((s) => s.health > 0).length;
    ctx.save();
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    const line = `${spawners} spawner ${spawners === 1 ? 'house' : 'houses'} left`;
    ctx.fillStyle = withAlpha(NIGHT.text, 0.8);
    ctx.fillText(line, pad + 4, pad + 78);
    if (!touch) {
      ctx.fillStyle = NIGHT.muted;
      ctx.fillText(`${WEAPONS[p.weapon].name}  ·  X to switch`, pad + 4, pad + 96);
    }
    ctx.restore();

    if (touch) {
      const b = gunButton();
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 12, 24, 0.6)';
      ctx.fill();
      ctx.strokeStyle = withAlpha(game.accent, 0.6);
      ctx.lineWidth = 2;
      ctx.shadowColor = game.accent;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = NIGHT.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 11px system-ui, sans-serif';
      const name = WEAPONS[p.weapon].name.split(' ');
      name.forEach((word, i) => ctx.fillText(word, b.x, b.y + (i - (name.length - 1) / 2) * 13));
      ctx.restore();
    }
  }

  /** An arrow at the screen's edge toward the safe house when it is out of sight. */
  function drawPointer(): void {
    const o = g.map.objective;
    const z = zoom();
    const sx = (o.x + o.w / 2 - cam.x) * z + width / 2;
    const sy = (o.y + o.h / 2 - cam.y) * z + height / 2;
    const m = 34;
    if (sx > m && sx < width - m && sy > m + 100 && sy < height - m) return;
    const cx = width / 2;
    const cy = height / 2;
    const dx = sx - cx;
    const dy = sy - cy;
    const k = Math.min((width / 2 - m) / Math.abs(dx || 1e-6), (height / 2 - m) / Math.abs(dy || 1e-6));
    const ax = cx + dx * k;
    const ay = cy + dy * k;
    const a = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(a);
    ctx.fillStyle = withAlpha(ZC.safe, 0.85 + Math.sin(t * 4) * 0.15);
    ctx.shadowColor = ZC.safe;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function banner(title: string, sub: string, alpha: number): void {
    const size = Math.min(width, height);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10, 12, 24, 0.55)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = NIGHT.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(size * 0.09)}px system-ui, sans-serif`;
    ctx.shadowColor = game.accent;
    ctx.shadowBlur = 24;
    ctx.fillText(title, width / 2, height / 2 - 8);
    ctx.shadowBlur = 0;
    ctx.font = `600 ${Math.round(Math.max(13, size * 0.032))}px system-ui, sans-serif`;
    ctx.fillStyle = NIGHT.muted;
    ctx.fillText(sub, width / 2, height / 2 + size * 0.07);
    ctx.restore();
  }

  return {
    reset(seed = randomSeed(), saved?: unknown) {
      g = createGame(seed, saved as SavedGame | undefined);
      particles = [];
      floaters = [];
      shake = 0;
      flash = 0;
      dying = 0;
      levelBanner = 0;
      started = false;
      result = null;
      centerCamera(true);
    },
    update(dt) {
      t += dt;
      started = true;
      if (g.phase !== 'over') for (const e of g.update(dt, controls())) juice(e);
      else if (dying > 0) {
        dying -= dt;
        if (dying <= 0 && !result) {
          const lvl = g.stats.level + 1;
          result = {
            heading: 'Overrun',
            text: `The zombies got you in round ${g.round}. ${g.kills} ${g.kills === 1 ? 'zombie' : 'zombies'} down, level ${lvl}: ${g.score} points.`,
            success: false,
            score: g.score,
          };
        }
      }
      centerCamera(false);
      shake = Math.max(0, shake - dt);
      flash = Math.max(0, flash - dt);
      levelBanner = Math.max(0, levelBanner - dt);
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.life -= dt;
      }
      particles = particles.filter((p) => p.life > 0);
      for (const f of floaters) {
        f.y -= 18 * dt;
        f.life -= dt;
      }
      floaters = floaters.filter((f) => f.life > 0);
    },
    fit(w, h) {
      width = w;
      height = h;
      centerCamera(true);
    },
    pointer(x, y) {
      if (!touch || !input.pointer.touch) return;
      const b = gunButton();
      if (Math.hypot(x - b.x, y - b.y) <= b.r + 10) switchWeapon();
    },
    hud: () => `R${g.round} · ${g.score} pts`,
    // A game already lost (the last bite, before the card) isn't worth keeping.
    save: () => (g.phase === 'over' ? null : g.save()),
    progress: () => `Round ${g.round}, ${g.score} points, ${g.player.health} health`,
    // Zombie scores every kill as it goes, so a game given up still counts.
    forfeit: () => g.score,
    get result() {
      return result;
    },
    render() {
      backdrop(ctx, width, height, game.accent, t);
      const z = zoom();
      const jx = shake > 0 ? Math.sin(t * 90) * shake * 10 : 0;
      const jy = shake > 0 ? Math.cos(t * 73) * shake * 8 : 0;
      ctx.save();
      ctx.translate(width / 2 + jx, height / 2 + jy);
      ctx.scale(z, z);
      ctx.translate(-cam.x, -cam.y);
      const view = { x: cam.x - width / 2 / z - 20, y: cam.y - height / 2 / z - 20, w: width / z + 40, h: height / z + 40 };
      drawTown(ctx, g.map, view, t, game.accent);
      const pc = { x: g.player.x + 5, y: g.player.y + 5 };
      for (const e of g.enemies) drawZombie(ctx, e, t, { x: pc.x - e.x - 5, y: pc.y - e.y - 5 });
      if (g.phase !== 'over') drawPlayer(ctx, g.player, t, g.player.weapon);
      for (const b of g.bullets) drawBullet(ctx, b);
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 9px system-ui, sans-serif';
      for (const f of floaters) {
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 6;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();

      // Hurt: the edges of the screen go red, more as health drops.
      const hurt = 1 - g.player.health / MAX_HEALTH;
      if (hurt > 0.5 && g.phase !== 'over') {
        const v = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.7);
        v.addColorStop(0, 'rgba(255,93,115,0)');
        v.addColorStop(1, withAlpha(PIECE.enemy, (hurt - 0.5) * 0.5 * (0.8 + Math.sin(t * 6) * 0.2)));
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, width, height);
      }
      if (flash > 0) {
        ctx.fillStyle = withAlpha(flashColor, flash * 0.45);
        ctx.fillRect(0, 0, width, height);
      }
      drawPointer();
      if (started) drawHud();
      if (levelBanner > 0 && g.phase === 'play') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, levelBanner * 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = game.accent;
        ctx.shadowColor = game.accent;
        ctx.shadowBlur = 16;
        ctx.font = `800 ${Math.round(Math.max(18, Math.min(width, height) * 0.05))}px system-ui, sans-serif`;
        ctx.fillText(`Level ${g.stats.level + 1}`, width / 2, height * 0.3);
        ctx.shadowBlur = 0;
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillStyle = NIGHT.text;
        ctx.fillText('Faster feet, faster trigger', width / 2, height * 0.3 + 24);
        ctx.restore();
      }
      if (g.phase === 'banner' && started) {
        const sub = g.round === 1 ? 'Break the barricade and reach the safe house' : `${g.map.spawners.length} spawner houses · health restored`;
        banner(`Round ${g.round}`, sub, Math.min(1, g.banner / 0.3));
      }
    },
  };
}

arcadePage({
  game,
  intro: 'Walk the streets with WASD or the arrows, aim with the mouse and hold to fire (Space fires at the nearest zombie, X switches guns). On a phone, steer with the stick and you fire on your own. Shoot down the barricade, reach the gold safe house and survive as many rounds as you can.',
  create: (ctx, input) => createRound(ctx, input),
  stick: true,
});

import { countedRng } from '../../arcade/rng';
import { addXp, newStats, perks, type Stats } from './leveling';
import { enemyBlockers, generateMap, overlaps, PLAYER_SIZE, type Rect, slide, type TownMap } from './world';

// Zombie Grid's rules, ported from the 2020 game with its September 2026 work
// (legacy/game/src/zombie/): walk the streets, shoot the zombies that come out
// of the spawner houses, break the barricade on the spur and reach the safe
// house. Reaching it clears the round: +50, a new town with more and tougher
// spawner houses and faster zombies, and your health back. XP and levels carry
// over. A zombie that reaches you bites for 10 and dies; at 0 health the game
// is over and the score (every kill, barricade, spawner house and round
// cleared) goes on the board. Pure: no DOM, no canvas (tests/zombies.test.ts).

export const MAX_HEALTH = 100;
export const BITE = 10;
export const BARRICADE_XP = 15;
export const SPAWNER_XP = 25;
export const ROUND_CLEAR_XP = 50;
/** The "Round N" beat before a round starts (the 2020 roundDelay, 1500 ms). */
export const BANNER = 1.5;
/** Player speed at level 1, px/s (0.06 px/ms). */
export const PLAYER_SPEED = 60;
export const ENEMY_SIZE = 10;
export const BULLET_SIZE = 3;
export const BULLET_SPEED = 320;

export interface Weapon {
  name: string;
  /** Seconds between shots before the level perk. */
  rate: number;
  damage: number;
  /** How far a bullet flies, px. */
  reach: number;
}

/**
 * The three guns, X to switch. Rates and damage are the 2020 ones; the 2020
 * bullets crawled (100 px/s) and the pistol reached 60 px, which only worked on
 * a 500 px canvas, so bullets fly faster and a little further here.
 */
export const WEAPONS: readonly Weapon[] = [
  { name: 'Pistol', rate: 0.2, damage: 1, reach: 110 },
  { name: 'Machine gun', rate: 0.075, damage: 0.5, reach: 140 },
  { name: 'Sniper', rate: 0.75, damage: 10, reach: 420 },
];

export interface Player extends Rect {
  health: number;
  weapon: number;
  cooldown: number;
  /** The last move, px/s, for the bullets' blend and the art. */
  vx: number;
  vy: number;
  /** Where the gun points, a unit vector. */
  aimX: number;
  aimY: number;
  flash: number;
}

export interface Enemy extends Rect {
  id: number;
  health: number;
  max: number;
  speed: number;
  siteRange: number;
  /** Whether it has noticed you (for the art: eyes light up). */
  chasing: boolean;
  flash: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
}

export interface Controls {
  /** -1..1 per axis; diagonals are normalised. */
  move: { x: number; y: number };
  /** Hold to fire. */
  fire: boolean;
  /** A world point to fire at; null fires at the nearest target in reach (touch, Space). */
  aim: { x: number; y: number } | null;
}

export type GameEvent =
  | { type: 'shot'; weapon: number }
  | { type: 'hit'; x: number; y: number; target: 'enemy' | 'spawner' | 'barricade' }
  | { type: 'kill'; x: number; y: number; xp: number }
  | { type: 'barricade'; x: number; y: number; mandatory: boolean }
  | { type: 'spawner'; x: number; y: number }
  | { type: 'spawn'; x: number; y: number }
  | { type: 'bite'; x: number; y: number; health: number }
  | { type: 'level'; level: number }
  | { type: 'round'; round: number }
  | { type: 'dead' };

export type Phase = 'banner' | 'play' | 'over';

export interface Game {
  readonly seed: number;
  round: number;
  score: number;
  stats: Stats;
  map: TownMap;
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  phase: Phase;
  /** Seconds left on the round banner. */
  banner: number;
  /** Seconds since the game began, for the art. */
  time: number;
  kills: number;
  update(dt: number, controls: Controls): GameEvent[];
  switchWeapon(): void;
  /** Adds score and XP together, as the 2020 award() did; reports level-ups in `events`. */
  award(amount: number, events?: GameEvent[]): void;
  /** The target auto-fire would pick right now, or null. */
  autoTarget(): { x: number; y: number } | null;
  /** The game as plain data, for the save: createGame(seed, saved) carries on from it. */
  save(): SavedGame;
}

/** Everything a game in progress is, with how far its random numbers have got. */
export interface SavedGame {
  seed: number;
  draws: number;
  nextId: number;
  round: number;
  score: number;
  stats: Stats;
  map: TownMap;
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  phase: Phase;
  banner: number;
  time: number;
  kills: number;
}

const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

function newPlayer(map: TownMap, weapon = 0): Player {
  return { ...map.start, w: PLAYER_SIZE, h: PLAYER_SIZE, health: MAX_HEALTH, weapon, cooldown: 0, vx: 0, vy: 0, aimX: 1, aimY: 0, flash: 0 };
}

export function createGame(seed: number, saved?: SavedGame): Game {
  const s0 = saved ? structuredClone(saved) : null;
  const rng = countedRng(s0?.seed ?? seed, s0?.draws ?? 0);
  let nextId = s0?.nextId ?? 1000;
  const g: Game = {
    seed: s0?.seed ?? seed,
    round: s0?.round ?? 1,
    score: s0?.score ?? 0,
    stats: s0?.stats ?? newStats(),
    map: s0?.map ?? generateMap(1, rng),
    player: undefined as unknown as Player,
    enemies: [],
    bullets: [],
    phase: 'banner',
    banner: BANNER,
    time: 0,
    kills: 0,
    update,
    switchWeapon() {
      g.player.weapon = (g.player.weapon + 1) % WEAPONS.length;
      g.player.cooldown = Math.min(g.player.cooldown, 0.1);
    },
    award(amount, events) {
      g.score += amount;
      const gained = addXp(g.stats, amount);
      if (gained > 0) events?.push({ type: 'level', level: g.stats.level + 1 });
    },
    autoTarget,
    save: () => structuredClone({ seed: g.seed, draws: rng.draws, nextId, round: g.round, score: g.score, stats: g.stats, map: g.map, player: g.player, enemies: g.enemies, bullets: g.bullets, phase: g.phase, banner: g.banner, time: g.time, kills: g.kills }),
  };
  g.player = newPlayer(g.map);
  if (s0) {
    g.player = s0.player;
    g.enemies = s0.enemies;
    g.bullets = s0.bullets;
    g.phase = s0.phase;
    g.banner = s0.banner;
    g.time = s0.time;
    g.kills = s0.kills;
  }

  function nextRound(events: GameEvent[]): void {
    g.round += 1;
    g.award(ROUND_CLEAR_XP, events);
    g.map = generateMap(g.round, rng);
    g.player = newPlayer(g.map, g.player.weapon);
    g.enemies = [];
    g.bullets = [];
    g.phase = 'banner';
    g.banner = BANNER;
    events.push({ type: 'round', round: g.round });
  }

  /** The nearest thing worth shooting within the gun's reach: zombies first, then spawner houses, then barricades. */
  function autoTarget(): { x: number; y: number } | null {
    const p = center(g.player);
    const reach = WEAPONS[g.player.weapon].reach;
    const groups: Rect[][] = [g.enemies, g.map.spawners.filter((s) => s.health > 0), g.map.barricades.filter((b) => b.health > 0)];
    for (const group of groups) {
      let best: { x: number; y: number } | null = null;
      let bestD = Infinity;
      for (const r of group) {
        const c = center(r);
        // Aim at the nearest point of big targets, so a house's edge counts as in reach.
        const nx = Math.max(r.x, Math.min(p.x, r.x + r.w));
        const ny = Math.max(r.y, Math.min(p.y, r.y + r.h));
        const d = Math.hypot(nx - p.x, ny - p.y);
        if (d < reach * 0.95 && d < bestD) {
          bestD = d;
          best = r.w > ENEMY_SIZE ? { x: (nx + c.x) / 2, y: (ny + c.y) / 2 } : c;
        }
      }
      if (best) return best;
    }
    return null;
  }

  function fire(target: { x: number; y: number }, events: GameEvent[]): void {
    const p = g.player;
    const weapon = WEAPONS[p.weapon];
    const c = center(p);
    let dx = target.x - c.x;
    let dy = target.y - c.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    p.aimX = dx;
    p.aimY = dy;
    // The shooter's own velocity blends in, so a shot fired on the run still flies true.
    g.bullets.push({
      x: c.x,
      y: c.y,
      vx: dx * BULLET_SPEED + p.vx,
      vy: dy * BULLET_SPEED + p.vy,
      life: weapon.reach / BULLET_SPEED,
      damage: weapon.damage,
    });
    p.cooldown = weapon.rate * perks(g.stats).fireRateMultiplier;
    events.push({ type: 'shot', weapon: p.weapon });
  }

  function movePlayer(dt: number, controls: Controls): void {
    const p = g.player;
    let { x, y } = controls.move;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    const speed = PLAYER_SPEED * perks(g.stats).moveSpeedMultiplier;
    const dx = x * speed * dt;
    const dy = y * speed * dt;
    if (!dx && !dy) {
      p.vx = 0;
      p.vy = 0;
      return;
    }
    const to = slide(g.map, p, dx, dy);
    p.vx = (to.x - p.x) / dt;
    p.vy = (to.y - p.y) / dt;
    p.x = to.x;
    p.y = to.y;
    if (!controls.fire && len > 0.2) {
      p.aimX = x / Math.max(len, 1e-6);
      p.aimY = y / Math.max(len, 1e-6);
    }
  }

  function spawn(dt: number, events: GameEvent[]): void {
    for (const s of g.map.spawners) {
      if (s.health <= 0) continue;
      s.timer += dt;
      if (s.timer >= s.rate && s.spawned < s.maxSpawns) {
        s.timer = 0;
        s.spawned += 1;
        // 1 to 5 health; the weaker ones are faster (Spawner.spawn).
        const health = rng.int(1, 6);
        const door = { x: s.x + s.w / 2 - ENEMY_SIZE / 2, y: s.y + s.h - 4 - ENEMY_SIZE / 2 };
        g.enemies.push({ ...door, w: ENEMY_SIZE, h: ENEMY_SIZE, id: nextId++, health, max: health, speed: s.enemySpeed + (5 - health) * 2, siteRange: s.siteRange, chasing: false, flash: 0 });
        events.push({ type: 'spawn', x: door.x + ENEMY_SIZE / 2, y: door.y + ENEMY_SIZE / 2 });
      }
    }
  }

  function moveEnemies(dt: number, events: GameEvent[]): void {
    const p = g.player;
    const blockers = enemyBlockers(g.map);
    const open = (e: Enemy, x: number, y: number): boolean => {
      const r = { x, y, w: e.w, h: e.h };
      if (blockers.some((b) => overlaps(r, b))) return false;
      e.x = x;
      e.y = y;
      return true;
    };
    for (const e of [...g.enemies]) {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d <= p.w) {
        // A bite: it costs you health and the zombie is spent.
        g.enemies.splice(g.enemies.indexOf(e), 1);
        p.health = Math.max(0, p.health - BITE);
        p.flash = 0.25;
        events.push({ type: 'bite', x: e.x + e.w / 2, y: e.y + e.h / 2, health: p.health });
        if (p.health <= 0) {
          g.phase = 'over';
          events.push({ type: 'dead' });
          return;
        }
        continue;
      }
      e.chasing = d <= e.siteRange;
      if (!e.chasing) continue;
      const nx = dx / d;
      const ny = dy / d;
      const step = e.speed * dt;
      // Straight at you; blocked, slide at full speed along whichever axis is open.
      if (!open(e, e.x + nx * step, e.y + ny * step)) {
        if (!open(e, e.x, e.y + Math.sign(ny) * step)) open(e, e.x + Math.sign(nx) * step, e.y);
      }
    }
  }

  /** World.doDestroyableCheck: a bullet loses as much damage as it deals and flies on while it has some left. */
  function bullets(dt: number, events: GameEvent[]): void {
    const keep: Bullet[] = [];
    for (const b of g.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      const r = { x: b.x - BULLET_SIZE / 2, y: b.y - BULLET_SIZE / 2, w: BULLET_SIZE, h: BULLET_SIZE };
      const strike = (target: { health: number; flash: number }): boolean => {
        target.flash = 0.12;
        if (target.health > b.damage) {
          target.health -= b.damage;
          b.damage = 0;
          return false;
        }
        b.damage -= target.health;
        target.health = 0;
        return true;
      };
      for (const e of [...g.enemies]) {
        if (b.damage <= 0) break;
        if (!overlaps(r, e)) continue;
        const total = e.max;
        if (strike(e)) {
          g.enemies.splice(g.enemies.indexOf(e), 1);
          g.kills += 1;
          events.push({ type: 'kill', x: e.x + e.w / 2, y: e.y + e.h / 2, xp: total });
          g.award(total, events);
        } else events.push({ type: 'hit', x: b.x, y: b.y, target: 'enemy' });
      }
      for (const s of g.map.spawners) {
        if (b.damage <= 0) break;
        if (s.health <= 0 || !overlaps(r, s)) continue;
        if (strike(s)) {
          events.push({ type: 'spawner', x: s.x + s.w / 2, y: s.y + s.h / 2 });
          g.award(SPAWNER_XP, events);
        } else events.push({ type: 'hit', x: b.x, y: b.y, target: 'spawner' });
      }
      for (const w of g.map.barricades) {
        if (b.damage <= 0) break;
        if (w.health <= 0 || !overlaps(r, w)) continue;
        if (strike(w)) {
          events.push({ type: 'barricade', x: w.x + w.w / 2, y: w.y + w.h / 2, mandatory: w.mandatory });
          g.award(BARRICADE_XP, events);
        } else events.push({ type: 'hit', x: b.x, y: b.y, target: 'barricade' });
      }
      if (b.damage > 1e-9 && b.life > 0) keep.push(b);
    }
    g.bullets = keep;
  }

  function update(dt: number, controls: Controls): GameEvent[] {
    const events: GameEvent[] = [];
    if (g.phase === 'over') return events;
    g.time += dt;
    const p = g.player;
    p.flash = Math.max(0, p.flash - dt);
    for (const e of g.enemies) e.flash = Math.max(0, e.flash - dt);
    for (const s of g.map.spawners) s.flash = Math.max(0, s.flash - dt);
    for (const b of g.map.barricades) b.flash = Math.max(0, b.flash - dt);
    if (g.phase === 'banner') {
      g.banner -= dt;
      if (g.banner <= 0) g.phase = 'play';
      return events;
    }
    // A long frame must not carry anyone through a barricade (the 2020 32 ms clamp).
    const step = Math.min(dt, 0.032);
    movePlayer(step, controls);
    p.cooldown = Math.max(0, p.cooldown - step);
    if (controls.fire && p.cooldown <= 0) {
      const target = controls.aim ?? autoTarget();
      if (target) fire(target, events);
    }
    spawn(step, events);
    bullets(step, events);
    moveEnemies(step, events);
    if (g.phase !== 'play') return events;
    if (overlaps(p, g.map.objective)) nextRound(events);
    return events;
  }

  return g;
}

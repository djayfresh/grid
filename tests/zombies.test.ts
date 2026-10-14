import { createRng } from '@djayfresh/engine-kit';
import { describe, expect, it } from 'vitest';
import { addXp, LEVELS, newStats } from '../src/games/zombies/leveling';
import { BANNER, BARRICADE_XP, BITE, type Controls, createGame, type Game, MAX_HEALTH, PLAYER_SPEED, ROUND_CLEAR_XP, SPAWNER_XP, WEAPONS } from '../src/games/zombies/rules';
import { canMove, generateMap, holders, inside, PLAYER_SIZE, type Rect, roundTuning, type TownMap } from '../src/games/zombies/world';

const STEP = 1 / 60;
const idle: Controls = { move: { x: 0, y: 0 }, fire: false, aim: null };

function started(seed = 1): Game {
  const g = createGame(seed);
  g.update(BANNER + STEP, idle);
  expect(g.phase).toBe('play');
  return g;
}

/** Every top-left the player can reach from the start, walking in 2 px steps. */
function reachable(map: TownMap): Set<string> {
  const seen = new Set<string>();
  const queue: [number, number][] = [[map.start.x, map.start.y]];
  seen.add(`${map.start.x},${map.start.y}`);
  const at = (x: number, y: number): Rect => ({ x, y, w: PLAYER_SIZE, h: PLAYER_SIZE });
  while (queue.length) {
    const [x, y] = queue.pop()!;
    for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
      const key = `${x + dx},${y + dy}`;
      if (seen.has(key)) continue;
      if (canMove(map, at(x, y), at(x + dx, y + dy))) {
        seen.add(key);
        queue.push([x + dx, y + dy]);
      }
    }
  }
  return seen;
}

const touchesObjective = (map: TownMap, cells: Set<string>): boolean =>
  [...cells].some((k) => {
    const [x, y] = k.split(',').map(Number);
    const o = map.objective;
    return x < o.x + o.w && x + PLAYER_SIZE > o.x && y < o.y + o.h && y + PLAYER_SIZE > o.y;
  });

describe('the town', () => {
  it('starts the player strictly inside a road', () => {
    const map = generateMap(1, createRng(3));
    const p = { ...map.start, w: PLAYER_SIZE, h: PLAYER_SIZE };
    expect(map.roads.some((r) => inside(p, r))).toBe(true);
  });

  it('gates the safe house behind the mandatory barricade only', () => {
    const map = generateMap(1, createRng(3));
    expect(touchesObjective(map, reachable(map))).toBe(false);
    // The optional barricades down changes nothing: the spur's one still holds.
    for (const b of map.barricades) if (!b.mandatory) b.health = 0;
    expect(touchesObjective(map, reachable(map))).toBe(false);
    for (const b of map.barricades) b.health = b.mandatory ? 0 : b.max;
    expect(touchesObjective(map, reachable(map))).toBe(true);
  });

  it('keeps every reachable spot on a road, a driveway or a house floor', () => {
    const map = generateMap(1, createRng(3));
    for (const b of map.barricades) b.health = 0;
    const cells = reachable(map);
    expect(cells.size).toBeGreaterThan(1000);
    for (const k of cells) {
      const [x, y] = k.split(',').map(Number);
      const r = { x, y, w: PLAYER_SIZE, h: PLAYER_SIZE };
      expect(holders(map).some((h) => inside(r, h))).toBe(true);
    }
    // The driveway leads into the first house.
    const h = map.houses[0];
    expect([...cells].some((k) => { const [x, y] = k.split(',').map(Number); return x > h.x + 20 && y > h.y + 60 && x < h.x + h.w - 20; })).toBe(true);
  });

  it('puts spawner houses off the road but against it, more of them in later rounds', () => {
    expect(generateMap(1, createRng(1)).spawners).toHaveLength(3);
    expect(generateMap(2, createRng(1)).spawners).toHaveLength(4);
    const t1 = roundTuning(1);
    const t3 = roundTuning(3);
    expect(t3.spawnerHealth).toBeGreaterThan(t1.spawnerHealth);
    expect(t3.barricadeHealth).toBeGreaterThan(t1.barricadeHealth);
    expect(t3.enemySpeed).toBeGreaterThan(t1.enemySpeed);
    const map = generateMap(1, createRng(1));
    for (const s of map.spawners) {
      expect(map.roads.some((r) => r.x + r.w === s.x)).toBe(true);
      expect(map.roads.some((r) => s.x < r.x + r.w && s.x + s.w > r.x && s.y < r.y + r.h && s.y + s.h > r.y)).toBe(false);
    }
  });
});

describe('moving', () => {
  it('walks along the road at the legacy speed', () => {
    const g = started();
    const x0 = g.player.x;
    for (let i = 0; i < 60; i++) g.update(STEP, { ...idle, move: { x: 1, y: 0 } });
    expect(g.player.x - x0).toBeCloseTo(PLAYER_SPEED, 0);
  });

  it('cannot step off the road onto grass', () => {
    const g = started();
    // Start is the top-left crossing; walk east along the top street, then try to go south into the grass.
    for (let i = 0; i < 120; i++) g.update(STEP, { ...idle, move: { x: 1, y: 0 } });
    const y0 = g.player.y;
    for (let i = 0; i < 120; i++) g.update(STEP, { ...idle, move: { x: 0, y: 1 } });
    expect(g.player.y).toBeLessThan(40 - PLAYER_SIZE);
    expect(g.player.y).toBeGreaterThanOrEqual(y0);
    // And north is the boundary of the street, too.
    for (let i = 0; i < 120; i++) g.update(STEP, { ...idle, move: { x: 0, y: -1 } });
    expect(g.player.y).toBeGreaterThan(0);
  });

  it('turns at a junction', () => {
    const g = started();
    for (let i = 0; i < 120; i++) g.update(STEP, { ...idle, move: { x: 0, y: 1 } });
    expect(g.player.y).toBeGreaterThan(100);
  });

  it('eases you into a side street when you turn a few pixels early', () => {
    const g = started();
    g.player.x = 334; // the street at x 340 needs x > 340
    for (let i = 0; i < 60; i++) g.update(STEP, { ...idle, move: { x: 0, y: 1 } });
    expect(g.player.x).toBeGreaterThan(340);
    expect(g.player.y).toBeGreaterThan(40);
  });

  it('moves diagonally no faster than straight', () => {
    const g = started();
    g.player.x = 15;
    g.player.y = 15;
    g.update(STEP, { ...idle, move: { x: 1, y: 1 } });
    expect(Math.hypot(g.player.x - 15, g.player.y - 15)).toBeLessThanOrEqual(PLAYER_SPEED * STEP + 1e-9);
  });
});

describe('zombies', () => {
  it('spawn from the spawner houses after their rate', () => {
    const g = started();
    for (let i = 0; i < 60 * 5; i++) g.update(STEP, idle);
    expect(g.enemies.length).toBeGreaterThan(0);
    for (const e of g.enemies) {
      expect(e.health).toBeGreaterThanOrEqual(1);
      expect(e.health).toBeLessThanOrEqual(5);
    }
  });

  it('bite for 10 and the game ends at 0 health', () => {
    const g = started();
    let dead = false;
    for (let bite = 1; bite <= MAX_HEALTH / BITE; bite++) {
      g.enemies.push({ x: g.player.x + 4, y: g.player.y, w: 10, h: 10, id: bite, health: 1, max: 1, speed: 0, siteRange: 300, chasing: false, flash: 0 });
      const events = g.update(STEP, idle);
      expect(g.player.health).toBe(MAX_HEALTH - bite * BITE);
      dead = events.some((e) => e.type === 'dead');
    }
    expect(dead).toBe(true);
    expect(g.phase).toBe('over');
    // Bites give no score.
    expect(g.score).toBe(0);
  });

  it('chase you only inside their sight range', () => {
    const g = started();
    g.map.spawners = [];
    g.enemies.push({ x: g.player.x + 200, y: g.player.y, w: 10, h: 10, id: 1, health: 1, max: 1, speed: 30, siteRange: 300, chasing: false, flash: 0 });
    g.enemies.push({ x: g.player.x + 600, y: g.player.y, w: 10, h: 10, id: 2, health: 1, max: 1, speed: 30, siteRange: 300, chasing: false, flash: 0 });
    for (let i = 0; i < 60; i++) g.update(STEP, idle);
    expect(g.enemies[0].x).toBeLessThan(g.player.x + 200 - 20);
    expect(g.enemies[1].x).toBe(g.player.x + 600);
  });
});

describe('combat and levels', () => {
  it('a kill scores the zombie\'s health as XP', () => {
    const g = started();
    g.map.spawners = [];
    g.enemies.push({ x: g.player.x + 40, y: g.player.y, w: 10, h: 10, id: 1, health: 3, max: 3, speed: 0, siteRange: 0, chasing: false, flash: 0 });
    const kills = [];
    for (let i = 0; i < 120 && g.enemies.length; i++) kills.push(...g.update(STEP, { ...idle, fire: true }).filter((e) => e.type === 'kill'));
    expect(kills).toHaveLength(1);
    expect(g.score).toBe(3);
    expect(g.stats.xp).toBe(3);
  });

  it('aims at the pointer when there is one', () => {
    const g = started();
    g.update(STEP, { ...idle, fire: true, aim: { x: g.player.x + 5, y: g.player.y + 200 } });
    expect(g.bullets).toHaveLength(1);
    expect(g.bullets[0].vy).toBeGreaterThan(0);
    expect(Math.abs(g.bullets[0].vx)).toBeLessThan(1);
  });

  it('auto-fire waits for something in reach', () => {
    const g = started();
    g.map.spawners = [];
    g.update(STEP, { ...idle, fire: true });
    expect(g.bullets).toHaveLength(0);
  });

  it('the sniper pierces: leftover damage flies on', () => {
    const g = started();
    g.map.spawners = [];
    g.player.weapon = 2;
    for (let i = 0; i < 3; i++) g.enemies.push({ x: g.player.x + 30 + i * 12, y: g.player.y, w: 10, h: 10, id: i, health: 2, max: 2, speed: 0, siteRange: 0, chasing: false, flash: 0 });
    g.update(STEP, { ...idle, fire: true, aim: { x: g.player.x + 400, y: g.player.y + 5 } });
    for (let i = 0; i < 30; i++) g.update(STEP, idle);
    expect(g.enemies).toHaveLength(0);
    expect(g.kills).toBe(3);
  });

  it('levels up and the perks make you faster and quicker to fire', () => {
    const s = newStats();
    expect(addXp(s, 39)).toBe(0);
    expect(addXp(s, 1)).toBe(1);
    expect(addXp(s, 1000)).toBe(LEVELS.length - 2);
    expect(s.level).toBe(LEVELS.length - 1);

    const g = started();
    g.map.spawners = [];
    const events: ReturnType<Game['update']> = [];
    g.award(100, events);
    expect(events).toContainEqual({ type: 'level', level: 3 });
    const x0 = g.player.x;
    for (let i = 0; i < 60; i++) g.update(STEP, { ...idle, move: { x: 1, y: 0 } });
    expect(g.player.x - x0).toBeCloseTo(PLAYER_SPEED * LEVELS[2].moveSpeedMultiplier, 0);
    g.update(STEP, { ...idle, fire: true, aim: { x: 500, y: 20 } });
    expect(g.player.cooldown).toBeCloseTo(WEAPONS[0].rate * LEVELS[2].fireRateMultiplier - 0, 2);
  });

  it('shooting down a barricade or spawner house scores and removes it', () => {
    const g = started();
    const s = g.map.spawners[0];
    g.player.weapon = 2;
    // Stand on the street right beside the spawner house and fire into it.
    g.player.x = s.x - 20;
    g.player.y = s.y + 10;
    let destroyed = false;
    for (let i = 0; i < 60 * 6 && !destroyed; i++) destroyed = g.update(STEP, { ...idle, fire: true, aim: { x: s.x + 20, y: s.y + 20 } }).some((e) => e.type === 'spawner');
    expect(destroyed).toBe(true);
    expect(s.health).toBe(0);
    expect(g.score).toBeGreaterThanOrEqual(SPAWNER_XP);

    const b = g.map.barricades.find((x) => x.mandatory)!;
    const before = g.score;
    g.enemies = [];
    g.map.spawners = [];
    g.player.x = b.x - 60;
    g.player.y = b.y + 15;
    destroyed = false;
    for (let i = 0; i < 60 * 10 && !destroyed; i++) destroyed = g.update(STEP, { ...idle, fire: true, aim: { x: b.x + 10, y: b.y + 20 } }).some((e) => e.type === 'barricade');
    expect(destroyed).toBe(true);
    expect(g.score - before).toBeGreaterThanOrEqual(BARRICADE_XP);
  });
});

describe('rounds', () => {
  it('reaching the safe house clears the round: +50, a harder town, full health', () => {
    const g = started();
    g.player.health = 40;
    g.player.x = g.map.objective.x + 5;
    g.player.y = g.map.objective.y + 15;
    const events = g.update(STEP, idle);
    expect(events).toContainEqual({ type: 'round', round: 2 });
    expect(g.round).toBe(2);
    expect(g.score).toBe(ROUND_CLEAR_XP);
    expect(g.player.health).toBe(MAX_HEALTH);
    expect(g.map.spawners).toHaveLength(4);
    expect(g.map.barricades.find((b) => b.mandatory)!.max).toBe(roundTuning(2).barricadeHealth);
    expect(g.phase).toBe('banner');
    // XP carries over.
    expect(g.stats.level).toBe(1);
  });
});

describe('seeds', () => {
  function play(seed: number) {
    const g = createGame(seed);
    const trace: number[] = [];
    for (let i = 0; i < 60 * 20; i++) {
      g.update(STEP, { move: { x: i % 400 < 200 ? 1 : 0, y: i % 400 < 200 ? 0 : 1 }, fire: true, aim: null });
      if (i % 60 === 0) trace.push(g.player.x, g.player.y, g.enemies.length, g.score, ...g.enemies.map((e) => e.health));
    }
    return { trace, spawners: g.map.spawners.map((s) => [s.x, s.y]) };
  }

  it('replays the same game from the same seed', () => {
    expect(play(42)).toEqual(play(42));
  });

  it('varies with the seed', () => {
    const a = [1, 2, 3, 4, 5].map((s) => JSON.stringify(play(s).trace));
    expect(new Set(a).size).toBeGreaterThan(1);
  });
});

describe('a saved game', () => {
  it('carries on exactly as the game it was saved from', () => {
    const a = started(7);
    const walk: Controls = { move: { x: 1, y: 0 }, fire: true, aim: null };
    for (let i = 0; i < 60 * 8; i++) a.update(STEP, walk);
    // Through JSON, the way the save keeps it.
    const b = createGame(1, JSON.parse(JSON.stringify(a.save())));
    for (let i = 0; i < 60 * 12; i++) {
      a.update(STEP, i % 120 < 60 ? walk : idle);
      b.update(STEP, i % 120 < 60 ? walk : idle);
    }
    expect(b.save()).toEqual(a.save());
    expect(b.score).toBe(a.score);
    expect(b.enemies.length).toBe(a.enemies.length);
  });
});

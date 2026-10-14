// XP levels and their perks, as the 2026 work set them (legacy/game/src/zombie/
// leveling.ts): every point of score is also a point of XP, and each level
// makes you move faster and shoot faster. Seven levels, 0 to 600 XP. Pure.

export interface LevelDefinition {
  xp: number;
  moveSpeedMultiplier: number;
  /** Multiplies the weapon's time between shots: below 1 shoots faster. */
  fireRateMultiplier: number;
}

export const LEVELS: readonly LevelDefinition[] = [
  { xp: 0, moveSpeedMultiplier: 1.0, fireRateMultiplier: 1.0 },
  { xp: 40, moveSpeedMultiplier: 1.08, fireRateMultiplier: 0.92 },
  { xp: 100, moveSpeedMultiplier: 1.16, fireRateMultiplier: 0.84 },
  { xp: 180, moveSpeedMultiplier: 1.25, fireRateMultiplier: 0.74 },
  { xp: 280, moveSpeedMultiplier: 1.35, fireRateMultiplier: 0.64 },
  { xp: 420, moveSpeedMultiplier: 1.45, fireRateMultiplier: 0.56 },
  { xp: 600, moveSpeedMultiplier: 1.55, fireRateMultiplier: 0.5 },
];

export interface Stats {
  xp: number;
  /** 0-based index into LEVELS; shown as level + 1. */
  level: number;
}

export const newStats = (): Stats => ({ xp: 0, level: 0 });

/** Adds XP and climbs as many levels as it reaches; returns how many levels were gained. */
export function addXp(stats: Stats, amount: number): number {
  const before = stats.level;
  stats.xp += amount;
  while (stats.level < LEVELS.length - 1 && stats.xp >= LEVELS[stats.level + 1].xp) stats.level++;
  return stats.level - before;
}

export const perks = (stats: Stats): LevelDefinition => LEVELS[stats.level];

/** 0..1 progress from this level's XP to the next (1 at the top level). */
export function levelProgress(stats: Stats): number {
  if (stats.level >= LEVELS.length - 1) return 1;
  const from = LEVELS[stats.level].xp;
  const to = LEVELS[stats.level + 1].xp;
  return Math.min(1, Math.max(0, (stats.xp - from) / (to - from)));
}

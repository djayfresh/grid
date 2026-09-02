export interface LevelDefinition {
    xp: number;
    moveSpeedMultiplier: number;
    fireRateMultiplier: number;
}

export const ZOMBIE_LEVELS: LevelDefinition[] = [
    { xp: 0,   moveSpeedMultiplier: 1.00, fireRateMultiplier: 1.00 },
    { xp: 40,  moveSpeedMultiplier: 1.08, fireRateMultiplier: 0.92 },
    { xp: 100, moveSpeedMultiplier: 1.16, fireRateMultiplier: 0.84 },
    { xp: 180, moveSpeedMultiplier: 1.25, fireRateMultiplier: 0.74 },
    { xp: 280, moveSpeedMultiplier: 1.35, fireRateMultiplier: 0.64 },
    { xp: 420, moveSpeedMultiplier: 1.45, fireRateMultiplier: 0.56 },
    { xp: 600, moveSpeedMultiplier: 1.55, fireRateMultiplier: 0.50 },
];

export class PlayerStats {
    xp = 0;
    level = 0;

    get moveSpeedMultiplier() {
        return ZOMBIE_LEVELS[this.level].moveSpeedMultiplier;
    }

    get fireRateMultiplier() {
        return ZOMBIE_LEVELS[this.level].fireRateMultiplier;
    }

    addXp(amount: number) {
        this.xp += amount;

        while (this.level < ZOMBIE_LEVELS.length - 1 && this.xp >= ZOMBIE_LEVELS[this.level + 1].xp) {
            this.level++;
        }
    }
}

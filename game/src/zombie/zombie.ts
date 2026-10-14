import { Game } from '../shared/game';
import { ZombieWorld } from './world';
import { Mouse, Debug, KeyboardManager, KEY_CONST } from '../shared/utility';
import { GameCanvas } from '../shared/canvas';
import { Rectangle } from '../shared/objects';
import { LevelConst } from '../lobby/levels';
import { GameEventQueue } from '../shared/event-queue';
import { EnemyKilledEvent, EnemyHitPlayerEvent, ObjectiveReachedEvent, BarricadeDestroyedEvent, SpawnerDestroyedEvent } from './events';
import { MenuLoadMainEvent } from '../shared/events';
import { PlayerStats } from './leveling';

const ENEMY_TOUCH_DAMAGE = 10;
const BARRICADE_XP = 15;
const SPAWNER_XP = 25;
const ROUND_CLEAR_XP = 50;

class ZombieGame extends Game {
    world: ZombieWorld;
    mouse: Mouse;
    round: number = 1;
    stats: PlayerStats = new PlayerStats();

    constructor() {
        super();
    }

    StartRound(_dt: number) {
        this.world.round = this.round;
        this.world.stats = this.stats;

        this.world.reset();
        this.world.generateMap();
    }

    RunRound(dt: number) {
        if (this.roundStartDisabled || !this.world.player) {
            return;
        }

        const player = this.world.player;
        player.moveSpeedMultiplier = this.stats.moveSpeedMultiplier;
        if (player.activeWeapon) {
            player.activeWeapon.rateMultiplier = this.stats.fireRateMultiplier;
        }

        const step = Math.min(dt, 32);

        const worldX = this.world.pos.x;
        const worldY = this.world.pos.y;

        const playerX = player.pos.x;
        const playerY = player.pos.y;
        const playerW = (player as Rectangle).width;
        const playerH = (player as Rectangle).height;
        const playerRect = { x: playerX, y: playerY, w: playerW, h: playerH };

        if (this.world.playerAttachedToCenter){
            const move = player.moveDelta(step);
            this.world.validateMove(move, playerRect, { x: worldX, y: worldY }, (x, y) => this.world.setPos(x, y), () => this.world.setPos(worldX, worldY));
        }
        else {
            this.world.setPos(worldX, worldY);
        }
    }

    award(amount: number) {
        this.score += amount;
        this.stats.addXp(amount);
    }

    NextRound() {
        this.round++;
        this.award(ROUND_CLEAR_XP);

        this.hasRoundStarted = false;
        this.currentDelay = 0;
        this.roundDelay = 1500;

        this.world.reset();
        this.world.setRoundStart(this.round, this.score);
    }

    GameOver() {
        this.roundStartDisabled = true;

        this.world.setHighScorePicker(LevelConst.Zombie, this.score, () => {
            this.roundStartDisabled = false;
            GameEventQueue.notify(new MenuLoadMainEvent(null));
        });

        this.world.reset();
        this.world.setGameOver(this.score);
    }

    _init() {
        super._init();

        if (!this._initialized){
            this.world = new ZombieWorld(LevelConst.Zombie);
            this.world.loadImages();
            this.mouse.relative = true;
            this.Resize();

            KeyboardManager.track(KEY_CONST.down);
            KeyboardManager.track(KEY_CONST.up);
            KeyboardManager.track(KEY_CONST.left);
            KeyboardManager.track(KEY_CONST.right);
            KeyboardManager.track(KEY_CONST.x);
            KeyboardManager.track(KEY_CONST.r);
            KeyboardManager.track(KEY_CONST.j);

            GameEventQueue.subscribe(EnemyKilledEvent, 'zombie-game', enemyKilledEvent => {
                this.award(enemyKilledEvent.data.totalHealth);
            });

            GameEventQueue.subscribe(EnemyHitPlayerEvent, 'zombie-game', () => {
                if (this.roundStartDisabled) {
                    return;
                }

                if (this.world.player.takeDamage(ENEMY_TOUCH_DAMAGE) <= 0) {
                    this.GameOver();
                }
            });

            GameEventQueue.subscribe(BarricadeDestroyedEvent, 'zombie-game', () => {
                this.award(BARRICADE_XP);
            });

            GameEventQueue.subscribe(SpawnerDestroyedEvent, 'zombie-game', () => {
                this.award(SPAWNER_XP);
            });

            GameEventQueue.subscribe(ObjectiveReachedEvent, 'zombie-game', () => {
                if (!this.roundStartDisabled) {
                    this.NextRound();
                }
            });
        }

        this.world.setPos(0, 0);
        this.round = 1;
        this.score = 0;
        this.stats = new PlayerStats();

        this.roundDelay = 1500;
        this.hasRoundStarted = false;
        this.currentDelay = 0;
        this.roundStartDisabled = false;

        this.world.reset();
        this.world.setRoundStart(this.round);

        GameCanvas.canvas.style.cursor = 'default';
    }

    Restart() {
        super.Restart();

        this.Resize();
    }
}

export var zombie = new ZombieGame();

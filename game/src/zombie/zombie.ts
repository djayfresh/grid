import { Game } from '../shared/game';
import { ZombieWorld } from './world';
import { Weapon } from '../shared/weapons';
import { Mouse, Debug, KeyboardManager, KEY_CONST } from '../shared/utility';
import { GameCanvas } from '../shared/canvas';
import { Rectangle } from '../shared/objects';
import { LevelConst } from '../lobby/levels';
import { GameEventQueue } from '../shared/event-queue';
import { EnemyKilledEvent } from './events';
import { ImagesLoadedEvent } from '../shared/events';
import { ImageManager } from '../shared/images';
import { PrefabWorld } from '../test-worlds/prefab-word';
import { TestingGroupsMap } from '../CuBE/world';

class ZombieGame extends Game {
    world: ZombieWorld;
    mouse: Mouse;

    constructor() {
        super();
    }

    RunRound() {
        if (this.world.player){
            const move = KeyboardManager.moves(false, this.world.playerSpeed);

            //move the world
            const worldX = this.world.pos.x;
            const worldY = this.world.pos.y;
            
            const playerX = this.world.player.pos.x;
            const playerY = this.world.player.pos.y;
            const playerW = (this.world.player as Rectangle).width;
            const playerH = (this.world.player as Rectangle).height;
            const playerRect = { x: playerX, y: playerY, w: playerW, h: playerH };

            if (this.world.playerAttachedToCenter){
                this.world.validateMove(move, playerRect, { x: worldX, y: worldY }, (x, y) => this.world.setPos(x, y), () => this.world.setPos(worldX, worldY));
            }
            else {
                this.world.setPos(worldX, worldY);
            }
        }
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
                this.score += enemyKilledEvent.data.totalHealth; //score based on enemy health before death?
            });

            // GameEventQueue.subscribe(ImagesLoadedEvent, 'zombie-game', () => {
            //     this.world.reset();
            //     TestingGroupsMap.generateMap(this.world);
            //     TestingGroupsMap.initializeRender(this.world);
            // });
        }
        this.world.setPos(0, 0);

        this.roundDelay = 0;

        this.world.reset();
        this.world.setRoundStart(1);
        this.world.reset();
        TestingGroupsMap.generateMap(this.world);
        TestingGroupsMap.initializeRender(this.world);

        // if (ImageManager.getImages('zombie').every(i => i.isLoaded)){
        //     GameEventQueue.notify(new ImagesLoadedEvent([]));
        // }

        GameCanvas.canvas.style.cursor = 'default';
    }

    Restart() {
        super.Restart();

        this.Resize();
    }
}

export var zombie = new ZombieGame();
import { Game } from '../shared/game';
import { ZombieWorld } from './world';
import { Weapon } from '../shared/weapons';
import { Mouse, Debug, KeyboardManager, KEY_CONST, ID_CONST } from '../shared/utility';
import { GameCanvas } from '../shared/canvas';
import { Physics } from '../shared/physics';
import { Rectangle } from '../shared/objects';
import { LevelConst } from '../lobby/lobby';
import { GameObjectAttributes } from '../shared/renderer';

class ZombieGame extends Game {
    world: ZombieWorld;
    mouse: Mouse;

    constructor() {
        super();
    }

    _frame(dt) {
        super._frame(dt);

        Debug.time('DT:', dt);
    }

    RunRound() {
        const move = KeyboardManager.moves();

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

    _init() {
        super._init();

        if (!this._initialized){
            this.world = new ZombieWorld(LevelConst.Zombie);
            this.mouse.relative = true;
            this.Resize();
        
            KeyboardManager.track(KEY_CONST.down);
            KeyboardManager.track(KEY_CONST.up);
            KeyboardManager.track(KEY_CONST.left);
            KeyboardManager.track(KEY_CONST.right);
            KeyboardManager.track(KEY_CONST.x);
            KeyboardManager.track(KEY_CONST.r);
            KeyboardManager.track(KEY_CONST.j);
        }
        this.world.setPos(0, 0);

        this.roundDelay = 0;

        this.world.reset();
        this.world.generateMap();

        GameCanvas.canvas.style.cursor = 'default';
    }

    Restart() {
        super.Restart();

        this.Resize();
    }
}

export var zombie = new ZombieGame();
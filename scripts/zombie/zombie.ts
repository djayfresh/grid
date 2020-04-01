import { Game } from '../shared/game';
import { ZombieWorld } from './world';
import { Weapon } from '../shared/weapons';
import { Mouse, Debug, KeyboardManager, KEY_CONST, ID_CONST } from '../shared/utility';
import { GameCanvas } from '../shared/canvas';
import { Physics } from '../shared/physics';
import { Rectangle } from '../shared/objects';
import { LevelConst } from '../lobby/lobby';

class ZombieGame extends Game {
    world: ZombieWorld;
    mouse: Mouse;

    constructor() {
        super();
    }

    Resize() {
        GameCanvas.height = GameCanvas.width;
        if (this.world){
            this.world.setScreen(GameCanvas.width, GameCanvas.height);
            this.world.setCanvas(GameCanvas.canvas.clientWidth, GameCanvas.canvas.clientHeight);
        }
    }

    _frame(dt) {
        super._frame(dt);

        Debug.time('DT:', dt);
    }

    RunRound() {
        const worldMove = KeyboardManager.moves();

        //move the world
        const worldX = this.world.pos.x;
        const worldY = this.world.pos.y;

        if (this.world.playerAttachedToCenter){
            const move = { x: worldX + worldMove.x, y: worldY + worldMove.y };
            if (this.checkForCollisions(move)) {
                this.world.setPos(move.x, move.y);
            }
            else if (this.checkForCollisions({ x: worldX - worldMove.x, y: move.y })) {
                Debug.game("valid 1", worldMove);
                this.world.setPos(worldX, move.y);
            }
            else if (this.checkForCollisions({ x: move.x, y: worldY - worldMove.y })) {
                Debug.game("valid 2", worldMove);
                this.world.setPos(move.x, worldY);
            }
            else {
                Debug.game("No valid moves", worldMove);
                this.world.setPos(worldX, worldY);
            }
        }
        else {
            this.world.setPos(worldX, worldY);
        }
    }

    checkForCollisions(newPos: {x: number, y: number}) {
        const streets = this.world.map.filter(ro => ro.id === ID_CONST.Street) as Rectangle[];

        const playerX = this.world.player.pos.x;// + (this.world.player.width / 2);
        const playerY = this.world.player.pos.y;// + (this.world.player.height / 2);

        return streets.some(s => {
            return Physics.insideBounds(playerX, playerY, this.world.player.width, this.world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        });
    }

    _init() {
        super._init();

        if (!this._initialized){
            this.world = new ZombieWorld(LevelConst.Zombie);
            this.Resize();
        
            KeyboardManager.track(KEY_CONST.down);
            KeyboardManager.track(KEY_CONST.up);
            KeyboardManager.track(KEY_CONST.left);
            KeyboardManager.track(KEY_CONST.right);
            KeyboardManager.track(KEY_CONST.x);
            KeyboardManager.track(KEY_CONST.r);
            KeyboardManager.track(KEY_CONST.j);
        }

        this.roundDelay = 0;

        this.renderer.reset();
        this.renderer.add(...this.world.generateMap());

        GameCanvas.canvas.style.cursor = 'default';
    }

    Restart() {
        super.Restart();

        this.world.setPos(0, 0);

        this.Resize();
    }
}

export var zombie = new ZombieGame();
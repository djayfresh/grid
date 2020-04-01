import { Game } from '../shared/game';
import { ZombieWorld } from './world';
import { Weapon } from '../shared/weapons';
import { Mouse, Debug, KeyboardManager, KEY_CONST, ID_CONST } from '../shared/utility';
import { GameCanvas } from '../shared/canvas';
import { Physics } from '../shared/physics';
import { Rectangle } from '../shared/objects';
import { LevelConst } from '../lobby/lobby';
import { RenderObjectAttributes } from '../shared/renderer';

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
        const worldMove = KeyboardManager.moves();

        //move the world
        const worldX = this.world.pos.x;
        const worldY = this.world.pos.y;

        if (this.world.playerAttachedToCenter){
            const move = { x: worldX + worldMove.x, y: worldY + worldMove.y };
            if (this.noCollisions(move)) {
                this.world.setPos(move.x, move.y);
            }
            else if (this.noCollisions({ x: worldX - worldMove.x, y: move.y })) {
                Debug.game("valid 1", worldMove);
                this.world.setPos(worldX, move.y);
            }
            else if (this.noCollisions({ x: move.x, y: worldY - worldMove.y })) {
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

    noCollisions(newPos: {x: number, y: number}) {
        //TODO: Make sure collision detection works for all object types
        const blockers = this.world.map.filter(ro => ro.attributes.indexOf(RenderObjectAttributes.Blocking) >= 0) as Rectangle[];


        const playerX = this.world.player.pos.x;// + (this.world.player.width / 2);
        const playerY = this.world.player.pos.y;// + (this.world.player.height / 2);

        const playerBlocked = blockers.some(s => {
            return Physics.collision(playerX, playerY, this.world.player.width, this.world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        });

        if (playerBlocked){
            return false;
        }

        const holders = this.world.map.filter(ro => ro.attributes.indexOf(RenderObjectAttributes.Holding) >= 0) as Rectangle[];
        
        const worldX = this.world.pos.x;
        const worldY = this.world.pos.y;

        const playerHeadedOutside = holders.some(s => {
            const wasInside = Physics.insideBounds(playerX, playerY, this.world.player.width, this.world.player.height, s.pos.x + worldX, s.pos.y + worldY, s.width, s.height);
            return wasInside && !Physics.insideBounds(playerX, playerY, this.world.player.width, this.world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        });

        if (playerHeadedOutside){
            return false;
        }

        return true;
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

        this.roundDelay = 0;

        this.renderer.reset();
        this.renderer.add(...this.world.generateMap());

        GameCanvas.canvas.style.cursor = 'default';
    }

    Restart() {
        this.world.setPos(0, 0);

        super.Restart();

        this.Resize();
    }
}

export var zombie = new ZombieGame();
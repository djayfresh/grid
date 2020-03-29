import { Game } from '../shared/game';
import { canvas, ctx } from '../shared/canvas';
import { GridWorld, world } from './world';
import { Debug, Mouse, ID_CONST } from '../shared/utility';
import { Point } from '../shared/renderer';

class Grid extends Game {
    world: GridWorld;
    mouse: Mouse;
    wasDownLastFrame: boolean;
    gridSize: number = 6;
    difficulty: number = 1;

    constructor() {
        super();

        this.world = new GridWorld(this.gridSize, this.difficulty);
    }

    Resize() {
        canvas.height = canvas.width;
        this.world.setScreen(canvas.width, canvas.height);
    }

    _frame(dt) {
        super._frame(dt);

        Debug.time('DT:', dt);

        if (this.mouse.isDown) {
            this.wasDownLastFrame = true;
        }
        else {
            if (this.wasDownLastFrame) {
                const pos = this.world.board.posToBoard(this.mouse.pos);
                const player = this.world.board.posToBoard(this.world.player.pos);

                const moveX = pos.x - player.x;
                const moveY = pos.y - player.y;

                Debug.mouse("Move player", player, pos, moveX, moveY);

                if (1 >= moveX && moveX >= -1 && 1 >= moveY && moveY >= -1) {
                    this.movePlayer(player.x, player.y, moveX, moveY);
                }
            }
            this.wasDownLastFrame = false;
        }

        this.renderer.draw(ctx, this.world);
        this.renderer.update(dt, this.world);
    }

    movePlayer(playerX: number, playerY: number, moveX: number, moveY: number) {
        const movement = this.world.board.getMove(new Point(playerX, playerY), moveX, moveY);
        if (movement) {
            const move = () => this.world.board.move(this.world.player, moveX, moveY, movement);

            switch (movement.destination) {
                case ID_CONST.Wall:
                    //no move
                    break;
                case ID_CONST.Enemy:
                    Debug.log("Lost Game");
                    this.StartWorld();
                    this.score += 1;
                    break;
                case ID_CONST.Flag:
                    move();
                    Debug.log("Win Game");
                    this.score += 1;
                    this.difficulty += 1;
                    this.StartWorld();
                    break;
                case ID_CONST.PowerUp:
                    //Enable PowerUP
                    Debug.log("Power Up");
                    this.score += 1;
                    this.difficulty - 2;
                    move();
                    break;
                default:
                    this.score += 1;
                    move();
                    break;
            }
        }
    }

    _init() {
        super._init();

        this.renderer.reset();
        this.renderer.add(...this.world.generateMap());

        this.mouse = new Mouse(0, canvas, true);
        canvas.style.cursor = 'pointer'; //change mouse pointer
    }

    StartWorld() {
        console.log("Start world", this.difficulty);
        this.world.difficulty = this.difficulty;

        this.renderer.reset();
        this.renderer.add(...this.world.generateMap());
    }

    Restart() {
        super.Restart();

        this.world.setPos(0, 0);

        this.Resize();
    }
}


export var grid = new Grid();
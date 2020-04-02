import { Game } from '../shared/game';
import { GameCanvas } from '../shared/canvas';
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
    }

    _frame(dt: number) {
        super._frame(dt);

        this.currentDelay += dt;
    }

    RunRound() {
        if (this.mouse.isDown) {
            this.wasDownLastFrame = true;
        }
        else {
            if (this.wasDownLastFrame) {
                const pos = this.world.board.posToBoard(this.mouse.pos);
                const player = this.world.board.posToBoard(this.world.player.pos);

                const moveX = pos.x - player.x;
                const moveY = pos.y - player.y;

                Debug.mouse("Move player", player, pos, moveX, moveY, this.mouse.pos, this.world.player.pos);

                if (1 >= moveX && moveX >= -1 && 1 >= moveY && moveY >= -1) {
                    this.movePlayer(player.x, player.y, moveX, moveY);
                }
            }
            this.wasDownLastFrame = false;
        }
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
                    this.score += 1;
                    this.NextRound();
                    break;
                case ID_CONST.Flag:
                    move();
                    Debug.log("Win Game");
                    this.score += 1;
                    this.difficulty += 1;
                    this.NextRound();
                    break;
                case ID_CONST.PowerUp:
                    //Enable PowerUP
                    Debug.log("Power Up");
                    this.world.remove(ID_CONST.PowerUp); //player picked up

                    this.score -= 10;
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

        if (!this._initialized) {
            this.world = new GridWorld(this.gridSize, this.difficulty);
            this.Resize();
            this.mouse = new Mouse(0, GameCanvas.canvas, true);
        }

        this.currentDelay = 0;
        this.hasRoundStarted = false;

        this.world.reset();
        this.world.setRoundStart(1);

        GameCanvas.canvas.style.cursor = 'pointer'; //change mouse pointer
    }

    StartRound() {
        this.world.reset();
        this.world.generateMap();
    }

    NextRound() {
        this.hasRoundStarted = false;
        if (this.difficulty > ((this.gridSize - 1) * (this.gridSize - 1))){
            this.GameOver();
            return;
        }

        this.world.difficulty = this.difficulty;

        this.currentDelay = 0;

        this.world.reset();
        this.world.setRoundStart(this.difficulty, this.score);
    }

    GameOver() {
        this.currentDelay = 0;
        this.difficulty = 1;

        this.world.difficulty = this.difficulty;

        this.world.reset();
        this.world.setGameOver(this.score);

        this.score = 0;
    }

    Restart() {
        super.Restart();

        this.world.setPos(0, 0);

        this.Resize();
    }
}


export var grid = new Grid();
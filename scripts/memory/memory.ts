import { MemoryWorld } from './world';
import { Game } from '../shared/game';
import { GameCanvas } from '../shared/canvas';
import { Debug, ID_CONST, Mouse } from '../shared/utility';
import { Physics } from '../shared/physics';
import { Card } from './objects';

class Memory extends Game {
    world: MemoryWorld;
    cards: Card[];
    mouse: Mouse;
    wasDownLastFrame: boolean;
    firstFrame: boolean;

    constructor() {
        super();
    }

    Resize() {
        GameCanvas.height = GameCanvas.width;
        
        if (this.world) {
            this.world.setScreen(GameCanvas.width, GameCanvas.height);
        }
    }

    _frame(dt) {
        super._frame(dt);

        Debug.time('DT:', dt);

        let isMouseOverButon = false;

        //hover mouse
        this.cards.filter(c => !c.locked).forEach(ro => {
            if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height) && !ro.flipped) {
                Debug.game("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);
                isMouseOverButon = true;
            }
        });

        if (isMouseOverButon) {
            GameCanvas.canvas.style.cursor = 'pointer';
        }
        else {
            GameCanvas.canvas.style.cursor = 'default';
        }

        if (this.mouse.isDown) {
            this.wasDownLastFrame = true;
        }
        else {
            if (this.wasDownLastFrame) {
                //temp
                this.cards.filter(c => !c.locked).forEach(ro => {
                    if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                        Debug.game("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);

                        ro.Flip();
                    }
                });
            }
            this.wasDownLastFrame = false;
        }

        const flippedCards = this.cards.filter(c => c.isFlipped);
        if (flippedCards.length >= 2) {
            if (flippedCards[0].cardColor === flippedCards[1].cardColor) {
                this.score += 2;
                flippedCards.forEach(c => c.Lock()); //prevent clicking again
            } else {
                this.score -= flippedCards.length;
            }

            flippedCards.forEach(c => c.Flip(true));
        }

        if (this.cards.some(c => c.currentState !== 0 && c.currentState !== 1) || this.firstFrame) {
            this.firstFrame = false;
            this.renderer.draw(GameCanvas.ctx, this.world);
        }
        this.renderer.update(dt, this.world);
    }

    _init() {
        super._init();

        if (!this._initialized){
            this.world = new MemoryWorld(6, 0);
            this.mouse = new Mouse(0, GameCanvas.canvas, true);
        }

        this.score = 100;

        this.renderer.reset();
        this.renderer.add(...this.world.generateMap());

        this.cards = this.renderer.renderObjects.filter(ro => ro.id === ID_CONST.Player) as Card[];

        this.firstFrame = true;
    }

    Restart() {
        super.Restart();

        this.world.setPos(0, 0);

        this.Resize();
    }
}

export var memory = new Memory();
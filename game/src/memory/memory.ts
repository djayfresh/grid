import { MemoryWorld } from './world';
import { Game } from '../shared/game';
import { GameCanvas } from '../shared/canvas';
import { Debug, ID_CONST, Mouse } from '../shared/utility';
import { Physics } from '../shared/physics';
import { Card } from './objects';
import { LevelConst } from '../lobby/levels';
import { HighScoreManager } from '../highscore/manager';
import { GameEventQueue } from '../shared/event-queue';
import { MenuLoadMainEvent } from '../shared/events';
import { Analytics } from '../shared/analytics';

class Memory extends Game {
    world: MemoryWorld;
    cards: Card[];
    mouse: Mouse;

    constructor() {
        super();
    }

    _shouldDrawFrame() {
        return this.cards.some(c => c.currentState !== 0 && c.currentState !== 1) 
            || this.firstFrame 
            || !this.hasRoundStarted
            || this.imageLoadedThisFrame;
    }

    StartRound() {
        this.score = 100;

        this.world.reset();
        this.world.generateMap();

        this.cards = this.world.map.filter(ro => ro.id === ID_CONST.Player) as Card[];

        this.firstFrame = true;
    }

    RunRound(dt: number) {
        super.RunRound(dt);

        let isMouseOverButton = false;

        //hover mouse
        this.cards.filter(c => !c.locked).forEach(ro => {
            if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height) && !ro.flipped) {
                Debug.mouse("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);
                isMouseOverButton = true;
            }
        });

        if (isMouseOverButton) {
            GameCanvas.canvas.style.cursor = 'pointer';
        }
        else {
            GameCanvas.canvas.style.cursor = 'default';
        }

        const flippedCards = this.cards.filter(c => c.isFlipped);
        if (flippedCards.length >= 2) {
            if (flippedCards[0].cardColor === flippedCards[1].cardColor) {
                this.score += 2;
                
                Analytics.onEvent({
                    action: 'memory',
                    category: 'engagement',
                    label: 'win'
                }, { score: this.score, color: flippedCards[0].cardColor});

                flippedCards.forEach(c => c.Lock()); //prevent clicking again
            } else {
                this.score -= flippedCards.length;

                Analytics.onEvent({
                    action: 'memory',
                    category: 'engagement',
                    label: 'loss'
                }, { score: this.score });
            }

            flippedCards.forEach(c => c.Flip(true));
        }

        if (this.cards.every(c => c.locked)){
            this.NextRound();
        }
    }

    onMouseDown(){
        this.cards.filter(c => !c.locked).forEach(ro => {
            if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                Debug.mouse("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);

                ro.Flip();
            }
        });
    }

    NextRound() {
        this.hasRoundStarted = false;
        this.roundStartDisabled = true;
        this.world.setHighScorePicker(LevelConst.Memory, this.score, () => {
            this.roundStartDisabled = false;

            GameEventQueue.notify(new MenuLoadMainEvent(null));
        });

        this.world.reset();
        this.world.setGameOver(this.score);
    }

    _init() {
        super._init();

        if (!this._initialized){
            this.world = new MemoryWorld(LevelConst.Memory, 6, 0); //must be an even number of cards
            this.mouse = new Mouse(0, GameCanvas.canvas, true);
            
            this.Resize();
        }

        this.roundDelay = 0;
        this.hasRoundStarted = false;
    }

    Restart() {
        super.Restart();

        this.world.setPos(0, 0);

        this.Resize();
    }
}

export var memory = new Memory();
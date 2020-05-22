import { ThreeWorld } from './world';
import { Game } from '../shared/game';
import { GameCanvas } from '../shared/canvas';
import { Debug, Mouse } from '../shared/utility';
import { Physics } from '../shared/physics';
import { LevelConst } from '../lobby/levels';
import { GameEventQueue } from '../shared/event-queue';
import { MenuLoadMainEvent } from '../shared/events';
import { Circle, Rectangle } from '../shared/objects';
import { GameObjectTypes } from '../../../models/map/map-object.model';

class Three extends Game {
    world: ThreeWorld;
    cups: Circle[];
    mouse: Mouse;
    dies: Rectangle[];

    constructor() {
        super();
    }

    _shouldDrawFrame() {
        return false
            || this.firstFrame 
            || !this.hasRoundStarted
            || this.imageLoadedThisFrame;
    }

    StartRound() {
        this.score = 100;

        this.world.reset();
        this.world.generateMap();

        this.cups = this.world.map.filter(ro => ro.type === GameObjectTypes.Circle) as Circle[];
        this.dies = [this.world.die, this.world.dice];

        this.firstFrame = true;
    }

    RunRound(dt: number) {
        super.RunRound(dt);

        let isMouseOverButton = false;

        //hover mouse
        this.dies.filter(c => !c.isDeleted()).forEach(ro => {
            if (!ro['flipping'] && Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                Debug.game("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);
                isMouseOverButton = true;
            }
        });

        if (isMouseOverButton) {
            GameCanvas.canvas.style.cursor = 'pointer';
        }
        else {
            GameCanvas.canvas.style.cursor = 'default';
        }

        if (false) { //we go to the next round when a flip
            this.NextRound();
        }
    }

    onMouseDown(){
        this.cups.forEach(ro => {
            if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                Debug.game("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);
                ro['flipping'] = true;
                //ro.Flip();
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
            this.world = new ThreeWorld(LevelConst.Three); //must be an even number of cards
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

export var three = new Three();
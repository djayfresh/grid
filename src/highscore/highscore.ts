import { Game } from '../shared/game';
import { HighScoreWorld } from './world';
import { LevelConst } from '../lobby/lobby';
import { GameCanvas } from '../shared/canvas';


export class HighScores extends Game {
    world: HighScoreWorld;
    
    StartRound() {
        this.world.reset();
        this.world.generateMap();
    }

    _init() {
        super._init();

        if (!this._initialized) {
            this.world = new HighScoreWorld(LevelConst.HighScore);
        }

        GameCanvas.canvas.style.cursor = 'default';

        this.roundDelay = 0;
        this.hasRoundStarted = false;
    }
}

export var highscore = new HighScores();
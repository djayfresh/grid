import { Game } from '../shared/game';
import { HighScoreWorld } from './world';
import { LevelConst } from '../lobby/lobby';


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

        this.roundDelay = 0;
    }
}

export var highscore = new HighScores();
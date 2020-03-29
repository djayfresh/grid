import { Renderer } from './renderer';
import { Timer, KEY_CONST, Key, debounce } from './utility';

export class Game {
    renderer = new Renderer();
    _state = () => {}; 
    _initialized = false;
    _timer;
    score = 0;

    constructor() {
        this.Run();
    }

    Pause() {
        this._state = this._pause;
    }

    _pause() {
        //Add any pause logic

        //Keeping the timer updated
        this._timer.Step();
    }

    Play() {
        this._state = this._play;
    }

    _play() {
        this.Setup();

        this._frame(this._timer.Step());
    }

    Run() {
        this._state();

        window.requestAnimationFrame(() => this.Run());
    }

    _frame(_dt) {

        const $score = document.getElementById('game-score');
        if (!!$score){
            $score.innerText = '' + this.score;
        }
    }

    Resize() {

    }

    Setup() {
        if (!this._initialized){
            this._initialized = true;
            this.Resize();
            this._init();
        }
    }

    isPaused() {
        return this._state === this._pause;
    }

    _init() {
        this._timer = new Timer();

        new Key(KEY_CONST.pause).onClick(() => {    
            if (this._state !== this._play) {
                this._state = this._play;
            }
            else {
                this._state = this._pause;
            }
        });

        new Key(KEY_CONST.r).onClick(() => {
            this.Restart();
        });

        //Don't rebind key events
        if (this._initialized) {
            window.addEventListener("resize", () => {
                debounce(() => {
                    this.Resize();
                }, 200, false)
            }, false);
        }
    }

    Restart() {       
        this._init();  
    }
}
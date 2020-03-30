import { Renderer } from './renderer';
import { Timer, KEY_CONST, Key, debounce, Mouse, Debug } from './utility';
import { GameCanvas } from './canvas';

export class Game {
    renderer = new Renderer();
    _state = () => {}; 
    _initialized = false;
    _timer: Timer;
    score = 0;
    $score: HTMLElement;
    focusPaused: boolean = false;
    mouse: Mouse;

    roundDelay: number = 2000;
    currentDelay: number = 0;
    hasRoundStarted: boolean = false;

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

    _frame(dt) {
        Debug.time('DT:', dt);
        
        if (!!this.$score){
            this.$score.innerText = '' + this.score;
        }

        if (this.currentDelay >= this.roundDelay && this.hasRoundStarted === false){
            this.hasRoundStarted = true;
            this.StartRound(dt);
        }

        if(this.hasRoundStarted){
            this.RunRound(dt);
        }

        this.currentDelay += dt;

    }

    StartRound(_dt: number) {

    }

    RunRound(_dt: number) {

    }

    Resize() {

    }

    Setup() {
        if (!this._initialized){
            this.Resize();
            this._init();

            this._initialized = true;
        }
    }

    isPaused() {
        return this._state === this._pause;
    }

    _init() {
        this._timer = new Timer();
        this._timer.Start();

        //Don't rebind key events
        if (!this._initialized) {
            this.$score = document.getElementById('game-score');

            this.mouse = new Mouse(0, GameCanvas.canvas);

            new Key(KEY_CONST.pause).onClick(() => {    
                if (this._state !== this._play) {
                    this._state = this._play;
                }
                else {
                    this._state = this._pause;
                }
            });
    
            const onReset = debounce(() => {
                this.Restart();
            }, 500, true);
            new Key(KEY_CONST.r).onClick(onReset);
            
            const onResize = debounce(() => {
                this.Resize();

                if (this.focusPaused){
                    this._play();
                }
            }, 200, true);
            window.addEventListener('resize', onResize, false);

            window.addEventListener('focus', () => {
                if (this.focusPaused && this._state == this._pause){
                    this.focusPaused = false;
                    this.Play();
                }
            });

            window.addEventListener('blur', () => {
                this.focusPaused = this._state !== this._pause; //we paused for another reason
                this.Pause();
            });
        }
    }

    Restart() {       
        this._init();  
    }
}
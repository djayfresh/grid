class Game {
    renderer = new Renderer();
    _state = () => {}; 
    _initialized = false;
    _timer;

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

    _init() {
        this._timer = new Timer();

        new Key(KEY_CONST.pause).onClick(() => {    
            if (this.state !== this._play) {
                this.state = this._play;
            }
            else {
                this.state = this._pause;
            }
        });

        window.addEventListener("resize", function () {
            debounce(() => {
                this.Resize();
            }, 200)
        }, false);
    }
}

define(['./utility'], function() {
    return {
        Game
    };
})
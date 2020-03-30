import { Point } from './renderer';

export enum ID_CONST { Player = 100, Enemy = 2, PowerUp = -3, Tile = -1, Grid = 9001, Flag = 11, Wall = -101, Ground = -100, Bullet = 101, Street = -80, Spawner = 10 }
export enum KEY_CONST { left = 65, right = 68, up = 87, down = 83, pause = 80, x = 88, r = 82, menu = 77 };

var _DEBUG = { draw: false, time: false, physics: false, keyboard: false, generation: false, mouse: false, game: false };

export class Debug {
    static log(...logMessages: any[]) {
        if (_DEBUG) {
            console.log('LOG: ', logMessages);
        }
    }

    static draw(...logMessages: any[]) {
        if (_DEBUG.draw) {
            console.log('DRAW: ', logMessages);
        }
    }

    static time(...logMessages: any[]) {
        if (_DEBUG.time) {
            console.log('TIME: ', logMessages);
        }
    }

    static physics(...logMessages: any[]) {
        if (_DEBUG.physics) {
            console.log('PHYSICS: ', logMessages);
        }
    }

    static keyboard(...logMessages: any[]) {
        if (_DEBUG.keyboard) {
            console.log('KEYBOARD: ', logMessages);
        }
    }

    static generation(...logMessages: any[]) {
        if (_DEBUG.generation) {
            console.log('GENERATION: ', logMessages);
        }
    }

    static mouse(...logMessages: any[]) {
        if (_DEBUG.mouse) {
            console.log('MOUSE: ', logMessages);
        }
    }

    static game(...logMessages: any[]) {
        if (_DEBUG.game) {
            console.log('GAME: ', logMessages);
        }
    }
}

export class Mouse {
    button: number;
    isDown: boolean = false;
    isUp: boolean = true;
    press: (e: MouseEvent) => void;
    release: (e: MouseEvent) => void;
    move: (ps: Point) => void;
    lastPos: Point = new Point(0, 0);
    pos: Point = new Point(0, 0);

    _canvas: HTMLCanvasElement;
    relative: boolean = false;

    constructor(button: number, canvas: HTMLCanvasElement, canvasRelative: boolean = false) {
        this.button = button;
        this._canvas = canvas;
        this.relative = canvasRelative;

        //Attach event listeners to canvas
        canvas.addEventListener(
            "mousedown", this.downHandler.bind(this)
        );
        canvas.addEventListener(
            "mouseup", this.upHandler.bind(this)
        );
        canvas.addEventListener(
            "mousemove", this.moveHandler.bind(this)
        );
    }

    getMousePos(mouseEvent: MouseEvent) {
        if (this.relative){
            const rect = this._canvas.getBoundingClientRect(); // abs. size of element
            const scaleX = this._canvas.width / rect.width;   // relationship bitmap vs. element for X
            const scaleY = this._canvas.height / rect.height;  // relationship bitmap vs. element for Y

            return new Point((mouseEvent.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
                            (mouseEvent.clientY - rect.top) * scaleY);     // been adjusted to be relative to element
        }
        
        const rect = this._canvas.getBoundingClientRect();
        return new Point(mouseEvent.clientX - rect.left, mouseEvent.clientY - rect.top);
    }

    setPos(pos: Point) {
        this.lastPos = this.pos;
        this.pos = pos;
    }

    //The `downHandler`
    downHandler(event: MouseEvent) {
        const pos = this.getMousePos(event);
        this.setPos(pos);

        Debug.mouse("Down", event, pos);

        if (this.button === undefined || this.button === event.button) {
            if (this.isUp && this.press) {
                this.press(event);
            }
            this.isDown = true;
            this.isUp = false;

            // event.preventDefault();
        }
    };

    //The `upHandler`
    upHandler(event: MouseEvent) {
        const pos = this.getMousePos(event);
        this.setPos(pos);

        Debug.mouse("Up", event, pos);

        if (this.button === undefined || this.button == event.button) {
            if (this.isDown && this.release) {
                this.release(event);
            }
            this.isDown = false;
            this.isUp = true;

            // event.preventDefault();
        }
    };

    //The `moveHandler`
    moveHandler(event: MouseEvent) {
        const pos = this.getMousePos(event);
        this.setPos(pos);

        if (this.move) {
            this.move(pos);
        }
    };
}

export class Key {
    code;
    isDown = false;
    isUp = true;

    //callbacks
    onPress = [];
    onRelease = [];

    constructor(keyCode) {
        this.code = keyCode;

        //Attach event listeners
        window.addEventListener(
            "keydown", this.downHandler.bind(this)
        );

        window.addEventListener(
            "keyup", this.upHandler.bind(this), false
        );
    }

    press() {
        this.onPress.forEach(press => { press(); });
        Debug.keyboard("Key Pressed", this.code);
    }

    release() {
        this.onRelease.forEach(release => { release(); });
        Debug.keyboard("Key Released", this.code);
    }

    onClick(onPress?: () => void, onRelease?: () => void) {
        if (onPress) {
            this.onPress.push(onPress);
        }
        if (onRelease) {
            this.onRelease.push(onRelease);
        }
    }

    downHandler(event) {
        Debug.keyboard("Key", event);
        if (event.keyCode === this.code) {
            if (this.press) {
                this.press();
            }
            this.isDown = true;
            this.isUp = false;

            // event.preventDefault();
        }
    };

    upHandler(event) {
        Debug.keyboard("Key up", event);
        if (event.keyCode === this.code) {
            if (this.release) {
                this.release();
            }
            this.isDown = false;
            this.isUp = true;

            // event.preventDefault();
        }
    };
}

declare global {
    interface Math {
        range: (min: number, max: number) => number;
    }
}

Math.range = function (min: number, max: number) {
    return Math.floor((Math.random() * max) + min);
}

export class KeyboardManager {
    static downKeys = {};
    static trackedKeys = {};

    static isKeyDown(keyCode) {
        return KeyboardManager.downKeys[keyCode];
    }

    static track(keyCode) {
        if (!this.trackedKeys[keyCode]) {
            const key = new Key(keyCode);
            key.onClick(() => this.downKeys[keyCode] = true, () => this.downKeys[keyCode] = false);
            this.trackedKeys[keyCode] = key;
        }

        return this.trackedKeys[keyCode];
    }

    static moves() {
        let x = 0;
        let y = 0;

        if (KeyboardManager.isKeyDown(KEY_CONST.right)) {
            x += -1;
        }
        if (KeyboardManager.isKeyDown(KEY_CONST.down)) {
            y += -1;
        }
        if (KeyboardManager.isKeyDown(KEY_CONST.left)) {
            x += 1;
        }
        if (KeyboardManager.isKeyDown(KEY_CONST.up)) {
            y += 1;
        }

        return { x, y };
    }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        var callNow = immediate && !timeout;

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) {
            func.apply(context, args);
        }
    };
};

// Returns a function that, after called N number of times will trigger the function. 
// If `immediate` is passed, trigger the function on the leading edge, instead of the trailing.
export function invokeDebounce(func, invoked, immediate) {
    let times = 0;
    return function () {
        var context = this, args = arguments;
        var callNow = immediate && times === 0;
        times++;

        if (callNow || times >= invoked) {
            func.apply(context, args);
            times = immediate ? 1 : 0; //prevent a double call
        }
    };
};

export class Timer {
    lastTime = 0;
    startTime = 0;
    totalTime = 0;
    step = 0;

    constructor() {
        this.Reset();
    }

    Start() {
        this.Reset();
    }

    Reset() {
        this.startTime = Date.now();
        this.totalTime = 0;
        this.step = 0;
        this.lastTime = Date.now();
    }

    Step() {
        const now = Date.now();
        this.step = now - this.lastTime;
        this.totalTime += this.step;
        this.lastTime = now;

        return this.step;
    }
}

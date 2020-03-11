var ID_CONST = { Player: 100, Enemy: 2, PowerUp: -3, Grid: -1, Flag: 9001, Wall: -101, Ground: -100, Bullet: 101, Street: -80, Spawner: 10 }
var KEY_CONST = { left: 65, right: 68, up: 87, down: 83, pause: 80 };
var _DEBUG = { draw: false, time: false, physics: false, keyboard: false, generation: false, mouse: false, game: false };

class Debug {
    static log() {
        if (_DEBUG){
            console.log(...arguments);
        }
    }

    static draw() {
        if (_DEBUG.draw){
            console.log(...arguments);
        }
    }

    static time() {
        if (_DEBUG.time){
            console.log(...arguments);
        }
    }

    static physics() {
        if (_DEBUG.physics){
            console.log(...arguments);
        }
    }

    static keyboard() {
        if (_DEBUG.keyboard){
            console.log(...arguments);
        }
    }

    static generation() {
        if (_DEBUG.generation){
            console.log(...arguments);
        }
    }

    static mouse() {
        if (_DEBUG.mouse){
            console.log(...arguments);
        }
    }

    static game() {
        if (_DEBUG.game) {
            console.log(...arguments);
        }
    }
}

class Mouse {
    button = undefined;
    isDown = false;
    isUp = true;
    press = undefined;
    release = undefined;
    move = undefined;
    lastPos = new Point(0, 0);
    pos = new Point(0, 0);

    _canvas;

    constructor(button, canvas){
        this.button = button;
        this._canvas = canvas;
        
        //Attach event listeners to canvas
        canvas.addEventListener(
            "mousedown", this.downHandler.bind(this), false
        );
        canvas.addEventListener(
            "mouseup", this.upHandler.bind(this), false
        );
        canvas.addEventListener(
            "mousemove", this.moveHandler.bind(this), false
        );
    }

    getMousePos(mouseEvent) {
        const rect = this._canvas.getBoundingClientRect();
        return new Point(mouseEvent.clientX - rect.left, mouseEvent.clientY - rect.top);
    }

    setPos(pos) {
        this.lastPos = this.pos;
        this.pos = pos;
    }

    //The `downHandler`
    downHandler(event) {
        const pos = this.getMousePos(event);
        this.setPos(pos);

        if(this.button === undefined || this.button == event.button){
            if (this.isUp && this.press) {
                this.press(event);
            }
            this.isDown = true;
            this.isUp = false;

            event.preventDefault();
        }
    };

    //The `upHandler`
    upHandler(event) {
        const pos = this.getMousePos(event);
        this.setPos(pos);

        if(this.button === undefined || this.button == event.button){
            if (this.isDown && this.release) {
                this.release(event);
            }
            this.isDown = false;
            this.isUp = true;
            
            event.preventDefault();
        }
    };

    //The `moveHandler`
    moveHandler(event) {
        const pos = this.getMousePos(event);
        this.setPos(pos);
        
        if(this.move) {
            this.move(pos);
        }
    };
}

class Key {
    code;
    isDown = false;
    isUp = true;

    //callbacks
    onPress = [];
    onRelease = [];

    constructor(keyCode){
        this.code = keyCode;
        
        //Attach event listeners
        window.addEventListener(
            "keydown", this.downHandler.bind(this), false
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

    onClick(onPress, onRelease) {
        if (onPress) {
            this.onPress.push(onPress);
        }
        if (onRelease) {
            this.onRelease.push(onRelease);
        }
    }

    downHandler(event) {
      if (event.keyCode === this.code) {
        if (this.press) {
            this.press();
        }
        this.isDown = true;
        this.isUp = false;

        event.preventDefault();
      }
    };

    upHandler(event) {
      if (event.keyCode === this.code) {
        if (this.release) {
            this.release();
        }
        this.isDown = false;
        this.isUp = true;

        event.preventDefault();
      }
    };
}

//Extends Math library to have a range method
Math.range = function(min, max){
    return Math.floor((Math.random() * max) + min);
}

class KeyboardManager {
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
    
        if(KeyboardManager.isKeyDown(KEY_CONST.right)){
            x = -1;
        }
        if(KeyboardManager.isKeyDown(KEY_CONST.down)){
            y = -1;
        }
        if(KeyboardManager.isKeyDown(KEY_CONST.left)){
            x = 1;
        }
        if(KeyboardManager.isKeyDown(KEY_CONST.up)){
            y = 1;
        }
    
        return { x, y };
    }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
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
function invokeDebounce(func, invoked, immediate) {
	const times = 0;
	return function() {        
        var callNow = immediate && times === 0;
        times++;

		if (callNow || times >= invoked) {
            func.apply(context, args);
            times = immediate? 1 : 0; //prevent a double call
        }
	};
};

define(['./canvas'], function() {
    return {
        ID_CONST,
        KEY_CONST,
        Debug,
        Mouse,
        Key,
        KeyboardManager
    };
});
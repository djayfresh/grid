var ID_CONST = { Player: 100, Enemy: 2, PowerUp: -3, Grid: -1, Flag: 9001, Wall: -101, Ground: -100 }
var KEY_CONST = { left: 65, right: 68, up: 87, down: 83 };
var _DEBUG = { draw: true, time: false, physics: false, keyboard: false, generation: false, mouse: false };

var Debug = {
    log: function() {
        if (_DEBUG){
            console.log(...arguments);
        }
    },
    draw: function() {
        if (_DEBUG.draw){
            console.log(...arguments);
        }
    },
    time: function() {
        if (_DEBUG.time){
            console.log(...arguments);
        }
    },
    physics: function() {
        if (_DEBUG.physics){
            console.log(...arguments);
        }
    },
    keyboard: function() {
        if (_DEBUG.keyboard){
            console.log(...arguments);
        }
    },
    generation: function() {
        if (_DEBUG.generation){
            console.log(...arguments);
        }
    },
    mouse: function() {
        if (_DEBUG.mouse){
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
        var rect = this._canvas.getBoundingClientRect();
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

        if(!this.button || this.button == event.button){
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

        if(!this.button || this.button == event.button){
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
        if (this.isUp && this.press) {
            this.press();
        }
        this.isDown = true;
        this.isUp = false;

        event.preventDefault();
      }
    };

    upHandler(event) {
      if (event.keyCode === this.code) {
        if (this.isDown && this.release) {
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

var KeyboardManager = {
    downKeys: {},
    trackedKeys: {},
    isKeyDown: function(keyCode) {
        return KeyboardManager.downKeys[keyCode];
    },
    track: function(keyCode) {
        if (!this.trackedKeys[keyCode]) {
            const key = new Key(keyCode);
            key.onClick(() => this.downKeys[keyCode] = true, () => this.downKeys[keyCode] = false);
            this.trackedKeys[keyCode] = key;
        }

        return this.trackedKeys[keyCode];
    }
}

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
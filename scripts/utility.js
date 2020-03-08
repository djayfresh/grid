var ID_CONST = { Player: 1, Enemy: 2, PowerUp: 3, Grid: 100, Flag: 9001, Wall: 101 }
var KEY_CONST = { left: 65, right: 68, up: 87, down: 83 };
var _DEBUG = { draw: false, time: false, physics: false, keyboard: false, generation: false, mouse: false };

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

function mouse(button) {
    let mouse = {};
    mouse.button = button;
    mouse.isDown = false;
    mouse.isUp = true;
    mouse.press = undefined;
    mouse.release = undefined;
    mouse.move = undefined;
    mouse.lastX = 0;
    mouse.lastY = 0;
    mouse.x = 0;
    mouse.y = 0;

    function getMousePos(mouseEvent) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: mouseEvent.clientX - rect.left,
            y: mouseEvent.clientY - rect.top
        }
    }

    mouse.setPos = function(pos) {
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;

        mouse.x = pos.x;
        mouse.y = pos.y;
    }

    //The `downHandler`
    mouse.downHandler = event => {
        const pos = getMousePos(event);
        mouse.setPos(pos);

        if(!mouse.button || mouse.button == event.button){
            if (mouse.isUp && mouse.press) mouse.press(event);
            mouse.isDown = true;
            mouse.isUp = false;

            event.preventDefault();
        }
    };

    //The `upHandler`
    mouse.upHandler = event => {
        const pos = getMousePos(event);
        mouse.setPos(pos);

        if(!mouse.button || mouse.button == event.button){
            if (mouse.isDown && mouse.release) mouse.release(event);
            mouse.isDown = false;
            mouse.isUp = true;
            
            event.preventDefault();
        }
    };

    //The `moveHandler`
    mouse.moveHandler = event => {
        const pos = getMousePos(event);
        mouse.setPos(pos);
        
        if(mouse.move) mouse.move(pos);

    };

    //Attach event listeners to canvas
    canvas.addEventListener(
        "mousedown", mouse.downHandler.bind(mouse), false
    );
    canvas.addEventListener(
        "mouseup", mouse.upHandler.bind(mouse), false
    );
    canvas.addEventListener(
        "mousemove", mouse.moveHandler.bind(mouse), false
    );

    return mouse;
}

var BoundKeys = [];
function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = () => { key.onPress.forEach(press => { press(); }); Debug.keyboard("Key Pressed", key.code); };
    key.release = () => { key.onRelease.forEach(release => { release(); }); Debug.keyboard("Key Released", key.code); };
    BoundKeys.push(keyCode);
    key.onPress = [];
    key.onRelease = [];

    key.onClick = (onPress, onRelease) => {
        key.onPress.push(onPress);
        key.onRelease.push(onRelease);
    }

    //The `downHandler`
    key.downHandler = event => {
      if (event.keyCode === key.code) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
      }

      if(BoundKeys.find(k => k == event.keyCode)){
        event.preventDefault();
      }
    };
  
    //The `upHandler`
    key.upHandler = event => {
      if (event.keyCode === key.code) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
      }
      if(BoundKeys.find(k => k == event.keyCode)){
        event.preventDefault();
      }
    };
  
    //Attach event listeners
    window.addEventListener(
      "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
      "keyup", key.upHandler.bind(key), false
    );
    return key;
}

function range(min, max){
    return Math.floor((Math.random() * max) + min);
}

var keyboardManager = {
    downKeys: {},
    trackedKeys: {},
    isKeyDown: function(keyCode) {
        return keyboardManager.downKeys[keyCode];
    },
    track: function(keyCode) {
        if (!this.trackedKeys[keyCode]) {
            keyboard(keyCode).onClick(() => this.downKeys[keyCode] = true, () => this.downKeys[keyCode] = false);
            this.trackedKeys[keyCode] = true;
        }
    }
}

define(['./canvas'], function() {
    return {
        ID_CONST,
        KEY_CONST,
        Debug,
        mouse,
        keyboard,
        range,
        keyboardManager
    };
});
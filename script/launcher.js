var ID_CONST = { Player: 1, Enemy: 2, PowerUp: 3, Grid: 100, Flag: 9001 }
var _DEBUG = { draw: false, time: false, physics: false };
var gameMaster = {};
var board = {
    width: 500,
    heigh: 500,
    size: 1,
};
var physics = {};
var canvas = null;
var ctx = null;
var timer = {};

/* Game */

function Play() {
    gameMaster.state = gameMaster.play;
}
function Pause() {
    gameMaster.state = gameMaster.pause;
}
function Stop() {
    if (timer.interval){
        clearInterval(timer.interval);
        timer.interval = null;
    }
    Pause();
}
function Start() {
    gameMaster.setup();
}

gameMaster.play = function() {
    physics.check();
    board.draw();
};
gameMaster.pause = function() { Debug.log("Game Paused"); };

gameMaster.setup = function() {
    canvas = document.getElementById("grid-canvas");
    ctx = canvas.getContext("2d");
    board.setup(20, 20, [
        {x: 0, y: 0, value: ID_CONST.Player},
        {x: 10, y: 15, value: ID_CONST.Enemy},
        {x: 18, y: 0, value: ID_CONST.Flag}
    ]);
    timer.start = Date.now();
    timer.last = timer.start;

    //set the start state
    Play();

    gameMaster.render();

    timer.interval = setInterval(gameMaster.render, 1000);
}

gameMaster.render = function() {
    timer.step = Date.now() - timer.last;
    gameMaster.state();
    timer.last = Date.now();

    Debug.time(timer);
}

/* Board */

//temp
board.grid = [
    [ID_CONST.Player, ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid],
    [ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid ],
    [ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid ],
    [ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Enemy]
];

board.setup = function(x, y, cords) {
    board.grid = [];
    
    for(let i = 0; i < y; i++){
        board.grid[i] = [];
        for(let j = 0; j < x; j++){
            board.grid[i][j] = ID_CONST.Grid;

            cords.forEach(cord => {
                if (cord.x === j && cord.y === i){
                    board.grid[i][j] = cord.value;
                }
            });
        }
    }
}

board.draw = function() {
    ctx.clearRect(0, 0, board.width, board.heigh);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = 'rgba(0, 153, 255, 0.4)';
    ctx.save();

    const rectSize = (board.width / board.grid.length) - 1;
    Debug.draw("Rect Size", rectSize, "Board:", board.grid.length, "width:", board.width)
    let gridX = 0;
    let gridY = 0;

    for(let i = 0; i < board.grid.length; i++){
        for(let j = 0; j < board.grid[i].length; j++){
            const space = board.grid[i][j];
            Debug.draw("Draw:", space, "at:", gridX * j, gridY * i, "color:", board.getColor(space))

            ctx.fillStyle = board.getColor(space);
            ctx.fillRect(gridX * j, gridY * i, rectSize, rectSize);
            ctx.save();

            Debug.draw("Draw Line:", rectSize * (j + 1), gridY * i)
            Debug.draw("Draw Line:", rectSize * (j + 1), gridY * (i + 1))
            Debug.draw("Draw Line:",gridX * j , gridY * (i + 1))

            ctx.strokeStyle = 'black';
            const lineX = gridX || rectSize + 1;
            const lineY = gridY || rectSize + 1;
            ctx.moveTo(lineX * (j + 1), lineY * i); //top right
            ctx.lineTo(lineX * (j + 1), lineY * (i + 1)); //bottom right
            ctx.lineTo(lineX * j , lineY * (i + 1)); //bottom left
            ctx.stroke()

            gridX = rectSize + 1;
        }
        gridY = rectSize + 1;
        gridX = 0;
    }
}

board.getColor = function(id) {
    if (id === ID_CONST.Player) {
        return '#004600'
    }
    if (id === ID_CONST.Enemy){
        return '#820027'
    }
    if (id === ID_CONST.PowerUp){
        return '#005ac6'
    }
    if (id === ID_CONST.Flag){
        return '#c6b600'
    }
    return '#FFFFFF'
}

board.getPos = function(id){
    for(let i = 0; i < board.grid.length; i++){ //Vertical (y)
        for(let j = 0; j < board.grid[i].length; j++){ //Horizontal (x)
            if (board.grid[i][j] === id){
                return { x: j, y: i };
            }
        }
    }
    return null;
}

board.canMove = function(id, x, y) { //returns destinationInfo or false
    const idPos = board.getPos(id);

    if (!!idPos){
        const gridY = idPos.y;
        const gridX = idPos.x;
        let destination = ID_CONST.Grid;

        if (x > 0){
            if ((gridX + x) >= board.grid[gridY].length){
                destination = -1; //right bounds
            }
        }
        else {
            if ((gridX + x) < 0){
                destination = -1; //left bounds
            }
        }

        if (y > 0){
            if ((gridY + y) >= board.grid.length){
                destination = -1; //bottom bounds
            }
        }
        else {
            if ((gridY + y) < 0){
                destination = -1; //top bounds
            }
        }

        if (destination === ID_CONST.Grid){ //wasn't out of bounds
            destination = board.grid[gridY+y][gridX+x];

            return { pos: idPos, destination: destination };
        }
        else {
            return false;
        }

    }

    return false;
}

board.move = function(id, x, y){
    const movement = board.canMove(id, x, y);

    Debug.physics("Move:", id, "x:", x, "y:", y, "movement:", movement);

    if (movement){
        if (movement.destination === ID_CONST.Flag){
            Pause();
        }

        board.grid[movement.pos.y][movement.pos.x] = ID_CONST.Grid;
        board.grid[movement.pos.y + y][movement.pos.x + x] = id;
    }
}


/* Physics */

physics.check = function() {
    board.move(ID_CONST.Player, 1, 0);
}


/* Utility */

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
    }
}


var BoundKeys = [];
function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = () => { key.onPress.forEach(press => { press(); }); };
    key.release = () => { key.onRelease.forEach(release => { release(); }); };
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


function mouse(button) {
    let mouse = {};
    mouse.button = button;
    mouse.isDown = false;
    mouse.isUp = true;
    mouse.press = undefined;
    mouse.release = undefined;
    mouse.move = undefined;
    mouse.x = 0;
    mouse.y = 0;

    //The `downHandler`
    mouse.downHandler = event => {
        if(mouse.button == event.button){
            if (mouse.isUp && mouse.press) mouse.press();
            mouse.isDown = true;
            mouse.isUp = false;

            event.preventDefault();
        }
    };

    //The `upHandler`
    mouse.upHandler = event => {
        if(mouse.button == event.button){
            if (mouse.isDown && mouse.release) mouse.release();
            mouse.isDown = false;
            mouse.isUp = true;
            
            event.preventDefault();
        }
    };

    //The `moveHandler`
    mouse.moveHandler = event => {
        if(mouse.move) mouse.move(event);

        mouse.x = event.screenX;
        mouse.y = event.screenY;
    };

    //Attach event listeners
    window.addEventListener(
        "mousedown", mouse.downHandler.bind(mouse), false
    );
    window.addEventListener(
        "mouseup", mouse.upHandler.bind(mouse), false
    );
    window.addEventListener(
        "mousemove", mouse.moveHandler.bind(mouse), false
    );

    return mouse;
}


/* Runner */

document.addEventListener("DOMContentLoaded", function () {
    Start();
});
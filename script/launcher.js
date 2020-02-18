var ID_CONST = { Player: 1, Enemy: 2, PowerUp: 3, Grid: 100, Flag: 9001, Wall: 101 }
var KEY_CONST = { left: 65, right: 68, up: 87, down: 83 };
var _DEBUG = { draw: false, time: false, physics: false, keyboard: false, generation: false, mouse: false };
var gameMaster = {};
var board = {
    size: 500,
    width: 500,
    grids: 6,
};
var physics = {};
var canvas = null;
var ctx = null;
var timer = {
    gameSpeed: 150, //ms
    roundStartDelay: 2000, //ms
    roundStartTime: 0,
    gameResetDelay: 2000 //ms
};

var difficulty = 1;
var score = 0;
var _lastScore = 0;

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
    timer.roundStartTime = 0;
    gameMaster.setup();
}

gameMaster.play = function() {
    timer.roundStartTime += timer.step;

    if(gameMaster.roundStarted()){
        physics.check();
    }

    gameMaster.draw();
};
gameMaster.pause = function() { Debug.log("Game Paused"); };

gameMaster.setup = function() {
    if (difficulty > ((board.grids - 1) * (board.grids - 1))){
        //maybe we store high scores sometime
        difficulty = 1; //reset
        _lastScore = score;
        score = 0;
        timer.roundStartTime = -timer.gameResetDelay;
    }

    canvas = document.getElementById("grid-canvas");
    ctx = canvas.getContext("2d");
    
    const map = board.generateMap();
    board.setup(map);
    board.resize();

    keyboardManager.track(KEY_CONST.left); //left
    keyboardManager.track(KEY_CONST.right); //right
    keyboardManager.track(KEY_CONST.up); //up
    keyboardManager.track(KEY_CONST.down); //down

    const ms = mouse();
    ms.press = () => { 
        const pos = board.mouseToBoard(ms.x, ms.y);
        const player = board.getPos(ID_CONST.Player);

        const moveX = pos.x - player.x;
        const moveY = pos.y - player.y;

        Debug.mouse("Move player", player, pos, moveX, moveY);

        if (1 >= moveX && moveX >= -1 && 1 >= moveY && moveY >= -1){
            physics.movePlayer(moveX, moveY);
        }
    };

    timer.start = Date.now();
    timer.last = timer.start;

    //set the start state
    Play();

    gameMaster.render();

    if (timer.interval){
        clearInterval(timer.interval);
    }
    timer.interval = setInterval(gameMaster.render, timer.gameSpeed);
}

gameMaster.render = function() {
    timer.step = Date.now() - timer.last;
    gameMaster.state();
    timer.last = Date.now();

    Debug.time(timer);
}

gameMaster.gameReset = function() {
    return timer.roundStartTime < 0;
}
gameMaster.roundStarted = function() {
    return timer.roundStartTime > timer.roundStartDelay;
}

gameMaster.draw = function() {
    ctx.clearRect(0, 0, board.size, board.size);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = 'rgba(0, 153, 255, 0.4)';

    if (gameMaster.roundStarted()){
        board.draw();
    }
    else if (gameMaster.gameReset()){
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Game Over`, board.size / 2, board.size / 3);
        ctx.fillText(`Score: ${_lastScore}`, board.size / 2, board.size / 2);
    }
    else {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Round Starting - ${difficulty}`, board.size / 2, board.size / 2);
    }
    
    //refresh score:
    const $score = document.getElementById('game-score');
    if (!!$score){
        $score.innerText = score;
    }
}

/* Board */

//temp
board.grid = [
    [ID_CONST.Player, ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid],
    [ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid ],
    [ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid ],
    [ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Grid, ID_CONST.Enemy]
];

board.setup = function(map) {
    board.grid = [...map];
}

board.draw = function() {
    const rectSize = (board.size / board.grid.length) - 1;
    Debug.draw("Rect Size", rectSize, "Board:", board.grid.length, "size:", board.grids)
    let gridX = 0;
    let gridY = 0;

    //Left Edge
    ctx.moveTo(0, 0);
    ctx.lineTo(0, board.size);
    ctx.stroke();

    for(let i = 0; i < board.grid.length; i++){
        for(let j = 0; j < board.grid[i].length; j++){
            const space = board.grid[i][j];

            if (space !== ID_CONST.Grid){
                Debug.draw("Draw:", space, "at:", gridX * j, gridY * i, "color:", board.getColor(space))

                ctx.fillStyle = board.getColor(space);
                ctx.fillRect(gridX * j, gridY * i, rectSize, rectSize);
            }

            gridX = rectSize + 1;

            if (i == 0){
                ctx.strokeStyle = 'black';
                const lineX = gridX || rectSize + 1;
                ctx.moveTo(lineX * (j + 1), 0); //top
                ctx.lineTo(lineX * (j + 1), board.size); //bottom
                ctx.stroke()
            }
        }

        ctx.strokeStyle = 'black';
        const lineY = gridY || rectSize + 1;
        ctx.moveTo(0, lineY * i); //left
        ctx.lineTo(board.size, lineY * i); //right
        ctx.stroke()

        gridY = rectSize + 1;
        gridX = 0;
    }

    //Bottom Edge
    ctx.moveTo(0, board.size);
    ctx.lineTo(board.size, board.size);
    ctx.stroke();
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
    if (id === ID_CONST.Wall){
        return '#441d00'
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

//find a piece based on the canvas x/y
board.getId = function(x, y) {
    const pos = board.mouseToBoard(x, y);
    return board.grid[pos.y][pos.x];
}

board.mouseToBoard = function(x, y) {
    const rectSize = board.width / board.grids;
    const cellX = Math.floor(x / rectSize);
    const cellY = Math.floor(y / rectSize);
    return { x: cellX, y: cellY };
}

board.getMove = function(id, x, y) { //returns destinationInfo or false
    if (x === 0 && y === 0 ){
        return false;
    }

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

board.move = function(id, x, y, movement){
    Debug.physics("Move:", id, "x:", x, "y:", y, "movement:", movement);

    board.grid[movement.pos.y][movement.pos.x] = ID_CONST.Grid;
    board.grid[movement.pos.y + y][movement.pos.x + x] = id;
}

board.resize = function() {
    board.size = canvas.width;
    board.width = canvas.clientWidth;
    canvas.height = canvas.width;
}

/* Board - Generation */

board.generateMap = function() {
    const map = [];
    
    for(let i = 0; i < board.grids; i++){
        map[i] = [];
        for(let j = 0; j < board.grids; j++){
            map[i][j] = ID_CONST.Grid;
        }
    }

    const insert = function(item, it) {
        it = it || 1;
        if (it > 4){
            Debug.generation("Unable to insert item", item);
            item.x = undefined;
            item.y = undefined;
            for(let i = 0; i < board.grids; i++){
                for(let j = 0; j < board.grids; j++){
                    if (map[i][j] === ID_CONST.Grid){
                        item.x = j;
                        item.y = i;
                    }
                }
            }

            if (item.x === undefined || item.y === undefined){
                Debug.generation("Blocking Item", item);
                return;
            }
        }
        item.x = item.x !== undefined ? item.x : range(0, board.grids);
        item.y = item.y !== undefined ? item.y : range(0, board.grids);

        if (map[item.y][item.x] !== ID_CONST.Grid) {
            Debug.generation("Collision:", item, map[item.y][item.x]);
            item.x = undefined;
            item.y = undefined;
            insert(item, ++it);
        }
        else {
            Debug.generation("Insert Item:", item);
            map[item.y][item.x] = item.id;
        }
    }

    //make a wall section
    if (board.grids >= 20){
        insert({ x: 0, y: 10, id: ID_CONST.Wall});
        insert({ x: 1, y: 10, id: ID_CONST.Wall});
        insert({ x: 2, y: 10, id: ID_CONST.Wall});
        insert({ x: 3, y: 10, id: ID_CONST.Wall});
        insert({ x: 4, y: 10, id: ID_CONST.Wall});
        insert({ x: 5, y: 10, id: ID_CONST.Wall});
        insert({ x: 5, y: 9, id: ID_CONST.Wall});
        insert({ x: 5, y: 8, id: ID_CONST.Wall});
        insert({ x: 5, y: 7, id: ID_CONST.Wall});
    }

    insert({ id: ID_CONST.Player }); // player randomly on the map
    insert({ id: ID_CONST.Flag }); // flag randomly on the map

    if (difficulty > 10 && Math.random() > 0.75){
        insert({ id: ID_CONST.PowerUp });
    }

    for (let i = 0; i < difficulty; i++) {
        insert({ id: ID_CONST.Enemy }); // enemy randomly on the map
    }

    return map;
}


/* Physics */

physics.check = function() {
    let x = 0;
    let y = 0;

    if(keyboardManager.isKeyDown(KEY_CONST.right)){
        x = 1;
    }
    if(keyboardManager.isKeyDown(KEY_CONST.down)){
        y = 1;
    }
    if(keyboardManager.isKeyDown(KEY_CONST.left)){
        x = -1;
    }
    if(keyboardManager.isKeyDown(KEY_CONST.up)){
        y = -1;
    }

    physics.movePlayer(x, y);

    Debug.keyboard("Keys down:", keyboardManager.downKeys);
}

physics.movePlayer = function(x, y){
    const movement = board.getMove(ID_CONST.Player, x, y);
    if (movement) {
        const movePlayer = function() {
            board.move(ID_CONST.Player, x, y, movement);
        };

        if (movement.destination !== ID_CONST.Grid){
            //check game states
            switch(movement.destination){
                case ID_CONST.Wall:
                    //no move
                    break;
                case ID_CONST.Enemy:
                    Debug.log("Lost Game");
                    Start();
                    break;
                case ID_CONST.Flag:
                    movePlayer();
                    Debug.log("Win Game");
                    score += 1;
                    difficulty += 1;
                    Start();
                    break;
                case ID_CONST.PowerUp:
                    //Enable PowerUP
                    Debug.log("Power Up");
                    difficulty - 2;
                    movePlayer();
                    break;
                default:
                    movePlayer();
                    break;
            }
        }
        else {
            movePlayer();
        }
    }
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

function range(min, max){
    return Math.floor((Math.random() * max) + min);
}


/* Runner */

document.addEventListener("DOMContentLoaded", function () {
    Start();
});

window.addEventListener("resize", function() {
    board.resize();
}, false);
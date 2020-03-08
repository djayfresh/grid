var gameMaster = {};

var difficulty = 1;
var score = 0;
var _lastScore = 0;

var timer = {
    gameSpeed: 150, //ms
    roundStartDelay: 2000, //ms
    roundStartTime: 0,
    gameResetDelay: 2000 //ms
};

gameMaster.play = function() {
    timer.roundStartTime += timer.step;

    if(gameMaster.roundStarted()){
        physics.check();
    }

    gameMaster.draw();
};
gameMaster.pause = function() { Debug.log("Game Paused"); };

gameMaster.init = function() {
}

gameMaster.setup = function() {
    if (difficulty > ((board.grids - 1) * (board.grids - 1))){
        //maybe we store high scores sometime
        difficulty = 1; //reset
        _lastScore = score;
        score = 0;
        timer.roundStartTime = -timer.gameResetDelay;
    }
    
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
    gameMaster.state = gameMaster.play;

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

define(['./canvas', './utility', './board', './physics'], function () {
    return {
        gameMaster,
        Play,
        Pause,
        Stop,
        Start
    };
});
  
define(function (require) {
    var board = require('./board');
    var utility = require('./utility')
    var game = require('./game');
    var launcher = require('./launcher');
    var physics = require('./physics')
    var gameMaster = game.gameMaster;


    console.log("launcher", launcher);
    console.log("board", board);
    console.log("utility", utility);
    console.log("game", game);
    console.log("physics", physics);

    
    gameMaster.init();
    gameMaster.setup();
    game.Play();

    window.addEventListener("resize", function() {
        board.resize();
    }, false);
});
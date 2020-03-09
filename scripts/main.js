  
define(function (require) {
    var board = require('./board');
    var utility = require('./utility');
    var game = require('./game');
    var launcher = require('./launcher');
    var physics = require('./physics');
    var objects = require('./objects');
    var render = require('./renderer');
    var gameMaster = game.gameMaster;


    console.log("launcher", launcher);
    console.log("board", board);
    console.log("utility", utility);
    console.log("game", game);
    console.log("physics", physics);
    console.log("objects", objects);
    console.log("renderer", renderer);

    var rect = new objects.Rectangle(ID_CONST.Player, '#004600', 20, 20);
    var renderer = new render.Renderer();

    renderer.add(rect);

    renderer.draw(ctx);

    
    // gameMaster.init();
    // gameMaster.setup();
    // game.Play();

    window.addEventListener("resize", function() {
        board.resize();
    }, false);
});
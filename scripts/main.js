  
define(function (require) {
    var board = require('./board');
    var utility = require('./utility');
    var game = require('./game');
    var launcher = require('./launcher');
    var physics = require('./physics');
    var world = require('./world');
    var render = require('./renderer');
    var gameMaster = game.gameMaster;


    console.log("launcher", launcher);
    console.log("board", board);
    console.log("utility", utility);
    console.log("game", game);
    console.log("physics", physics);
    console.log("renderer", render);

    var renderer = new render.Renderer();
    renderer.add(...world.map);
    renderer.draw(ctx, world);

    utility.ke

    
    // gameMaster.init();
    // gameMaster.setup();
    // game.Play();

    window.addEventListener("resize", function() {
        board.resize();
    }, false);
});
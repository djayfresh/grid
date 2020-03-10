
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

    Resize();

    var renderer = new render.Renderer();
    renderer.add(...world.generateMap());

    var lastTime = 0;
    function frame(timespan) {
        const dt = lastTime - timespan;

        Debug.time("Timespan", timespan);

        const worldMove = physics.keyboardMoves();
        world.setPos(world.pos.x + worldMove.x, world.pos.y + worldMove.y);

        renderer.draw(ctx, world);
        renderer.update(dt, world);

        window.requestAnimationFrame(frame)
        lastTime = timespan;
    }

    frame(1);

    var down = utility.KeyboardManager.track(KEY_CONST.down);

    // down.onClick(() => {
    //     world.setPos(world.pos.x, world.pos.y - 1); //move the world ops. of the player

    //     renderer.draw(ctx, world);
    //     renderer.update();
    // });

    var up = utility.KeyboardManager.track(KEY_CONST.up);

    // up.onClick(() => {
    //     world.setPos(world.pos.x, world.pos.y + 1); //move the world ops. of the player

    //     renderer.draw(ctx, world);
    //     renderer.update();
    // });

    var left = utility.KeyboardManager.track(KEY_CONST.left);

    // left.onClick(() => {
    //     world.setPos(world.pos.x + 1, world.pos.y); //move the world ops. of the player

    //     renderer.draw(ctx, world);
    //     renderer.update();
    // });

    var right = utility.KeyboardManager.track(KEY_CONST.right);

    // right.onClick(() => {
    //     world.setPos(world.pos.x - 1, world.pos.y); //move the world ops. of the player

    //     renderer.draw(ctx, world);
    //     renderer.update();
    // });


    // gameMaster.init();
    // gameMaster.setup();
    // game.Play();

    function Resize() {
        canvas.height = canvas.width;
        world.setScreen(canvas.width, canvas.height);
    }

    window.requestAnimationFrame(() => {

    })

    window.addEventListener("resize", function () {
        Resize();
    }, false);
});
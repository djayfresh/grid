
define(function (require) {
    var board = require('./board');
    var utility = require('./utility');
    var game = require('./game');
    var launcher = require('./launcher');
    var physics = require('./physics');
    var objects = require('./objects');
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
        Debug.time("DT", dt);

        const worldMove = physics.keyboardMoves();
        
        if (!checkStreets(world, { x: world.pos.x + (worldMove.x * 2), y: world.pos.y + (worldMove.y * 2) })){
            world.setPos(world.lastPos.x, world.lastPos.y);
        }
        else {
            world.setPos(world.pos.x + worldMove.x, world.pos.y + worldMove.y);
        }

        renderer.draw(ctx, world);
        renderer.update(dt, world);

        window.requestAnimationFrame(frame)
        lastTime = timespan;
    }

    frame(1);

    var mouse = new utility.Mouse(0, canvas);
    mouse.press = () => {
        const direction = Point.subtract(world.clientCenter, mouse.pos);
        const normalized = direction.normalized();
        const force = normalized.multiply(0.06);
        const bullet = new objects.Bullet(world.center, force);
        console.log("Fire", mouse.pos, "c", world.clientCenter, "dir", direction, "norm", normalized, "f", force);
        renderer.add(bullet);
    };

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
        world.setClient(canvas.clientWidth, canvas.clientHeight);
    }

    function checkStreets(world, newPos) {
        const streets = world.map.filter(ro => ro.id === ID_CONST.Street);
        return streets.some(s => 
            physics.collision(world.center.x - (world.player.width), world.center.y - (world.player.height), world.player.width, world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        );
    }

    window.addEventListener("resize", function () {
        Resize();
    }, false);
});

define(function (require) {
    //TODO: Move these into the game.js
    require('./utility');
    require('./renderer');
    require('./physics');
    require('./objects');
    var world = require('./world');

    Resize();

    var renderer = new Renderer();
    renderer.add(...world.generateMap());

    var lastTime = 0;
    function frame(timespan) {
        const dt = lastTime - timespan;

        Debug.time("Timespan", timespan);
        Debug.time("DT", dt);

        const worldMove = Physics.keyboardMoves();
        
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

    var mouse = new Mouse(0, canvas);
    mouse.press = () => {
        const direction = Point.subtract(world.clientCenter, mouse.pos);
        const normalized = direction.normalized();
        const force = normalized.multiply(0.06);
        const bullet = new Bullet(world.center, force);
        Debug.mouse("Fire", mouse.pos, "c", world.clientCenter, "dir", direction, "norm", normalized, "f", force);
        renderer.add(bullet);
    };

    KeyboardManager.track(KEY_CONST.down);
    KeyboardManager.track(KEY_CONST.up);
    KeyboardManager.track(KEY_CONST.left);
    KeyboardManager.track(KEY_CONST.right);

    function Resize() {
        canvas.height = canvas.width;
        world.setScreen(canvas.width, canvas.height);
        world.setClient(canvas.clientWidth, canvas.clientHeight);
    }

    function checkStreets(world, newPos) {
        const streets = world.map.filter(ro => ro.id === ID_CONST.Street);
        return streets.some(s => 
            Physics.collision(world.center.x - (world.player.width), world.center.y - (world.player.height), world.player.width, world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        );
    }

    window.addEventListener("resize", function () {
        Resize();
    }, false);
});
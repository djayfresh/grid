class ZombieGame extends Game {
    _frame(dt) {

    }

    _init() {
        super._init();
    }
}

define(['./utility', './renderer', './world'], function(_util, _render, world) {
    Resize();

    var renderer = new Renderer();
    renderer.add(...world.generateMap());

    var s = frame; //state 
    var lastTime = 0;
    function frame(timespan) {
        const dt = timespan - lastTime;

        Debug.time("Timespan", timespan);
        Debug.time("DT", dt);

        const worldMove = KeyboardManager.moves();
        
        if (!checkStreets(world, { x: world.pos.x + (worldMove.x * 2), y: world.pos.y + (worldMove.y * 2) })){
            world.setPos(world.lastPos.x, world.lastPos.y);
        }
        else {
            world.setPos(world.pos.x + worldMove.x, world.pos.y + worldMove.y);
        }

        renderer.draw(ctx, world);
        renderer.update(dt, world);

        window.requestAnimationFrame(s)
        lastTime = timespan;
    }

    frame(1);

    var mouse = new Mouse(0, canvas);
    mouse.press = () => {
        const force = Point.subtract(mouse.pos, world.canvasCenter).normalized().multiply(0.06);
        const bullet = new Bullet(world.worldCenter, force);
        Debug.mouse("Fire", mouse.pos, "c", world.worldCenter);
        renderer.add(bullet);
    };

    function Pause() {
        s = () => {};
    }

    KeyboardManager.track(KEY_CONST.down);
    KeyboardManager.track(KEY_CONST.up);
    KeyboardManager.track(KEY_CONST.left);
    KeyboardManager.track(KEY_CONST.right);

    var playToggle = true;

    function checkStreets(world, newPos) {
        const streets = world.map.filter(ro => ro.id === ID_CONST.Street);
        return streets.some(s => 
            Physics.collision(world.center.x - (world.player.width), world.center.y - (world.player.height), world.player.width, world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        );
    }
})
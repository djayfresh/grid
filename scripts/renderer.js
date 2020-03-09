class RenderObject {
    id;
    pos;
    layer = 0;
    bounds = { w: 0, h: 0 };

    constructor(id) {
        this.id = id;
        this.pos = new Point(0, 0);
    }

    setPos(x, y) {
        this.pos = new Point(x, y);
    }

    draw(_ctx, _world) {

    };

    update(_dt) {

    };

    isVisible() {
        return true;
    };
}

class Renderer {
    renderObjects = [];

    draw(ctx, world, layer) {
        this.clearScreen(ctx, world);

        const worldDelta = world.getPosDelta();
        Debug.draw('Render Draw:', world.pos, this.renderObjects, worldDelta);
        ctx.translate(worldDelta.x, worldDelta.y);

        this.renderObjects
            .sort((a, b) => a.layer - b.layer)
            .filter(ro => !layer || ro.layer === layer)
            .forEach(ro => {
                Debug.draw('Draw RO', ro.id);
                ro.draw(ctx, world);
            });
    };

    update(dt, world) {
        this.renderObjects.forEach(ro => ro.update(dt, world));
    };

    add() {
        this.renderObjects.push(...arguments);
    };

    remove(id) {
        this.renderObjects = this.renderObjects.filter(ro => ro.id !== id);
    };

    clearScreen(ctx, world) {
        ctx.translate(0, 0);
        ctx.clearRect(0, 0, world.screen.x, world.screen.y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = 'rgba(0, 153, 255, 0.4)';
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static delta(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return { dx, dy };
    }

    static distance(a, b) {
        const delta = Point.delta(a, b);
        return Math.hypot(delta.dx, delta.dy);
    }
}

define(function () {
    return {
        Point,
        Renderer,
        RenderObject
    }
})
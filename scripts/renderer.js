class RenderObject {
    id;
    pos;
    layer = 0;
    bounds = { w: 0, h: 0 };
    _isVisible = true;
    _deleted = false;

    constructor(id, x, y) {
        this.id = id;
        this.pos = new Point(x || 0, y || 0);
    }

    setPos(x, y) {
        this.pos = new Point(x, y);
    }

    draw(_ctx, _world) {

    };

    //Helper function to allow for world translate to to impact drawing an element
    //Use for UI & Player
    drawSticky(ctx, world, drawFunc) {
        ctx.translate(-world.pos.x, -world.pos.y); //reset world translate, move back to 0,0

        drawFunc();

        ctx.translate(world.pos.x, world.pos.y); //reset the translate to w/e the world has been translated to
    }

    update(_dt) {

    };

    isVisible() {
        return this._isVisible && !this._deleted;
    };

    isDeleted() {
        return this._deleted;
    }
}

class Renderer {
    renderObjects = [];

    draw(ctx, world, layer) {
        this.clearScreen(ctx, world);

        const worldDelta = world.getPosDelta();
        Debug.draw('Render Draw:', world.pos, this.renderObjects, worldDelta);
        ctx.translate(worldDelta.x, worldDelta.y);

        this.renderObjects
            .sort((a, b) => b.layer - a.layer)
            .filter(ro => !layer || ro.layer === layer)
            .filter(ro => ro.isVisible())
            .forEach(ro => {
                Debug.draw('Draw RO', ro.id, ro);
                ro.draw(ctx, world);
            });
    };

    update(dt, world) {
        this.renderObjects
            .filter(ro => !ro.isDeleted())
            .forEach(ro => ro.update(dt, world));
    };

    add() {
        this.renderObjects.push(...arguments);
    };

    remove(id) {
        this.renderObjects = this.renderObjects.filter(ro => ro.id !== id);
    };

    clearScreen(ctx, world) {
        ctx.translate(-world.pos.x, -world.pos.y); //reset world translate, move back to 0,0

        ctx.clearRect(-10, -10, world.screen.x + 10, world.screen.y + 10); //clear off boarder too
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.strokeStyle = 'rgba(0, 153, 255, 1)';

        ctx.translate(world.pos.x, world.pos.y); //reset the translate to w/e the world has been translated to
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
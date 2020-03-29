class GridPlayer extends Rectangle {
    constructor(x, y, w, h) {
        super(ID_CONST.Player, '#004600', x, y, w, h);
    }

    draw(ctx, world) {
        this.drawSticky(ctx, world, () => {
            const posX = this.pos.x;
            const posY = this.pos.y;

            ctx.fillStyle = this.color;
            Debug.draw('Player', 'x', posX, 'y', posY, 'w', this.width, 'h', this.height);
            ctx.fillRect(posX, posY, this.width, this.height);
        })
    }

    update(_dt, _world) {

    }
}

define(['../shared/renderer', '../shared/utility', '../shared/physics', '../shared/objects'], function (render) {
    return {
        GridPlayer,
        Point: render.Point
    }
});
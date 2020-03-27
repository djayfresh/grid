class GridPlayer extends Rectangle {
    screen;

    constructor() {
        super(ID_CONST.Player, '#004600', 0, 0, 10, 10);
    }

    get actualPos() {
        return new Point(((this.screen.x / 2) - (this.width / 2)), ((this.screen.y / 2) - (this.height / 2)))
    }

    draw(ctx, world) {
        this.screen = world.screen;

        this.drawSticky(ctx, world, () => {
            ctx.fillStyle = this.color;
            const posX = this.actualPos.x;
            const posY = this.actualPos.y;
            Debug.draw('Player', 'x', posX, 'y', posY, 'w', this.width, 'h', this.height);
            ctx.fillRect(posX, posY, this.width, this.height);
        })
    }

    update(_dt, _world) {

    }
}

define(['../shared/renderer', '../shared/utility', '../shared/physics', '../shared/objects'], function (render) {
    return {
        Player,
        Point: render.Point
    }
});
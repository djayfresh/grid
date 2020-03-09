define(['./objects'], function(objects) {
    var renderObjects = [];
    var player = new objects.Player();
    var rect2 = new objects.Rectangle(ID_CONST.Ground, '#100000', 20, 20);
    var rect3 = new objects.Rectangle(ID_CONST.Bullet, '#000022', 3, 3);

    rect2.setPos(5, 5);
    rect2.layer = 1;
    rect3.layer = 3;
    rect3.update = function() { this.setPos(this.pos.x + 3, this.pos.y); };

    renderObjects.push(player);
    renderObjects.push(rect2);
    renderObjects.push(rect3);

    return {
        pos: new objects.Point(0, 0),
        lastPos: new objects.Point(0, 0),
        map: renderObjects,
        screen: { x: 500, y: 500 },
        player: player,
        setPos: function(x, y) {
            this.lastPos = this.pos;
            this.pos = new objects.Point(x, y);
        },
        getPosDelta: function() {
            const delta = objects.Point.delta(this.pos, this.lastPos);
            return new objects.Point(delta.dx, delta.dy);
        }
    };
});
define(['./objects'], function(objects) {
    var renderObjects = [];
    var player = new objects.Rectangle(ID_CONST.Player, '#004600', 20, 20);
    var rect2 = new objects.Rectangle(ID_CONST.Ground, '#100000', 20, 20);

    rect2.setPos(5, 5);
    rect2.layer = 1;

    renderObjects.push(player);
    renderObjects.push(rect2);

    return {
        pos: new objects.Point(0, 0),
        map: renderObjects,
        player: player
    };
});
define(['./objects'], function(objects) {
    class World {
        pos = new objects.Point(0, 0);
        lastPos = new objects.Point(0, 0);
        origin = new objects.Point(0, 0);
        map = [];
        screen = { x: 500, y: 500 };
        player = null;
        moved = false;
        id;
    
        constructor(id){
            this.id = id;
            
            this.pos = new objects.Point(0, 0);
            this.lastPos = new objects.Point(0, 0);
            this.origin = new objects.Point(0, 0);
        }
    
        setMap(map){
            this.map = map;
        }
    
        setPlayer(player){
            this.player = player;
        }
    
        setScreen(x, y) {
            this.screen = { x, y };
        }
    
        setPos(x, y) {
            this.moved = this.pos.x !== x || this.pos.y !== y;
            this.origin = new objects.Point(this.pos.x - x, this.pos.y - y);
            this.lastPos = this.pos;
            this.pos = new objects.Point(x, y);
        }
    
        getPosDelta() {
            const delta = objects.Point.delta(this.pos, this.lastPos);
            return new objects.Point(delta.dx, delta.dy);
        }
    }

    var renderObjects = [];
    var player = new objects.Player();
    var rect2 = new objects.Rectangle(ID_CONST.Ground, '#100000', 5, 5, 20, 20);
    var rect3 = new objects.Rectangle(ID_CONST.Bullet, '#8e8702', 0, 0, 3, 3);

    rect2.layer = 1;
    rect3.layer = 3;
    rect3.update = function() { this.setPos(this.pos.x + 3, this.pos.y); };

    renderObjects.push(player);
    renderObjects.push(rect2);
    renderObjects.push(rect3);

    const world = new World(1);

    world.setMap(renderObjects);
    world.setPlayer(player);


    return world;
});
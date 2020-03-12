class World {
    pos = new Point(0, 0);
    lastPos = new Point(0, 0);
    origin = new Point(0, 0);
    map = [];
    screen = { x: 500, y: 500 };
    canvas = { x: 500, y: 500 };
    player = null;
    moved = false;
    id;

    constructor(id){
        this.id = id;
        
        this.pos = new Point(0, 0);
        this.lastPos = new Point(0, 0);
        this.origin = new Point(0, 0);
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
        this.origin = new Point(this.pos.x - x, this.pos.y - y);
        this.lastPos = this.pos;

        this.pos = new Point(x, y);
    }

    getPosDelta() {
        return Point.subtract(this.pos, this.lastPos);
    }

    get center() {
        return new Point(this.screen.x / 2, this.screen.y / 2);
    }

    get canvasCenter() {
        return new Point(this.canvas.x / 2, this.canvas.y / 2);
    }

    get worldCenter() {
        return this.toWorldOffset(this.center); // new Point(this.center.x - this.pos.x, this.center.y - this.pos.y);
    }

    toWorldPositition(a){
        return new Point(a.x + this.pos.x, a.y + this.pos.y);
    }

    toWorldOffset(a){
        return new Point(a.x - this.pos.x, a.y - this.pos.y);
    }

    generateMap() {
        //placeholder
    }
}

define(['./renderer', './objects'], function() {

    const world = new World(1);

    //TODO: Move to board
    world.generateMap = function() {
        const renderObjects = [];
        const streetWidth = 40;

        const player = new Player();
        renderObjects.push(player);

        //Streets
        renderObjects.push(new Rectangle(ID_CONST.Street, '#000000', 5, 5, streetWidth, 500)); //left street
        renderObjects.push(new Rectangle(ID_CONST.Street, '#000000', streetWidth + 5, world.center.y - (streetWidth/2), 400, streetWidth)); //left street

        renderObjects.push(new Rectangle(ID_CONST.Ground, '#043511', -1000, -1000, 2000, 2000)); //global ground
        renderObjects.push(new Spawner('#00405e', 100, 100));
    
        this.setMap(renderObjects);
        this.setPlayer(player);

        return renderObjects;
    };

    return world;
});
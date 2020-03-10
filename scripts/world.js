define(['./objects'], function(objects) {
    class World {
        pos = new objects.Point(0, 0);
        lastPos = new objects.Point(0, 0);
        origin = new objects.Point(0, 0);
        map = [];
        screen = { x: 500, y: 500 };
        client = { x: 500, y: 500 };
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

        setClient(x, y) {
            console.warn('Set Client', x, y);
        }
    
        setScreen(x, y) {
            console.warn('Set Screen', x, y);
            this.screen = { x, y };
        }
    
        setPos(x, y) {
            this.moved = this.pos.x !== x || this.pos.y !== y;
            this.origin = new objects.Point(this.pos.x - x, this.pos.y - y);
            this.lastPos = this.pos;

            this.pos = new objects.Point(x, y);
        }
    
        getPosDelta() {
            return objects.Point.subtract(this.pos, this.lastPos);
        }

        get center() {
            return new objects.Point(this.screen.x / 2, this.screen.y / 2);
        }

        get clientCenter() {
            return new objects.Point(this.client.x / 2, this.client.y / 2);
        }

        generateMap() {
            //placeholder
        }
    }

    const world = new World(1);

    //TODO: Move to board
    world.generateMap = function() {
        const renderObjects = [];
        const streetWidth = 40;

        const player = new objects.Player();
        renderObjects.push(player);

        //Streets
        renderObjects.push(new objects.Rectangle(ID_CONST.Street, '#000000', 5, 5, streetWidth, 500)); //left street
        renderObjects.push(new objects.Rectangle(ID_CONST.Street, '#000000', streetWidth + 5, world.center.y - (streetWidth/2), 400, streetWidth)); //left street

        //test bullet
        renderObjects.push(new objects.Bullet(world.center, { x: -0.003, y: -0.02 }));

        renderObjects.push(new objects.Rectangle(ID_CONST.Ground, '#043511', -1000, -1000, 2000, 2000)); //global ground
    
        this.setMap(renderObjects);
        this.setPlayer(player);

        return renderObjects;
    };

    return world;
});
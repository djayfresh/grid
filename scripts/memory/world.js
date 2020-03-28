define(['../shared/renderer', '../shared/objects', '../shared/world', '../shared/canvas', './objects'], function() {

    const world = new World(1);

    world.gridToPos = function(x, y) {
        return new Point(x * world.squareSize.x, y * world.squareSize.y);
    }

    //TODO: Move to board
    world.generateMap = function() {
        const renderObjects = [];
        const gridSize = 6;
        const squareX = (canvas.width / gridSize);
        const squareY = (canvas.height / gridSize);

        world.squareSize = {x: squareX, y: squareY};
        world.gridSize = gridSize;

        const addCard = function(color, x, y){
            const playerPos = world.gridToPos(x, y);
            const testCard = new Card(color, playerPos.x, playerPos.y, squareX, squareY);
            renderObjects.push(testCard);
        }

        addCard('#FF0000', 0, 0);
        addCard('#FF0000', 4, 0);
        addCard('#00FF00', 1, 0);
        addCard('#00FF00', 0, 2);

        //grid
        for(let i = 0; i <= gridSize; i++){
            let x = squareX * i;
            let y = squareY * i;

            //Down
            renderObjects.push(new Line(ID_CONST.Line, new Point(x, 0), x, canvas.height));

            //Accross
            renderObjects.push(new Line(ID_CONST.Line, new Point(0, y), canvas.width, y));
        }
    
        this.setMap(renderObjects);

        return renderObjects;
    };

    return world;
});
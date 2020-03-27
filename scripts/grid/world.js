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

        const playerPos = world.gridToPos(3, 2);
        const player = new GridPlayer(playerPos.x, playerPos.y, squareX, squareY);
        renderObjects.push(player);

        //Enemy
        renderObjects.push(new Rectangle(ID_CONST.Enemy, '#FF0000', 1, 1, squareX, squareY)); //Enemy

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
        this.setPlayer(player);

        return renderObjects;
    };

    return world;
});
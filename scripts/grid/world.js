define(['../shared/renderer', '../shared/objects', '../shared/world', '../shared/canvas', './objects'], function() {

    const world = new World(1);

    //TODO: Move to board
    world.generateMap = function() {
        const renderObjects = [];
        const gridSize = 6;
        const squareSize = (canvas.width / gridSize) - (gridSize * 2)

        // const player = new Player(ID_CONST.Player, '', );
        // renderObjects.push(player);

        //Streets
        renderObjects.push(new Rectangle(ID_CONST.Enemy, '#FF0000', 1, 1, squareSize, squareSize)); //Enemy

        let x = 0;
        for(let i = 0; i < gridSize; i++){
            x = x + ((squareSize + 1) * i);
            let y = 0;
            //Down
            renderObjects.push(new Line(ID_CONST.Line, new Point(x, 0), x, canvas.height));
            
            y = y + ( (squareSize + 1) * i);
            //Accross
            renderObjects.push(new Line(ID_CONST.Line, new Point(0, y), canvas.width, y));
        }
    
        this.setMap(renderObjects);
        // this.setPlayer(player);

        return renderObjects;
    };

    return world;
});
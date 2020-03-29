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
            const pos = world.gridToPos(x, y);
            const card = new Card(color, pos.x, pos.y, squareX, squareY);
            renderObjects.push(card);
        }

        let colorList = undefined;

        const randomColor = function() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        const getColor = function() {
            const numColors = (gridSize * gridSize) / 2; 
            if (!colorList) {
                colorList = {};
                for (let i = 0; i < numColors; i++) {
                    let color = randomColor();
                    colorList[color] = 0;
                }
            }

            const colorsLeft = Object.keys(colorList).filter(c => colorList[c] < 2);
            const ranColor = colorsLeft[Math.floor(Math.random() * (colorsLeft.length))];
            colorList[ranColor] += 1;
            
            return ranColor;
        }

        
        for(let i = 0; i < gridSize; i++){
            for(let j = 0; j < gridSize; j++){
                addCard(getColor(), j, i);
            }
        }

        //grid
        for(let i = 0; i <= gridSize; i++){
            let x = squareX * i;
            let y = squareY * i;

            //Down
            // renderObjects.push(new Line(ID_CONST.Line, new Point(x, 0), x, canvas.height));

            // //Accross
            // renderObjects.push(new Line(ID_CONST.Line, new Point(0, y), canvas.width, y));
        }
    
        this.setMap(renderObjects);

        return renderObjects;
    };

    return world;
});
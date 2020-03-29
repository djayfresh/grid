var board = {
    size: 500,
    width: 500,
    grids: 6,
};

board.setup = function(map) {
    board.grid = [...map];
}

board.draw = function() {
    const rectSize = (board.size / board.grid.length) - 1;
    Debug.draw("Rect Size", rectSize, "Board:", board.grid.length, "size:", board.grids)
    let gridX = 0;
    let gridY = 0;

    //Left Edge
    ctx.moveTo(0, 0);
    ctx.lineTo(0, board.size);
    ctx.stroke();

    for(let i = 0; i < board.grid.length; i++){
        for(let j = 0; j < board.grid[i].length; j++){
            const space = board.grid[i][j];

            if (space !== ID_CONST.Grid){
                Debug.draw("Draw:", space, "at:", gridX * j, gridY * i, "color:", board.getColor(space))

                ctx.fillStyle = board.getColor(space);
                ctx.fillRect(gridX * j, gridY * i, rectSize, rectSize);
            }

            gridX = rectSize + 1;

            if (i == 0){
                ctx.strokeStyle = 'black';
                const lineX = gridX || rectSize + 1;
                ctx.moveTo(lineX * (j + 1), 0); //top
                ctx.lineTo(lineX * (j + 1), board.size); //bottom
                ctx.stroke()
            }
        }

        ctx.strokeStyle = 'black';
        const lineY = gridY || rectSize + 1;
        ctx.moveTo(0, lineY * i); //left
        ctx.lineTo(board.size, lineY * i); //right
        ctx.stroke()

        gridY = rectSize + 1;
        gridX = 0;
    }

    //Bottom Edge
    ctx.moveTo(0, board.size);
    ctx.lineTo(board.size, board.size);
    ctx.stroke();
}

board.getColor = function(id) {
    if (id === ID_CONST.Player) {
        return '#004600'
    }
    if (id === ID_CONST.Enemy){
        return '#820027'
    }
    if (id === ID_CONST.PowerUp){
        return '#005ac6'
    }
    if (id === ID_CONST.Flag){
        return '#c6b600'
    }
    if (id === ID_CONST.Wall){
        return '#441d00'
    }
    return '#FFFFFF'
}

board.getPos = function(id){
    for(let i = 0; i < board.grid.length; i++){ //Vertical (y)
        for(let j = 0; j < board.grid[i].length; j++){ //Horizontal (x)
            if (board.grid[i][j] === id){
                return { x: j, y: i };
            }
        }
    }
    return null;
}

//find a piece based on the canvas x/y
board.getId = function(x, y) {
    const pos = board.mouseToBoard(x, y);
    return board.grid[pos.y][pos.x];
}

board.mouseToBoard = function(x, y) {
    const rectSize = board.width / board.grids;
    const cellX = Math.floor(x / rectSize);
    const cellY = Math.floor(y / rectSize);
    return { x: cellX, y: cellY };
}

board.getMove = function(id, x, y) { //returns destinationInfo or false
    if (x === 0 && y === 0 ){
        return false;
    }

    const idPos = board.getPos(id);

    if (!!idPos){
        const gridY = idPos.y;
        const gridX = idPos.x;
        let destination = ID_CONST.Grid;

        if (x > 0){
            if ((gridX + x) >= board.grid[gridY].length){
                destination = -1; //right bounds
            }
        }
        else {
            if ((gridX + x) < 0){
                destination = -1; //left bounds
            }
        }

        if (y > 0){
            if ((gridY + y) >= board.grid.length){
                destination = -1; //bottom bounds
            }
        }
        else {
            if ((gridY + y) < 0){
                destination = -1; //top bounds
            }
        }

        if (destination === ID_CONST.Grid){ //wasn't out of bounds
            destination = board.grid[gridY+y][gridX+x];

            return { pos: idPos, destination: destination };
        }
        else {
            return false;
        }

    }

    return false;
}

board.move = function(id, x, y, movement){
    Debug.physics("Move:", id, "x:", x, "y:", y, "movement:", movement);

    board.grid[movement.pos.y][movement.pos.x] = ID_CONST.Grid;
    board.grid[movement.pos.y + y][movement.pos.x + x] = id;
}

board.resize = function() {
    board.size = canvas.width;
    board.width = canvas.clientWidth;
    canvas.height = canvas.width;
}

/* Board - Generation */

board.generateMap = function() {
    const map = [];
    
    for(let i = 0; i < board.grids; i++){
        map[i] = [];
        for(let j = 0; j < board.grids; j++){
            map[i][j] = ID_CONST.Grid;
        }
    }

    const insert = function(item, it) {
        it = it || 1;
        if (it > 4){
            Debug.generation("Unable to insert item", item);
            item.x = undefined;
            item.y = undefined;
            for(let i = 0; i < board.grids; i++){
                for(let j = 0; j < board.grids; j++){
                    if (map[i][j] === ID_CONST.Grid){
                        item.x = j;
                        item.y = i;
                    }
                }
            }

            if (item.x === undefined || item.y === undefined){
                Debug.generation("Blocking Item", item);
                return;
            }
        }
        item.x = item.x !== undefined ? item.x : range(0, board.grids);
        item.y = item.y !== undefined ? item.y : range(0, board.grids);

        if (map[item.y][item.x] !== ID_CONST.Grid) {
            Debug.generation("Collision:", item, map[item.y][item.x]);
            item.x = undefined;
            item.y = undefined;
            insert(item, ++it);
        }
        else {
            Debug.generation("Insert Item:", item);
            map[item.y][item.x] = item.id;
        }
    }

    //make a wall section
    if (board.grids >= 20){
        insert({ x: 0, y: 10, id: ID_CONST.Wall});
        insert({ x: 1, y: 10, id: ID_CONST.Wall});
        insert({ x: 2, y: 10, id: ID_CONST.Wall});
        insert({ x: 3, y: 10, id: ID_CONST.Wall});
        insert({ x: 4, y: 10, id: ID_CONST.Wall});
        insert({ x: 5, y: 10, id: ID_CONST.Wall});
        insert({ x: 5, y: 9, id: ID_CONST.Wall});
        insert({ x: 5, y: 8, id: ID_CONST.Wall});
        insert({ x: 5, y: 7, id: ID_CONST.Wall});
    }

    insert({ id: ID_CONST.Player }); // player randomly on the map
    insert({ id: ID_CONST.Flag }); // flag randomly on the map

    if (difficulty > 10 && Math.random() > 0.75){
        insert({ id: ID_CONST.PowerUp });
    }

    for (let i = 0; i < difficulty; i++) {
        insert({ id: ID_CONST.Enemy }); // enemy randomly on the map
    }

    return map;
}


define(function() {
    return board;
});
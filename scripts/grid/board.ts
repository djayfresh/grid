import { ID_CONST, Debug } from '../shared/utility';
import { Point, RenderObject, CanvasRender, IPoint } from '../shared/renderer';
import { GameCanvas } from '../shared/canvas';
import { Line } from '../shared/objects';
import { Colors } from '../shared/colors';

export class Board {
    squareSize: Point;
    gridSize: number;

    grid: ID_CONST[][] = [];

    constructor(gridSize: number) {

        this.gridSize = gridSize;
        const squareX = (GameCanvas.width / this.gridSize);
        const squareY = (GameCanvas.height / this.gridSize);

        this.squareSize = new Point(squareX, squareY);

        this.init();
    }

    init() {
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = ID_CONST.Tile;
            }
        }
    }

    getColorForId(id: ID_CONST) {
        if (id === ID_CONST.Player) {
            return Colors.Player;
        }
        else if (id === ID_CONST.Enemy) {
            return Colors.Enemy;
        }
        else if (id === ID_CONST.PowerUp) {
            return Colors.PowerUp;
        }
        else if (id === ID_CONST.Flag) {
            return Colors.Flag;
        }
        else if (id === ID_CONST.Wall) {
            return Colors.Wall;
        }
        return Colors.White;
    }

    posToBoard(pos: IPoint) {
        const cellX = Math.floor(pos.x / this.squareSize.x);
        const cellY = Math.floor(pos.y / this.squareSize.y);
        return { x: cellX, y: cellY };
    }

    boardToPos(x: number, y: number) {
        return new Point(x * this.squareSize.x, y * this.squareSize.y);
    }

    move(obj: RenderObject, x: number, y: number, movement: { pos: Point }) {
        Debug.physics("Move:", obj.id, "x:", x, "y:", y, "movement:", movement);

        this.grid[movement.pos.x][movement.pos.y] = ID_CONST.Tile;
        this.grid[movement.pos.x + x][movement.pos.y + y] = obj.id;
        obj.pos = this.boardToPos(movement.pos.x + x, movement.pos.y + y)
    }

    getMove(pos: Point, x: number, y: number) {
        if (x === 0 && y === 0) {
            return false;
        }

        const idPos = pos;

        if (!!idPos) {
            const gridY = idPos.y;
            const gridX = idPos.x;
            let destination = ID_CONST.Tile;

            if (x > 0) {
                if ((gridX + x) >= this.gridSize) {
                    destination = -1; //right bounds
                }
            }
            else {
                if ((gridX + x) < 0) {
                    destination = -1; //left bounds
                }
            }

            if (y > 0) {
                if ((gridY + y) >= this.gridSize) {
                    destination = -1; //bottom bounds
                }
            }
            else {
                if ((gridY + y) < 0) {
                    destination = -1; //top bounds
                }
            }

            if (destination === ID_CONST.Tile) { //wasn't out of bounds
                destination = this.grid[gridX + x][gridY + y];

                return { pos: idPos, destination: destination };
            }
            else {
                return false;
            }

        }

        return false;
    }

    insert(map: ID_CONST[][], item: { x?: number, y?: number, id: ID_CONST }, it: number = 1) {
        if (it > 4) {
            Debug.generation("Unable to insert item", item);
            item.x = undefined;
            item.y = undefined;
            for (let i = 0; i < map.length; i++) {
                for (let j = 0; j < map[i].length; j++) {
                    if (map[i][j] === ID_CONST.Tile) {
                        item.x = i;
                        item.y = j;
                    }
                }
            }

            if (item.x === undefined || item.y === undefined) {
                Debug.generation("Blocking Item", item);
                return;
            }
        }

        item.x = item.x !== undefined ? item.x : Math.range(0, this.gridSize);
        item.y = item.y !== undefined ? item.y : Math.range(0, this.gridSize);

        if (map[item.x][item.y] !== ID_CONST.Tile) {
            Debug.generation("Collision:", item, map[item.x][item.y]);
            item.x = undefined;
            item.y = undefined;
            this.insert(map, item, ++it);
        }
        else {
            Debug.generation("Insert Item:", item);
            map[item.x][item.y] = item.id;
        }
    }

    generateMap(generationFunction: (map: ID_CONST[][]) => void): ID_CONST[][] {
        const map: ID_CONST[][] = [];
        
        for (let i = 0; i < this.gridSize; i++) {
            map[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                map[i][j] = ID_CONST.Tile;
            }
        }

        generationFunction(map);

        this.grid = map;
        return map;
    }

    valid(id: ID_CONST, toId: ID_CONST, validSpaces: ID_CONST[]){
        const validBoard = {};
        const visitedSpaces = {};
        let start: IPoint;

        for(let x = 0; x < this.gridSize; x++){
            for(let y = 0; y < this.gridSize; y++) {
                const tile = this.grid[x][y];

                if(tile === id){
                    start = {x, y};
                }

                if (validSpaces.indexOf(tile) >= 0) {
                    if(!validBoard[x]){
                        validBoard[x] = {};
                    }
                    validBoard[x][y] = tile;
                }
            }
        }

        return this._getNextDirection(start, validBoard, visitedSpaces, toId);
    }

    _getNextDirection(current: IPoint, validSpaces: {}, visitedSpaces: {}, destinationId: ID_CONST): boolean {
        if (validSpaces[current.x][current.y] === destinationId){
            return true;
        }

        if (!visitedSpaces[current.x]){
            visitedSpaces[current.x] = {};
        }

        if (visitedSpaces[current.x][current.y]){
            return false;
        }

        visitedSpaces[current.x][current.y] = true;
        
        const center = validSpaces[current.x];
        if(center){
            if (center[current.y + 1]) {
                const valid = this._getNextDirection({ x: current.x, y: current.y + 1 }, validSpaces, visitedSpaces, destinationId);
                if (valid){
                    return true;
                }
            }
            if (center[current.y - 1]) {
                const valid = this._getNextDirection({ x: current.x, y: current.y - 1 }, validSpaces, visitedSpaces, destinationId);
                if (valid){
                    return true;
                }
            }
        }

        const right = validSpaces[current.x + 1];
        if(right){
            if (right[current.y]) {
                const valid = this._getNextDirection({ x: current.x + 1, y: current.y }, validSpaces, visitedSpaces, destinationId);
                if (valid){
                    return true;
                }
            }
            if (right[current.y + 1]) {
                const valid = this._getNextDirection({ x: current.x + 1, y: current.y + 1 }, validSpaces, visitedSpaces, destinationId);
                if (valid){
                    return true;
                }
            }
            if (right[current.y - 1]) {
                const valid = this._getNextDirection({ x: current.x + 1, y: current.y - 1 }, validSpaces, visitedSpaces, destinationId);
                if (valid){
                    return true;
                }
            }
        }

        const left = validSpaces[current.x - 1];
        if(left){
            if (left[current.y]) {
                const valid = this._getNextDirection({ x: current.x - 1, y: current.y }, validSpaces, visitedSpaces, destinationId);
                if (valid){
                    return true;
                }
            }
            if (left[current.y + 1]) {
                const valid = this._getNextDirection({ x: current.x - 1, y: current.y + 1 }, validSpaces, visitedSpaces, destinationId);
                if (valid){
                    return true;
                }
            }
            if (left[current.y - 1]) {
                const valid = this._getNextDirection({ x: current.x - 1, y: current.y - 1 }, validSpaces, visitedSpaces, destinationId);
                if (valid){
                    return true;
                }
            }
        }
        return false;
    }

    createGrid() {
        //Since lines and text are expensive to re-draw
        //create a hidden canvas to render the lines onto
        const m_canvas = GameCanvas.createCanvas(GameCanvas.width, GameCanvas.height);

        //grid
        for(let i = 0; i <= this.gridSize; i++){
            let x = this.squareSize.x * i;
            let y = this.squareSize.y * i;

            //Down
            const down = new Line(ID_CONST.Grid, new Point(x, 0), new Point(x, GameCanvas.height));
            down.setContext(m_canvas);

            //Accross
            const accross = new Line(ID_CONST.Grid, new Point(0, y), new Point(GameCanvas.width, y));
            accross.setContext(m_canvas);
        }

        return new CanvasRender(ID_CONST.Grid, m_canvas);
    }
}
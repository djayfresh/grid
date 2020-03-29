import { World } from '../shared/world';
import { Point } from '../shared/renderer';
import { Rectangle, Line } from '../shared/objects';
import { canvas } from '../shared/canvas';
import { ID_CONST } from '../shared/utility';
import { GridPlayer } from './objects';

export class GridWorld extends World {
    squareSize: Point;
    gridSize: number;

    constructor() {
        super(1);

        this.gridSize = 6;
        const squareX = (canvas.width / this.gridSize);
        const squareY = (canvas.height / this.gridSize);

        this.squareSize = new Point(squareX, squareY);
    }

    gridToPos(x: number, y: number) {
        return new Point(x * this.squareSize.x, y * this.squareSize.y);
    }

    generateMap() {
        const renderObjects = [];

        const playerPos = this.gridToPos(3, 2);
        const player = new GridPlayer(playerPos.x, playerPos.y, this.squareSize.x, this.squareSize.y);
        renderObjects.push(player);

        //Enemy
        renderObjects.push(new Rectangle(ID_CONST.Enemy, '#FF0000', 1, 1, this.squareSize.x, this.squareSize.y)); //Enemy

        //grid
        for(let i = 0; i <= this.gridSize; i++){
            let x = this.squareSize.x * i;
            let y = this.squareSize.y * i;

            //Down
            renderObjects.push(new Line(ID_CONST.Grid, new Point(x, 0), new Point(x, canvas.height)));

            //Accross
            renderObjects.push(new Line(ID_CONST.Grid, new Point(0, y), new Point(canvas.width, y)));
        }

        this.setMap(renderObjects);
        this.setPlayer(player);

        return renderObjects;
    }
};

export var world = new GridWorld();
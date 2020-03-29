import { World } from '../shared/world';
import { Point, PreRender } from '../shared/renderer';
import { Rectangle, Line } from '../shared/objects';
import { canvas } from '../shared/canvas';
import { ID_CONST } from '../shared/utility';
import { GridPlayer } from './objects';

export class GridWorld extends World {
    squareSize: Point;
    gridSize: number;

    constructor(gridSize: number) {
        super(1);

        this.gridSize = gridSize;
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

        //Since lines and text are expensive to re-draw
        //create a hidden canvas to render the lines onto
        var m_canvas = document.createElement('canvas');
        m_canvas.width = canvas.width;
        m_canvas.height = canvas.height;

        const preRender = new PreRender(ID_CONST.Grid, m_canvas);
        renderObjects.push(preRender);
        
        //grid
        for(let i = 0; i <= this.gridSize; i++){
            let x = this.squareSize.x * i;
            let y = this.squareSize.y * i;

            //Down
            const down = new Line(ID_CONST.Grid, new Point(x, 0), new Point(x, canvas.height));
            down.setContext(m_canvas);

            //Accross
            const accross = new Line(ID_CONST.Grid, new Point(0, y), new Point(canvas.width, y));
            accross.setContext(m_canvas);
        }

        this.setMap(renderObjects);
        this.setPlayer(player);

        return renderObjects;
    }
};

export var world = new GridWorld(6);
import { GridWorld } from '../grid/world';
import { canvas } from '../shared/canvas';
import { ID_CONST } from '../shared/utility';
import { PreRender, Point, RenderObject } from '../shared/renderer';
import { Line } from '../shared/objects';
import { Card } from './objects';

export class MemoryWorld extends GridWorld {

    generateMap(): RenderObject[] {
        const renderObjects: RenderObject[] = [];

        const addCard = (color: string, x: number, y: number) => {
            const pos = world.gridToPos(x, y);
            const card = new Card(color, pos.x, pos.y, this.squareSize.x, this.squareSize.y);
            renderObjects.push(card);
        }

        let colorList: {[color: string]: number};

        const randomColor = () => {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        const getColor = () => {
            if (!colorList) {
                colorList = {};
                const numColors = (this.gridSize * this.gridSize) / 2; 
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

        
        for(let i = 0; i < this.gridSize; i++){
            for(let j = 0; j < this.gridSize; j++){
                addCard(getColor(), j, i);
            }
        }

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
            // renderObjects.push(down);

            //Accross
            const accross = new Line(ID_CONST.Grid, new Point(0, y), new Point(canvas.width, y));
            accross.setContext(m_canvas);
            // renderObjects.push(accross);
        }
    
        this.setMap(renderObjects);

        return renderObjects;
    }
}

export var world = new MemoryWorld(6);
import { GridWorld } from '../grid/world';
import { RenderObject } from '../shared/renderer';
import { Card } from './objects';
import { Color } from '../shared/colors';

export class MemoryWorld extends GridWorld {

    generateMap(): RenderObject[] {
        const renderObjects: RenderObject[] = [];

        const addCard = (color: string, x: number, y: number) => {
            const pos = this.board.boardToPos(x, y);
            const card = new Card(color, pos.x, pos.y, this.board.squareSize.x, this.board.squareSize.y);
            renderObjects.push(card);
        }

        let colorList: {[color: string]: number};

        const getColor = () => {
            if (!colorList) {
                colorList = {};
                const numColors = (this.board.gridSize * this.board.gridSize) / 2; 
                for (let i = 0; i < numColors; i++) {
                    let color = Color.randomColor();
                    colorList[color] = 0;
                }
            }

            const colorsLeft = Object.keys(colorList).filter(c => colorList[c] < 2);
            const ranColor = colorsLeft[Math.floor(Math.random() * (colorsLeft.length))];
            colorList[ranColor] += 1;
            
            return ranColor;
        }

        for(let i = 0; i < this.board.gridSize; i++){
            for(let j = 0; j < this.board.gridSize; j++){
                addCard(getColor(), j, i);
            }
        }

        renderObjects.push(this.board.createGrid());
    
        this.setMap(renderObjects);

        return renderObjects;
    }
}

export var world = new MemoryWorld(6, 0);
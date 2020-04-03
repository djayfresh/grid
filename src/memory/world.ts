import { GridWorld } from '../grid/world';
import { RenderObject } from '../shared/objects';
import { Card } from './objects';
import { Color } from '../shared/colors';
import { Board } from '../grid/board';

export class MemoryWorld extends GridWorld {

    generateMap(): RenderObject[] {
        this.board = new Board(this.gridSize);
        const renderObjects: RenderObject[] = [];

        const addCard = (color: string, x: number, y: number) => {
            const pos = this.board.boardToPos(x, y);
            const card = new Card(color, pos, this.board.squareSize);
            renderObjects.push(card);
        }

        let colorList: {[color: string]: number};

        const getColor = () => {
            if (!colorList) {
                colorList = {};
                const numColors = (this.gridSize * this.gridSize) / 2; 
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

        for(let i = 0; i < this.gridSize; i++){
            for(let j = 0; j < this.gridSize; j++){
                addCard(getColor(), j, i);
            }
        }
        
        renderObjects.push(this.board.createGrid());

        // const imageTest = new ImageWorld(0);

        // renderObjects.push(...imageTest.generateMap());
    
        this.setMap(renderObjects);

        return renderObjects;
    }
}
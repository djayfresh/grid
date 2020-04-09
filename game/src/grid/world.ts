import { World } from '../shared/world';
import { Rectangle } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { GridPlayer } from './objects';
import { Board } from './board';

export class GridWorld extends World {
    board: Board;
    difficulty: number;
    gridSize: number;

    constructor(id: number, gridSize: number, difficulty: number) {
        super(id);

        this.gridSize = gridSize;
        this.difficulty = difficulty;
    }

    generateMap() {
        const renderObjects = [];
        this.board = new Board(this.gridSize);

        renderObjects.push(this.board.createGrid());
        let map: ID_CONST[][];
        let i = 1;
        const failThreshold = 15;
        do {
            map = this.board.generateMap((map) => {
                
                this.board.insert(map, { id: ID_CONST.Player }); // player randomly on the map
                this.board.insert(map, { id: ID_CONST.Flag }); // flag randomly on the map

                if (this.difficulty > 10 && Math.random() > 0.75) {
                    this.board.insert(map, { id: ID_CONST.PowerUp });
                }

                for (let i = 0; i < this.difficulty; i++) {
                    this.board.insert(map, { id: ID_CONST.Enemy }); // enemy randomly on the map
                }
            });
        }while(!this.board.valid(ID_CONST.Player, ID_CONST.Flag, [ID_CONST.Player, ID_CONST.Flag, ID_CONST.Tile, ID_CONST.PowerUp]) && i++ < failThreshold);

        if (i > failThreshold){
            console.log("Unable to generated");
        }

        for (let x = 0; x < map.length; x++) {
            for (let y = 0; y < map.length; y++) {
                const id = map[x][y];
                if (id === ID_CONST.Player){
                    const playerPos = this.board.boardToPos(x, y);
                    const player = new GridPlayer(playerPos, this.board.squareSize);
                    renderObjects.push(player);
                    this.setPlayer(player);
                }
                else if (id === ID_CONST.Enemy) {
                    const pos = this.board.boardToPos(x, y);
                    renderObjects.push(new Rectangle(ID_CONST.Enemy, this.board.getColorForId(ID_CONST.Enemy), pos, this.board.squareSize));
                }
                else if (id === ID_CONST.Flag) {
                    const pos = this.board.boardToPos(x, y);
                    renderObjects.push(new Rectangle(ID_CONST.Flag, this.board.getColorForId(ID_CONST.Flag), pos, this.board.squareSize));
                }
                else if (id === ID_CONST.PowerUp) {
                    const pos = this.board.boardToPos(x, y);
                    renderObjects.push(new Rectangle(ID_CONST.PowerUp, this.board.getColorForId(ID_CONST.PowerUp), pos, this.board.squareSize));
                }
                else if (id === ID_CONST.Wall) {
                    const pos = this.board.boardToPos(x, y);
                    renderObjects.push(new Rectangle(ID_CONST.Wall, this.board.getColorForId(ID_CONST.Wall), pos, this.board.squareSize));
                }
            }
        }
        this.setMap(renderObjects);

        return renderObjects;
    }
};
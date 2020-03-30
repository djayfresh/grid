import { World } from '../shared/world';
import { Rectangle, RenderText } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { GridPlayer } from './objects';
import { Board } from './board';
import { RenderObject, Point } from '../shared/renderer';
import { GameCanvas } from '../shared/canvas';
import { Colors } from '../shared/colors';
import { LevelConst } from '../lobby/lobby';

export class GridWorld extends World {
    board: Board;
    difficulty: number;
    gridSize: number;

    constructor(gridSize: number, difficulty: number) {
        super(LevelConst.Grid);

        this.gridSize = gridSize;
        this.difficulty = difficulty;
    }

    generateMap() {
        const renderObjects = [];
        this.board = new Board(this.gridSize);

        renderObjects.push(this.board.createGrid());
        
        const map = this.board.generateMap((map) => {
            
            this.board.insert(map, { id: ID_CONST.Player }); // player randomly on the map
            this.board.insert(map, { id: ID_CONST.Flag }); // flag randomly on the map

            if (this.difficulty > 10 && Math.random() > 0.75) {
                this.board.insert(map, { id: ID_CONST.PowerUp });
            }

            for (let i = 0; i < this.difficulty; i++) {
                this.board.insert(map, { id: ID_CONST.Enemy }); // enemy randomly on the map
            }
        });

        const squareX = this.board.squareSize.x;
        const squareY = this.board.squareSize.y;
        
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map.length; j++) {
                const id = map[i][j];
                if (id === ID_CONST.Player){
                    const playerPos = this.board.boardToPos(i, j);
                    const player = new GridPlayer(playerPos.x, playerPos.y, squareX, squareY);
                    renderObjects.push(player);
                    this.setPlayer(player);
                }
                else if (id === ID_CONST.Enemy) {
                    const pos = this.board.boardToPos(i, j);
                    renderObjects.push(new Rectangle(ID_CONST.Enemy, this.board.getColorForId(ID_CONST.Enemy), pos.x, pos.y, squareX, squareY));
                }
                else if (id === ID_CONST.Flag) {
                    const pos = this.board.boardToPos(i, j);
                    renderObjects.push(new Rectangle(ID_CONST.Flag, this.board.getColorForId(ID_CONST.Flag), pos.x, pos.y, squareX, squareY));
                }
                else if (id === ID_CONST.PowerUp) {
                    const pos = this.board.boardToPos(i, j);
                    renderObjects.push(new Rectangle(ID_CONST.PowerUp, this.board.getColorForId(ID_CONST.PowerUp), pos.x, pos.y, squareX, squareY));
                }
                else if (id === ID_CONST.Wall) {
                    const pos = this.board.boardToPos(i, j);
                    renderObjects.push(new Rectangle(ID_CONST.Wall, this.board.getColorForId(ID_CONST.Wall), pos.x, pos.y, squareX, squareY));
                }
            }
        }
        this.setMap(renderObjects);

        return renderObjects;
    }

    getRoundStart(roundNumber: number, score?: number): RenderObject[] {
        const renderObjects = [];

        renderObjects.push(new Rectangle(0, Colors.White, 0, 0, GameCanvas.width, GameCanvas.height));
        renderObjects.push(new RenderText(1, { text: `Round Starting - ${roundNumber}`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, GameCanvas.height/3) }));
        
        if (score !== undefined){
            renderObjects.push(new RenderText(1, { text: `Score: ${score}`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, GameCanvas.height/2) }));
        }
        
        return renderObjects;
    }

    getGameOver(score: number){
        const renderObjects = [];
        
        renderObjects.push(new Rectangle(0, Colors.White, 0, 0, GameCanvas.width, GameCanvas.height));
        renderObjects.push(new RenderText(1, { text: `Game Over`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, GameCanvas.height/3) }));
        renderObjects.push(new RenderText(1, { text: `Score: ${score}`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, GameCanvas.height/2) }));
        
        return renderObjects;
    }
};

export var world = new GridWorld(6, 1);
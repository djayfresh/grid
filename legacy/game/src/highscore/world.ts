import { World } from '../shared/world';
import { Rectangle, RenderText } from '../shared/objects';
import { Colors } from '../shared/colors';
import { GameCanvas } from '../shared/canvas';
import { Point } from '../shared/physics';
import { Levels, LevelConst } from '../lobby/levels';
import { HighScoreService } from '../services/highscore.service';
import { HighScoreManager } from './manager';

export class HighScoreWorld extends World {
    
    generateMap() {
        const renderObjects = [];
            
        renderObjects.push(new Rectangle(0, Colors.White, {x: 0, y: 0}, {x: GameCanvas.width, y: GameCanvas.height}));
        renderObjects.push(new RenderText(1, { text: `High Scores`, size: '20px', color: Colors.Black, pos: new Point(GameCanvas.width/2, 30)}));

        const scores = Levels.filter(l => l != LevelConst.HighScore).map(l => {return {players: HighScoreService.list[l] || {}, gameId: LevelConst[l]};});
        
        console.log("Load scores", scores);
        let offset = 60;
        let horizontalOffset = (GameCanvas.width - 30) / 3;
        scores.forEach((score, index) => {
            const titlePos = new Point((horizontalOffset * index) + 25, 60);

            renderObjects.push(new RenderText(1, { text: `${score.gameId}:`, size: '16px', color: Colors.Black, alignment: 'left', pos: titlePos}));
            
            HighScoreManager.sortPlayers(score.players, LevelConst[score.gameId]).forEach((player, playerIndex) => {
                const scorePos = new Point((horizontalOffset * index) + 30, offset + (15 * (playerIndex + 1)));

                renderObjects.push(new RenderText(1, { text: `${player}: ${score.players[player]}`, size: '14px', color: Colors.Black, alignment: 'left', pos: scorePos}));
            });
        });

        this.setMap(renderObjects);
    }
}
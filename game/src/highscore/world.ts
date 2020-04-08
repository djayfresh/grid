import { World } from '../shared/world';
import { Rectangle, RenderText } from '../shared/objects';
import { Colors } from '../shared/colors';
import { GameCanvas } from '../shared/canvas';
import { Point } from '../shared/physics';
import { Levels, LevelConst } from '../lobby/levels';
import { IHighScore } from './manager';
import { HighScoreService } from '../services/highscore.service';

export class HighScoreWorld extends World {
    
    generateMap() {
        const renderObjects = [];
            
        renderObjects.push(new Rectangle(0, Colors.White, {x: 0, y: 0}, {x: GameCanvas.width, y: GameCanvas.height}));
        renderObjects.push(new RenderText(1, { text: `High Scores`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, 30)}));

        const scores = Levels.filter(l => l != LevelConst.HighScore).map(l => {return {players: HighScoreService.list[l] || {}, gameId: LevelConst[l]};});
        
        console.log("Load scores", scores);
        let offset = 60;
        scores.forEach((score) => {
            const players = Object.keys(score.players);
            renderObjects.push(new RenderText(1, { text: `${score.gameId}:`, color: Colors.Black, centered: false, pos: new Point(60, offset)}));
            
            players.forEach((player, playerIndex) => {
                renderObjects.push(new RenderText(1, { text: `${player}: ${score.players[player]}`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, offset + (30 * (playerIndex + 1)))}));
            });
            offset += 40 + (players.length * 30);
        });

        this.setMap(renderObjects);
    }
}
import { LevelConst } from '../lobby/levels';

import { IHighScore } from '../../../models/high-score.model';
export { IHighScore };

export class HighScoreManager {
    private static HIGH_SCORE_KEY = 'Grid-High-Score';
    private static PLAYER_NAME = 'Grid-Last-Player-Name';
    private static HighScoreGames = [LevelConst.Memory, LevelConst.Zombie];

    static getLastPlayerName() {
        return localStorage.getItem(HighScoreManager.PLAYER_NAME) || '';
    }

    static setLastPlayerName(value: string) {
        localStorage.setItem(HighScoreManager.PLAYER_NAME, value);
    }

    // static save(values: IHighScore) {
    //     localStorage.setItem(HighScoreManager.HIGH_SCORE_KEY, JSON.stringify(Object.assign(HighScoreManager.load(), values)));
    // }

    // static clear() {
    //     localStorage.setItem(HighScoreManager.HIGH_SCORE_KEY, '');
    // }

    static load(): IHighScore {
        return HighScoreManager.getScores();
    }

    static add(gameId: number, player: string, score: number) {
        const highScores = HighScoreManager.getScores();

        HighScoreManager.setScore(highScores, gameId, player, score);

        localStorage.setItem(HighScoreManager.HIGH_SCORE_KEY, JSON.stringify(highScores));
    }
    
    static setScore(list: IHighScore, gameId: number, player: string, score: number){
        if (!list[gameId]){
            list[gameId] = { [player]: score };
        }

        if (!list[gameId][player]) {
            list[gameId][player] = score;
        }
        else {
            const playerScore = list[gameId][player];
            if (HighScoreManager.HighScoreGames.indexOf(gameId) >= 0) {
                if (playerScore < score){
                    list[gameId][player] = score;
                }
            }
            else {
                if (playerScore > score){
                    list[gameId][player] = score;
                }
            }
        }
    }

    static sortPlayers(players: {[player: string]: number}, gameId: number) {
        const playerNames = Object.keys(players);

        return playerNames.sort((p1, p2) => {
            if (HighScoreManager.HighScoreGames.indexOf(gameId) >= 0)
                return players[p2] - players[p1];
            return players[p1] - players[p2];
        });
    }


    static loadForGame(gameId: number): {[playerId: string]: number}{
        const highScores = HighScoreManager.getScores();
        return highScores[gameId];
    }

    static loadForPlayer(player: string): {[gameId: number]: string} {
        const highScores = HighScoreManager.getScores();
        const gameIds = Object.keys(highScores);
        return gameIds.reduce((pv, _cv, index) => {
            const id = gameIds[index];
            pv[id] = highScores[id][player] || 'N/A';
            return pv;
        }, {})
    }

    private static getScores(): IHighScore {
        return JSON.parse(localStorage.getItem(HighScoreManager.HIGH_SCORE_KEY) || '{}');
    }
}
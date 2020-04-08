interface IHighScore {
    [gameId: string]: {[player: string]: number}
}

export class HighScoreManager {
    private static HIGH_SCORE_KEY = 'Grid-High-Score';
    private static PLAYER_NAME = 'Grid-Last-Player-Name';

    static getLastPlayerName() {
        return localStorage.getItem(HighScoreManager.PLAYER_NAME) || '';
    }

    static setLastPlayerName(value: string) {
        localStorage.setItem(HighScoreManager.PLAYER_NAME, value);
    }

    static save(values: IHighScore) {
        localStorage.setItem(HighScoreManager.HIGH_SCORE_KEY, JSON.stringify(Object.assign(HighScoreManager.load(), values)));
    }

    static clear() {
        localStorage.setItem(HighScoreManager.HIGH_SCORE_KEY, '');
    }

    static load(): IHighScore {
        return HighScoreManager.getScores();
    }

    static add(gameId: number, player: string, score: number, highScoreIsBest: boolean) {
        const highScores = HighScoreManager.getScores();

        if (!highScores[gameId]){
            highScores[gameId] = { [player]: score };
        }

        if (!highScores[gameId][player]) {
            highScores[gameId][player] = score;
        }
        else {
            const playerScore = highScores[gameId][player];
            if (highScoreIsBest) {
                if (playerScore < score){
                    highScores[gameId][player] = score;
                }
            }
            else {
                if (playerScore > score){
                    highScores[gameId][player] = score;
                }
            }
        }

        localStorage.setItem(HighScoreManager.HIGH_SCORE_KEY, JSON.stringify(highScores));
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
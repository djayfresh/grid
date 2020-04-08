import { IHighScore, HighScoreManager } from '../highscore/manager';
import { ajax } from 'rxjs/ajax'
import { tap, map } from 'rxjs/operators';
import { Observable, concat } from 'rxjs';

export class HighScoreService {
    static list: IHighScore;

    static getList(): Observable<IHighScore> {
        const request = ajax({
            url: 'http://localhost:3000/api/high-score/list',
            method: 'GET',
        });

        return request.pipe(tap(res => {
            this.list = this.mergeWithLocal(res.response);
        }), map(res => res.response as IHighScore));
    }

    private static mergeWithLocal(list: IHighScore){
        const local = HighScoreManager.load();
        const newList: IHighScore = {};

        Object.keys(local).forEach(gameId => {
            Object.keys(local[gameId]).forEach(playerId => {
                HighScoreManager.setScore(newList, Number.parseInt(gameId), playerId, local[gameId][playerId])
            });
        });

        Object.keys(list).forEach(gameId => {
            Object.keys(list[gameId]).forEach(playerId => {
                HighScoreManager.setScore(newList, Number.parseInt(gameId), playerId, list[gameId][playerId])
            });
        });
        return newList;
    }

    // private static getLocalSave() {
    //     const local = HighScoreManager.load();

    //     const newList: IHighScore = {};

    //     Object.keys(this.list).forEach(gameId => {
    //         Object.keys(this.list[gameId]).forEach(playerId => {
    //             if (local[gameId] && local[gameId][playerId]) {
    //                 HighScoreManager.setScore(newList, Number.parseInt(gameId), playerId, this.list[gameId][playerId])
    //             }
    //         });
    //     });

    //     return newList;
    // }

    static save() {
        const request = ajax({
            url: 'http://localhost:3000/api/high-score/save',
            method: 'POST',
            headers: {
                /*some headers*/
                'Content-Type': 'application/json'
            },
            body: {
                ...this.list
            }
        });

        return concat(
            this.getList(),
            request
        );
    }

    static load() {
        HighScoreService.save().subscribe();
    }
}
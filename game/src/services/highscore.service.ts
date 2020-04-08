import { fromEvent } from 'rxjs';
import { HighScoreManager } from '../highscore/manager';
import { ajax } from 'rxjs/ajax'
import { tap } from 'rxjs/operators';

export class HighScoreService {

    getList() {
        const request = ajax({
            url: 'http://localhost:3000/api/high-score/list',
            method: 'GET',
        });

        return request.pipe(tap(res => {
            HighScoreManager.save(res.response);
        }));
    }

    save() {
        const request = ajax({
            url: 'http://localhost:3000/api/high-score/save',
            method: 'POST',
            headers: {
                /*some headers*/
                'Content-Type': 'application/json'
            },
            body: {
                ...HighScoreManager.load()
            }
        });

        HighScoreManager.clear();

        return request;
    }
}
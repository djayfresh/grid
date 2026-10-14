import { Response, Request } from 'express';
import { Get, Post } from '../utility/decorators';
import { BaseController } from './base.controller';
import * as fs from 'fs';

export class HighScoreController extends BaseController {
    @Get('list')
    list(_req: Request, res: Response) {
        this.loadFile((data) => {
            res.json(data);
        })
    }

    @Post('save')
    save(req: Request, res: Response) {
        console.log("save", req.body);

        this.saveFile(req.body, () => {
            res.sendStatus(200);
        });
    }

    private loadFile(onLoad: (file: any) => void) {
        fs.readFile('./high-score.json', 'utf8', (e, data) => {
            if (e) {
                console.log('error', e);
            }

            onLoad(JSON.parse(data || '{}'));
        });
    }

    private saveFile(data: any, onSave: () => void){
        this.loadFile((content) => {
            fs.writeFile('./high-score.json', JSON.stringify(Object.assign(content || {}, data)), () => {
                onSave();
            });
        });
    }
}
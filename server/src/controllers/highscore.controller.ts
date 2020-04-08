import { Response, Request } from 'express';
import { Get, Post } from '../utility/decorators';
import { BaseController } from './base.controller';

export class HighScoreController extends BaseController {
    highScores: any = {};

    @Get('list')
    list(_req: Request, res: Response){
        res.json(this.highScores);
    }

    @Post('save')
    save(req: Request, res: Response){
        console.log("save", req.body);

        Object.assign(this.highScores, req.body);

        res.sendStatus(200);
    }
}
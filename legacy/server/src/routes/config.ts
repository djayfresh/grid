import * as express from 'express';
import { HighScoreController } from '../controllers/highscore.controller';

export class RouteConfig {
    static router = express.Router();

    static routes(): express.Router {
        const router = RouteConfig.router;
        
        const controllers = [
            new HighScoreController('high-score')
        ];

        controllers.forEach(c => {
            c.loadRoutes();
        });

        return router;
    }
}
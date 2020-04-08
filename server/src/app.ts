import * as express from 'express';
import * as cors from 'cors';
import { RouteConfig } from './routes/config';
import bodyParser = require('body-parser');

class App {
    public express: express.Express;

    constructor() {
        this.express = express();
        this.mountRoutes();
    }

    private mountRoutes(): void {
        const whitelist = ['http://localhost:4000', 'http://djayfresh.com', 'null'];

        const corsOptions = {
            origin: function (origin, callback) {
                if (whitelist.indexOf(origin) !== -1 || !origin || origin === null) {
                    callback(null, true);
                } else {
                    callback(new Error(`Not allowed by CORS: ${origin}`));
                }
            }
        }

        this.express.use(cors(corsOptions));

        this.express.use(bodyParser.json());
        this.express.use('/api/', RouteConfig.routes());
    }
}

export default new App().express;
import * as express from 'express';
import * as cors from 'cors';
import * as http from 'http';
import * as io from 'socket.io';
import { RouteConfig } from './routes/config';
import bodyParser = require('body-parser');

class App {
    public express: express.Express;
    public server: http.Server;

    constructor() {
        this.express = express();
        this.server = http.createServer(this.express);

        this.mountRoutes();
        this.initSockets();
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

    private initSockets(): void {
        const socketIO = io(this.server);

        socketIO.on('connection', socket => {
            console.log("Connected", socket.id);

            socket.on('disconnect', () => {
                console.log("Disconnected", socket.id);
            });

            socket.on('high-score', (msg) => {
                console.log("High Score", socket.id, "msg:", msg);
            });
        });
    }
}

export default new App().server;
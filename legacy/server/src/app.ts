import express from 'express';
import cors from 'cors';
import * as http from 'http';
import { Server } from 'socket.io';
import { RouteConfig } from './routes/config';

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

        this.express.use(express.json());
        this.express.use('/api/', RouteConfig.routes());
    }

    private initSockets(): void {
        const socketIO = new Server(this.server, { path: '/io' });

        console.log("Setup sockets on path /io")

        socketIO.on('connection', socket => {
            console.log("Connected", socket.id);

            socket.emit('welcome', 'Welcome to the server');

            socket.on('disconnect', () => {
                console.log("Disconnected", socket.id);
            });

            socket.on('high-score', (msg) => {
                console.log("High Score", socket.id, "msg:", msg);
            });

            socket.on('event', (event) => {
                console.log("event", event);
                console.log("echo");
                socket.emit(event.data);
            });
        });
    }
}

export default new App().server;
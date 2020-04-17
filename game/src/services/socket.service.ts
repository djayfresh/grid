import { HighScoreManager } from '../highscore/manager';
import { GameEventQueue, BaseEvent } from '../shared/event-queue';
import { SocketDataEvent } from '../shared/events';
import * as io from 'socket.io-client';

export class SocketService {
    public static baseUrl: string = 'http://localhost:3000/';
    public socket: any; //

    constructor() {
        GameEventQueue.subscribe(SocketDataEvent, 'service-io', event => {
            this.emit('event', event);
        });

        this.socket = io(SocketService.baseUrl, { path: '/io', autoConnect: false });

        this.on('connect', () => {
            console.log("connected to socket", this.socket.id);

            this.emit('high-score', HighScoreManager.load());
        });
        
        this.on('event', (data: BaseEvent<any>) => {
            console.log("On event", data);
            GameEventQueue.notify(data);
        });

        this.on('welcome', (data) => {
            console.log("Welcome", data);
        });

        this.on('disconnect', () => {
            console.log("socket disconnected");
        });
    }

    public on(eventName: string, callback: Function){
        return this.socket.on(eventName, callback);
    }

    public emit(eventName: string, ...args: any[]) {
        return this.socket.emit(eventName, ...args);
    }

    public open() {
        if (!this.socket.connected){
            this.socket.open();
        }
    }

    public notify(event: BaseEvent<any>){
        GameEventQueue.notify(new SocketDataEvent(event));
    }
}

export const socketService = new SocketService();
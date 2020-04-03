export function GameEvent(name: string) {
    return function (target: any) {
        target.eventName = name;
    };
}

export function SocketEvent(name: string) {
    return function (target: any) {
        target.eventName = name;
        target.isSocketEvent = true;
    };
}

export class BaseEvent<T> {
    static eventName: string;
    static isSocketEvent: boolean;

    eventName: string;
    isSocketEvent: boolean;
    data: T;
    
    date: number;
    senderId: string;
    created: number;
    platformId?: number;
    
    constructor(data: T, date: number = null) {
        this.data = data;
        this.date = date !== null ? date : Date.now();
        this.eventName = (<typeof BaseEvent> this.constructor).eventName;
        this.isSocketEvent = (<typeof BaseEvent> this.constructor).isSocketEvent;

        this.created = Date.now();
    }
}

export declare type TypeOfBaseEvent<T extends BaseEvent<any>> = { new(data: any): T; };

export interface BaseEventCallback<T extends BaseEvent<any>> {
    (event: T);
}
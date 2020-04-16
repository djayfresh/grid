import { IPoint } from '../point.model';

export interface IMapObject {
    id: number;
    pos: IPoint;
    attributes: GameObjectAttributes[];
}

export interface IMapDestroyable extends IMapObject {
    health: number;
    totalHealth: number;
}

//TODO: Move to shared models
export enum GameObjectAttributes {
    Blocking = 1, // collision with
    Holding = 2, // prevent leaving object
    Exiting = 3, // way to leave a holding object
    NoExit = 4
}
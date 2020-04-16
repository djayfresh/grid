import { IPoint } from './point.model';

export interface IGameObject {
    id: number;
    pos: IPoint;
    attributes: GameObjectAttributes[];
    center: IPoint;

    update(dt: number, world: any): void; //TODO: replace world: any with proper world definition
    isDeleted(): boolean;
    isVisible(): boolean;
    setVisible(value: boolean): void;
    
    delete(): void;
}

export interface IDestroyable extends IGameObject {
    health: number;
    totalHealth: number;
    statusBar: IGameObject;
}

export enum GameObjectAttributes {
    Blocking = 1, // collision with
    Holding = 2, // prevent leaving object
    Exiting = 3, // way to leave a holding object
    NoExit = 4
}
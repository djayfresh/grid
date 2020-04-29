import { IPoint } from '../point.model';

export interface IMapObject {
    type: GameObjectTypes,
    id: number;
    origin: IPoint;
    attributes: GameObjectAttributes[];

    //additional attributes per object type
    [key: string]: any;
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

export enum GameObjectTypes {
    GameObject = 1,
    RenderObject = 2,
    Rectangle = 3,
    RenderImage = 4,
    Box = 5,
    RenderText = 6,
    Prefab = 7,
    Line = 8,
    TiledImage = 9,
    CanvasBounds = 10,
    CanvasRender = 11,
    StatusBar = 12,
    Wall = 13,
    Player = 14,
    Enemy = 15,
    Spawner = 16,
    Bullet = 17
}
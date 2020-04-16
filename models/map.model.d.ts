import { IPoint } from './point.model';
import { IGameObject } from './game-object.model';
import { IImageData } from './image.model';
import { IPlayer } from './player.model';

export interface IMap {
    regions: IRegion[];
    players: IPlayer[];
    images: IImageData[];

    origin: IPoint;
    
    load(): void;
    destroy(): void;
}

export interface IRegion {
    origin: IPoint;
    chunks: IChunk[];

    load(): void;
    destroy(): void;
}

export interface IChunk {
    origin: IPoint;
    size: IPoint;
    gameObjects: IGameObject[];
    joints: IJoint[];

    load(): void;
    destroy(): void;
}

export enum JointTypes {
    Asset = 1, //tree, rock, lamp
    Prefab = 2, //house, building, bridge
    Connector = 3, //Generation chunk connection
}

export type JointType = JointTypes | number | string;

export interface IJoint {
    origin: IPoint;
    direction: IPoint;

    type: JointType;
    acceptedTypes: JointType[];
}
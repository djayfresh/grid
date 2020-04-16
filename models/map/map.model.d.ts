import { IPoint } from '../point.model';
import { IMapObject } from './map-object.model';
import { IImageData } from './image.model';
import { IPlayer } from './player.model';
import { IMapWeapon } from './weapon.model';

export interface IMap {
    regions: IRegion[];
    players: IPlayer[];
    images: IImageData[];
    weapons: IMapWeapon[];

    origin: IPoint;
}

export interface IRegion {
    origin: IPoint;
    chunks: IChunk[];
}

export interface IChunk {
    origin: IPoint;
    size: IPoint;
    gameObjects: IMapObject[];
    joints: IJoint[];
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
import { IDestroyable } from './game-object.model';

export interface IPlayer extends IDestroyable {
    weapons: any[];
    skinUrl?: string;
}
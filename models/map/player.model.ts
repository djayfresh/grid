import { IMapDestroyable } from './map-object.model';
import { IPlayerWeapon } from './weapon.model';

export interface IPlayer extends IMapDestroyable {
    weapons: IPlayerWeapon[];
    skinUrl?: string;
}
import { IPoint } from './physics';
import { BaseEvent } from './event-queue';
import { SceneImage } from './images';
import { GameObject } from './objects';

declare const gtag: Function;

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

interface ResizeEvent {
    screen: IPoint;
    canvas: IPoint
}

@GameEvent('Event.General.GameResize')
export class GameResizeEvent extends BaseEvent<ResizeEvent> {}

@GameEvent('Event.General.ImageLoaded')
export class ImageLoadedEvent extends BaseEvent<SceneImage> {}

@GameEvent('Event.General.ImagesLoaded')
export class ImagesLoadedEvent extends BaseEvent<SceneImage[]> {}

@GameEvent('Event.Object.Destroyed')
export class ObjectDestroyedEvent extends BaseEvent<GameObject> {}

@GameEvent('Event.Menu.LoadMain')
export class MenuLoadMainEvent extends BaseEvent<null> {}

@GameEvent('Event.Game.Start')
export class GameStartEvent extends BaseEvent<any> {} //should be all the game info needed to join


/* Socket Events */

@SocketEvent('Socket.Data')
export class SocketDataEvent extends BaseEvent<BaseEvent<any>> {}
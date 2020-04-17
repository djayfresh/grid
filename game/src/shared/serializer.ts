import { GameObjectTypes, IMapObject } from '../../../models/map/map-object.model';
import { GameObject, RenderObject, Rectangle, Box, Line, Prefab, RenderImage, RenderText, CanvasBounds, CanvasRender, StatusBar, TiledImage, Wall } from './objects';
import { Bullet, Player, Enemy, Spawner } from '../zombie/objects';

export class GameObjectSerializer {

    static serialize(gameObject: any) { //any => GameObject
        return gameObject.serialize();
    }

    static deserialize(data: IMapObject): GameObject {
        switch (data.type) {
            case GameObjectTypes.GameObject:
                return GameObject.deserialize(data);
                break;
            case GameObjectTypes.RenderObject:
                return RenderObject.deserialize(data);
                break;
            case GameObjectTypes.Rectangle:
                return Rectangle.deserialize(data);
                break;
            case GameObjectTypes.Box:
                return Box.deserialize(data);
                break;
            case GameObjectTypes.Line:
                return Line.deserialize(data);
                break;
            case GameObjectTypes.Prefab:
                return Prefab.deserialize(data);
                break;
            case GameObjectTypes.RenderImage:
                return RenderImage.deserialize(data);
                break;
            case GameObjectTypes.RenderText:
                return RenderText.deserialize(data);
                break;
            case GameObjectTypes.CanvasBounds:
                return CanvasBounds.deserialize(data);
                break;
            case GameObjectTypes.CanvasRender:
                return CanvasRender.deserialize(data);
                break;
            case GameObjectTypes.Bullet:
                return Bullet.deserialize(data);
                break;
            case GameObjectTypes.Player:
                return Player.deserialize(data);
                break;
            case GameObjectTypes.Enemy:
                return Enemy.deserialize(data);
                break;
            case GameObjectTypes.Spawner:
                return Spawner.deserialize(data);
                break;
            case GameObjectTypes.StatusBar:
                return StatusBar.deserialize(data);
                break;
            case GameObjectTypes.TiledImage:
                return TiledImage.deserialize(data);
                break;
            case GameObjectTypes.Wall:
                return Wall.deserialize(data);
                break;
            default:
                break;
        }

        throw new Error(`Unable to deserialize: ${data.type}`)
    }
}
import { World } from '../shared/world';
import { Player, Spawner } from './objects';
import { Rectangle } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { LevelConst } from '../lobby/lobby';

export class ZombieWorld extends World {
    player: Player;

    //TODO: Move to board
    generateMap() {
        const renderObjects = [];
        const streetWidth = 40;

        const player = new Player();
        renderObjects.push(player);

        //Streets
        renderObjects.push(new Rectangle(ID_CONST.Street, '#000000', 5, 5, streetWidth, 500)); //left street
        renderObjects.push(new Rectangle(ID_CONST.Street, '#000000', 5, world.center.y - (streetWidth / 2), 400, streetWidth)); //left street

        renderObjects.push(new Rectangle(ID_CONST.Ground, '#043511', -1000, -1000, 2000, 2000)); //global ground
        renderObjects.push(new Spawner('#00405e', 100, 100));

        this.setMap(renderObjects);
        this.setPlayer(player);

        return renderObjects;
    }
}

export var world = new ZombieWorld(LevelConst.Zombie);
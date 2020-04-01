import { World } from '../shared/world';
import { Player, Spawner } from './objects';
import { Rectangle } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { Colors } from '../shared/colors';
import { Point, RenderObjectAttributes } from '../shared/renderer';

export class ZombieWorld extends World {
    player: Player;
    playerAttachedToCenter: boolean = true;
    
    setPlayer(player: Player){
        this.player = player;
    }

    //TODO: Move to board
    generateMap() {
        const renderObjects = [];
        const streetWidth = 40;

        const player = new Player();
        player.attachPlayerToCenter = this.playerAttachedToCenter;
        player.pos = new Point(((this.screen.x / 2) - (player.width / 2)), ((this.screen.y / 2) - (player.height / 2)));
        renderObjects.push(player);

        //Streets
        const leftStreet = new Rectangle(ID_CONST.Street, Colors.Black, 5, 5, streetWidth, 500); //left street
        leftStreet.attributes.push(RenderObjectAttributes.Holding);

        const centerStreet = new Rectangle(ID_CONST.Street, Colors.Black, 5, this.center.y - (streetWidth / 2), 400, streetWidth);

        renderObjects.push(leftStreet);
        renderObjects.push(centerStreet); //center street

        renderObjects.push(new Rectangle(ID_CONST.Ground, Colors.Ground, -1000, -1000, 2000, 2000)); //global ground
        // renderObjects.push(new Spawner(Colors.Environment, 100, 100));

        this.setMap(renderObjects);
        this.setPlayer(player);

        return renderObjects;
    }
}
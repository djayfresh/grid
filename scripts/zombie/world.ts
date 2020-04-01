import { World } from '../shared/world';
import { Player, Spawner } from './objects';
import { Rectangle, CanvasBounds } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { Colors } from '../shared/colors';
import { Point, RenderObjectAttributes, RenderObject } from '../shared/renderer';
import { GameCanvas } from '../shared/canvas';

export class ZombieWorld extends World {
    player: Player;
    playerAttachedToCenter: boolean = true;
    
    setPlayer(player: Player){
        this.player = player;
    }

    //TODO: Move to board
    generateMap() {
        const streetWidth = 40;

        const player = new Player();
        player.attachPlayerToCenter = this.playerAttachedToCenter;
        player.pos = new Point(((this.screen.x / 2) - (player.width / 2)), ((this.screen.y / 2) - (player.height / 2)));
        this.add(player);

        //Streets
        const leftStreet = new Rectangle(ID_CONST.Street, Colors.Black, 5, 5, streetWidth, 500); //left street
        leftStreet.attributes.push(RenderObjectAttributes.Holding);

        const centerStreet = new Rectangle(ID_CONST.Street, Colors.Black, 5, this.center.y - (streetWidth / 2), 400, streetWidth);
        centerStreet.attributes.push(RenderObjectAttributes.Exiting); //where the streets connect player can exit

        this.add(leftStreet);
        this.add(centerStreet); //center street

        this.add(new Rectangle(ID_CONST.Ground, Colors.Ground, -1000, -1000, 2000, 2000)); //global ground
        // renderObjects.push(new Spawner(Colors.Environment, 100, 100));

        //screen bounds
        const bounds = new CanvasBounds(-1000, 0, 0, GameCanvas.width, GameCanvas.height);
        bounds.attributes.push(RenderObjectAttributes.Holding);
        this.add(bounds);

        this.setPlayer(player);
    }
}
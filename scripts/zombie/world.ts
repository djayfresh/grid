import { World } from '../shared/world';
import { Player, Spawner } from './objects';
import { Rectangle, CanvasBounds, TiledImage } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { Colors } from '../shared/colors';
import { Point, GameObjectAttributes, RenderObject } from '../shared/renderer';
import { GameCanvas } from '../shared/canvas';
import { ImageWorld } from '../test-worlds/image-world';
import { SceneImage } from '../shared/images';

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
        

        this.addImage({
            src: 'assets/images/zombie/RoadLine.png',
            catalog: 'zombie',
            name: 'road',
            height: 100,
            width: 100
        });

        const roadX: SceneImage = {
            catalog: 'zombie',
            name: 'road',
            height: streetWidth,
            width: streetWidth,
            showPreviewRender: true,
            previewColor: Colors.Black,
            rotation: 90
        };

        const roadY: SceneImage = {
            catalog: 'zombie',
            name: 'road',
            height: streetWidth,
            width: streetWidth,
            showPreviewRender: true,
            previewColor: Colors.Black
        };


        //Streets
        const centerStreet = new TiledImage(roadX, ID_CONST.Street, {x: 5, y: this.center.y - (streetWidth/2)}, {x: 400, y: streetWidth}); //new Rectangle(ID_CONST.Street, Colors.Black, 5, this.center.y - (streetWidth / 2), 400, streetWidth);
        centerStreet.attributes.push(GameObjectAttributes.Exiting); //where the streets connect player can exit

        const leftStreet = new TiledImage(roadY, ID_CONST.Street, {x: 5, y: 5}, {x: streetWidth, y: 500}); //new Rectangle(ID_CONST.Street, Colors.Black, 5, 5, streetWidth, 500); //left street
        leftStreet.attributes.push(GameObjectAttributes.Holding);

        this.add(leftStreet);
        this.add(centerStreet); //center street

        this.addImage({
            src: 'assets/images/zombie/Ground_Tile_Dark.png',
            catalog: 'zombie',
            name: 'ground',
            height: 100,
            width: 100
        });

        const groundImage: SceneImage = {
            catalog: 'zombie',
            name: 'ground',
            height: 100,
            width: 100,
            showPreviewRender: true,
            previewColor: Colors.Ground
        };

        const ground = new TiledImage(groundImage, ID_CONST.Ground, {x:-1000, y:-1000}, {x: 2000, y: 2000});

        this.add(ground);

        //screen bounds
        const bounds = new CanvasBounds(-1000, {x: 0, y: 0}, {x: GameCanvas.width, y: GameCanvas.height});
        bounds.attributes.push(GameObjectAttributes.Holding);
        this.add(bounds);

        this.setPlayer(player);
    }
}
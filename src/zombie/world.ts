import { World } from '../shared/world';
import { Player, Spawner } from './objects';
import { CanvasBounds, TiledImage, GameObjectAttributes, Box } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { Colors } from '../shared/colors';
import { GameCanvas } from '../shared/canvas';
import { SceneImage } from '../shared/images';
import { Point } from '../shared/physics';

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
        player.pos = new Point(((this.canvas.x / 2) - (player.width / 2)), ((this.canvas.y / 2) - (player.height / 2)));
        this.add(player);
        

        this.addImage({
            src: 'zombie/RoadLine.png',
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
        const centerStreet = new TiledImage(roadX, ID_CONST.Street, {x: 5 + streetWidth, y: this.canvasCenter.y - (streetWidth/2)}, {x: 400, y: streetWidth}); //new Rectangle(ID_CONST.Street, Colors.Black, 5, this.center.y - (streetWidth / 2), 400, streetWidth);
        
        const overlap = new Box(ID_CONST.Street, {x: 5, y: this.canvasCenter.y - (streetWidth/2)}, {x: streetWidth * 2, y: streetWidth});
        overlap.attributes.push(GameObjectAttributes.Exiting); //where the streets connect player can exit

        const leftStreet = new TiledImage(roadY, ID_CONST.Street, {x: 5, y: 5}, {x: streetWidth, y: 500}); //new Rectangle(ID_CONST.Street, Colors.Black, 5, 5, streetWidth, 500); //left street
        leftStreet.attributes.push(GameObjectAttributes.Holding);

        this.add(overlap);
        this.add(leftStreet);
        this.add(centerStreet); //center street

        this.addImage({
            src: 'zombie/Ground_Tile_Dark.png',
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
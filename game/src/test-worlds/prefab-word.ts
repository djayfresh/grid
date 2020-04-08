import { World } from '../shared/world';
import { Player, Spawner } from '../zombie/objects';
import { CanvasBounds, TiledImage, GameObjectAttributes, Box, StatusBar } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { Colors } from '../shared/colors';
import { GameCanvas } from '../shared/canvas';
import { SceneImage, ImageManager } from '../shared/images';
import { Point } from '../shared/physics';
import { House } from '../zombie/prefabs';

export class PrefabWorld extends World {
    player: Player;
    playerAttachedToCenter: boolean = true;
    
    setPlayer(player: Player){
        this.player = player;
    }

    loadImages() {
        this.addImage({
            src: 'zombie/RoadLine.png',
            catalog: 'zombie',
            name: 'road',
            height: 100,
            width: 100
        });

        this.addImage({
            src: 'zombie/Ground_Tile_Dark.png',
            catalog: 'zombie',
            name: 'ground',
            height: 100,
            width: 100
        });
    }

    generateMap() {
        const player = new Player();
        player.attachPlayerToCenter = false;
        player.pos = new Point(((this.canvas.x / 2) - (player.width / 2)), ((this.canvas.y / 2) - (player.height / 2)));
        this.add(player);

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

        this.add(new House(0, {x: 50, y: 50}, {x: 200, y: 200}));

        //screen bounds
        const bounds = new CanvasBounds(-1000, {x: 0, y: 0}, {x: GameCanvas.width, y: GameCanvas.height});
        bounds.attributes.push(GameObjectAttributes.Holding);
        bounds.attributes.push(GameObjectAttributes.NoExit);
        this.add(bounds);

        const statusBar = new StatusBar(Colors.Enemy, {x: 150, y: 150}, {x: 20, y: 4}, 100, 100);
        this.add(statusBar);

        this.setPlayer(player);
    }
}
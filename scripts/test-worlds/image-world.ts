import { RenderObject } from '../shared/renderer';
import { SceneImage, ImageSource } from '../shared/images';
import { RenderImage } from '../shared/objects';
import { World } from '../shared/world';

export class ImageWorld extends World {
    images: ImageSource[] = [];
    imagesLoaded: ImageSource[] = [];

    generateMap() {

        this.addImage({
            catalog: 'game',
            name: 'logo',
            height: 100,
            width: 100,
            src: 'assets/images/logo.png',
        });

        this.addImage({
            src: 'assets/images/zombie/Ground_Tile.png',
            catalog: 'zombie',
            name: 'ground',
            height: 100,
            width: 100
        });

        const renderObjects = [];

        //Upscale an image
        const img: SceneImage = {
            catalog: 'game',
            name: 'logo',
            height: 200,
            width: 200
        };

        renderObjects.push(new RenderImage(img, 2000, {x: 35, y: 90 }));

        //downscale image
        const img2: SceneImage = {
            catalog: 'game',
            name: 'logo',
            height: 20,
            width: 20
        };
        renderObjects.push(new RenderImage(img2, 2000, {x: 0, y: 0 }));

        //Load a "sprit" of an image
        const subImg: SceneImage = {
            catalog: 'game',
            name: 'logo',
            height: 20,
            width: 20,
            subX: 50,
            subY: 20,
            subWidth: 10,
            subHeight: 10
        };
        renderObjects.push(new RenderImage(subImg, 2000, {x: 20, y: 0 }));

        
        const imgG: SceneImage = {
            catalog: 'zombie',
            name: 'ground',
            height: 100,
            width: 100
        };

        //use the same image for multiple locations
        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 4; j++){
                renderObjects.push(new RenderImage(imgG, 1000, {x: imgG.width * i, y: imgG.height * j }));
            }
        }
    
        this.setMap(renderObjects);
    }
}
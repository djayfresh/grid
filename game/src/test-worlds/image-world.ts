import { SceneImage, ImageSource } from '../shared/images';
import { RenderImage, TiledImage } from '../shared/objects';
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
            src: 'logo.png',
        });

        this.addImage({
            src: 'zombie/Ground_Tile.png',
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
            width: 20,
            showPreviewRender: true //render a white box till the image loads
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

        //created a tiled version from the sprit
        renderObjects.push(new TiledImage(subImg, 2000, {x: 100, y: 20}, {x: 60, y: 60}));

        
        const imgG: SceneImage = {
            catalog: 'zombie',
            name: 'ground',
            height: 100,
            width: 100
        };

        //use the same image for multiple locations
        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 4; j++){
                //renderObjects.push(new RenderImage(imgG, 1000, {x: imgG.width * i, y: imgG.height * j }));
            }
        }

        imgG.width = 50;
        imgG.height = 50;

        renderObjects.push(new TiledImage(imgG, 1000, {x: -300, y: -300}, {x: 900, y: 900}));
    
        this.setMap(renderObjects);
    }
}
import { GridWorld } from '../grid/world';
import { RenderObject } from '../shared/renderer';
import { ImageManager, SceneImage, ImageSource } from '../shared/images';
import { RenderImage } from '../shared/objects';

export class ImageWorld extends GridWorld {
    images: ImageSource[] = [];
    imagesLoaded: ImageSource[] = [];

    generateMap(): RenderObject[] {

        this.images.push(ImageManager.addImage({
            catalog: 'memory',
            name: 'logo',
            height: 100,
            width: 100,
            src: 'assets/images/logo.png',
        }));

        const renderObjects = [];

        const img: SceneImage = {
            catalog: 'memory',
            name: 'logo',
            height: 200,
            width: 200
        };

        renderObjects.push(new RenderImage(img, 2000, {x: 35, y: 90 }));

        const img2: SceneImage = {
            catalog: 'memory',
            name: 'logo',
            height: 20,
            width: 20
        };
        renderObjects.push(new RenderImage(img2, 2000, {x: 0, y: 0 }));

        renderObjects.push(this.board.createGrid());
    
        this.setMap(renderObjects);

        return renderObjects;
    }
}
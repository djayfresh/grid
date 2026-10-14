import { Debug } from './utility';
import { GameEventQueue } from './event-queue';
import { ImageLoadedEvent, ImagesLoadedEvent } from './events';

export interface ImageSource {
    catalog: string;
    name: string;
    src: string;
    width: number;
    height: number;
    isLoaded?: boolean;
    image?: HTMLImageElement;
}

export interface SceneImage {
    catalog: string;
    name: string;
    showPreviewRender?: boolean;
    previewColor?: string;
    subX?: number;
    subY?: number;
    subWidth?: number;
    subHeight?: number;
    width: number;
    height: number;
    rotation?: number;
}

export class ImageManager {
    static images: ImageSource[] = [];

    static baseUrl: string = 'assets/images/';

    static addImage(img: ImageSource) {
        const searchImage = ImageManager.getImage(img.catalog, img.name);
        if(searchImage){
            return false; //already added
        }
        Debug.image('Add Image', img);

        const $img = new Image(img.width, img.height);
        $img.onload = () => {
            setTimeout(() => {
                img.isLoaded = true;
                img.image = $img;
                Debug.image('Loaded', $img, img);

                GameEventQueue.notify(new ImageLoadedEvent(img));
                
                if (this.images.every(i => i.isLoaded)){
                    GameEventQueue.notify(new ImagesLoadedEvent(this.images));
                }
            }, 2000);
        };
        $img.src = ImageManager.baseUrl + img.src;

        this.images.push(img);

        return true;
    }

    static getImage(catalog: string, name: string){
        return this.images.first(i => i.name === name && i.catalog === catalog);
    }

    static getImages(catalog: string){ 
        return this.images.filter(i => i.catalog === catalog);
    }
}
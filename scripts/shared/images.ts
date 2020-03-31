import { Debug } from './utility';

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
    subX?: number;
    subY?: number;
    subWidth?: number;
    subHeight?: number;
    width: number;
    height: number;
}

export class ImageManager {
    static images: ImageSource[] = [];

    static addImage(img: ImageSource) {
        const searchImage = ImageManager.getImage(img.catalog, img.name);
        if(searchImage){
            return searchImage;
        }
        Debug.image('Add Image', img);

        const $img = new Image(img.width, img.height);
        $img.onload = () => {
            setTimeout(() => {
                img.isLoaded = true;
                img.image = $img;
                Debug.image('Loaded', $img, img);
            }, 2000);
        };
        $img.src = img.src;

        this.images.push(img);

        return img;
    }

    static getImage(catalog: string, name: string){
        return this.images.first(i => i.name === name && i.catalog === catalog);
    }

    static getImages(catalog: string){ 
        return this.images.filter(i => i.catalog === catalog);
    }
}
import { Physics, Point, IPoint } from './physics';
import { Debug } from './utility';
import { World } from './world';
import { Colors } from './colors';
import { SceneImage, ImageManager, ImageSource } from './images';
import { GameCanvas } from './canvas';

export interface IGameObject {
    id: number;
    pos: Point;
    attributes: GameObjectAttributes[];
    update: (dt: number, world: World) => void;
    isDeleted: () => boolean;
    isVisible: () => boolean;
}

export interface IRectangle extends IGameObject {
    width: number;
    height: number;
}

export enum GameObjectAttributes {
    Blocking = 1, // collision with
    Holding = 2, // prevent leaving object
    Exiting = 3, // way to leave a holding object
}

export class GameObject implements IGameObject {
    id: number;
    pos: Point;
    bounds: IPoint;
    _isVisible = true;
    _deleted = false;
    attributes: GameObjectAttributes[] = [];

    constructor(id: number, pos?: IPoint, bounds?: IPoint) {
        this.id = id;
        this.pos = new Point(pos && pos.x || 0, pos && pos.y || 0);
        this.bounds = bounds;
    }

    setPos(x: number, y: number) {
        this.pos = new Point(x, y);
    }

    //should have individual types overwrite
    get center() {
        return new Point(this.pos.x, this.pos.y);
    };

    update(_dt: number, _world: World) {

    };

    isVisible() {
        return this._isVisible && !this._deleted;
    };

    isDeleted() {
        return this._deleted;
    }
}

export class Box extends GameObject implements IRectangle {
    bounds: IPoint;

    get width() {
        return this.bounds.x;
    }

    get height() {
        return this.bounds.y;
    }
}

export class RenderObject extends GameObject {
    layer = 0;
    canvas?: HTMLCanvasElement;

    constructor(id: number, pos?: IPoint) {
        super(id, pos)
        this.layer = id; //this should change probably
    }

    setContext(h_canvas: HTMLCanvasElement) {
        this.canvas = h_canvas;
        var h_context = this.canvas.getContext('2d');
        this.preDraw(h_context);
    }

    preDraw(_ctx: CanvasRenderingContext2D) {

    }

    draw(_ctx: CanvasRenderingContext2D, _world: World) {

    };

    //Helper function to allow for world translate to to impact drawing an element
    //Use for UI & Player
    drawSticky(ctx: CanvasRenderingContext2D, world: World, drawFunc: () => void) {
        ctx.translate(-world.pos.x, -world.pos.y); //reset world translate, move back to 0,0

        drawFunc();

        ctx.translate(world.pos.x, world.pos.y); //reset the translate to w/e the world has been translated to
    }
}

export class Rectangle extends RenderObject implements IRectangle {
    color = '';
    constructor(id: number, color: string, pos: IPoint, bounds: IPoint) {
        super(id, pos);

        this.color = color;
        this.bounds = bounds;
    }

    get center() {
        return new Point(this.pos.x + (this.width/2), this.pos.y + (this.height/2));
    }

    set width(value: number) {
        this.bounds.x = value;
    }

    get width() {
        return this.bounds.x;
    }

    set height(value: number) {
        this.bounds.y = value;
    }

    get height() {
        return this.bounds.y;
    }

    draw(ctx: CanvasRenderingContext2D, _world: World) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
    }

    checkViewVisibility(world: World) {
        this._isVisible = Physics.boxInBounds(this.pos, this.width, this.height, world);

        if (!this._isVisible) {
            Debug.physics("Hidden", this);
        }
    }

    update(_dt: number, world: World) {
        this.checkViewVisibility(world);
    }
}

export class RenderText extends RenderObject {
    text: string = '';
    font: string = 'Arial';
    size: string = '30px';
    color: string = Colors.Black;
    centered: boolean = false;

    constructor(id: number, options: Partial<RenderText>) {
        super(id);

        Object.assign(this, options);
    }

    preDraw(ctx: CanvasRenderingContext2D) {
        ctx.font = `${this.size} ${this.font}`;
        ctx.fillStyle = this.color;
        if(this.centered) ctx.textAlign = 'center';
        ctx.fillText(this.text, this.pos.x, this.pos.y);
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.canvas) {
            ctx.drawImage(this.canvas, 0, 0);
        }
        else {
            this.preDraw(ctx);
        }
    }
}

export class Line extends RenderObject implements IRectangle {
    color: string = Colors.Black;
    bounds = { x: 0, y: 0 }
    constructor(id: number, pos: Point, pos2: Point, color?: string) {
        super(id);

        this.pos = pos;
        this.bounds = pos2;
        this.color = color || this.color;
    }

    get width() {
        return this.bounds.x;
    }

    get height() {
        return this.bounds.y;
    }

    preDraw(ctx: CanvasRenderingContext2D) {
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.bounds.x, this.bounds.y);
        ctx.strokeStyle = this.color;
        ctx.stroke()
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.canvas) {
            ctx.drawImage(this.canvas, 0, 0);
        }
        else {
            this.preDraw(ctx);
        }
    }
}

export class RenderImage extends RenderObject implements IRectangle {
    sceneImage: SceneImage;
    previewColor: string = Colors.White;
    bounds: IPoint;

    constructor(image: SceneImage, id: number, pos: IPoint) {
        super(id, pos);

        this.sceneImage = image;
        this.bounds = {x: this.sceneImage.width, y: this.sceneImage.height };
    }

    get width() {
        return this.bounds.x;
    }

    get height() {
        return this.bounds.y;
    }

    preDraw(ctx: CanvasRenderingContext2D) {
        const image = ImageManager.getImage(this.sceneImage.catalog, this.sceneImage.name);

        if (image.isLoaded && !this.canvas){
            this._setImageToCanvas(image);

            this._drawCanvas(ctx);
        }
        else if(this.sceneImage.showPreviewRender) {
            ctx.fillStyle = this.sceneImage.previewColor || this.previewColor;
            ctx.fillRect(this.pos.x, this.pos.y, this.bounds.x, this.bounds.y);
        }
    }

    protected _drawCanvas(ctx: CanvasRenderingContext2D){
        ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
    }

    protected _setImageToCanvas(image: ImageSource) {
        this.canvas = this.getSceneImage(image);
    }    

    protected getSceneImage(image: ImageSource) {
        const $imageCanvas = GameCanvas.createCanvas(this.sceneImage.width, this.sceneImage.height);
        const $imageCtx = $imageCanvas.getContext('2d');

        this._rotateImage((translateX, translateY) => {
            if (this.sceneImage.subX) {
                $imageCtx.drawImage(image.image, this.sceneImage.subX, this.sceneImage.subY, this.sceneImage.subWidth, this.sceneImage.subHeight, translateX, translateY, this.sceneImage.width, this.sceneImage.height);
            }
            else {
                $imageCtx.drawImage(image.image, translateX, translateY, this.sceneImage.width, this.sceneImage.height);
            }
        }, $imageCanvas, $imageCtx);

        return $imageCanvas;
    }

    private _rotateImage(drawImage: (translateX: number, translateY: number) => void, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        if (this.sceneImage.rotation){
            let translateX = canvas.width/2;
            let translateY = canvas.height/2;

            ctx.translate(translateX, translateY);
            ctx.rotate(this.sceneImage.rotation * Math.PI / 180);

            drawImage(-translateX, -translateY); 

            ctx.translate(-translateX, -translateY);
            ctx.rotate(this.sceneImage.rotation * Math.PI / 180);
        }
        else {
            drawImage(0, 0);
        }
    }

    draw(ctx: CanvasRenderingContext2D, _world: World) {
        if (this.canvas) {
            this._drawCanvas(ctx);
        }
        else {
            this.preDraw(ctx);
        }
    }
}

export class TiledImage extends RenderImage {
    constructor(img: SceneImage, id: number, pos: IPoint, bounds: IPoint){
        super(img, id, pos);

        this.bounds = bounds;
    }

    protected _setImageToCanvas(image: ImageSource) {
        //create the actual image canvas
        const $imageCanvas = this.getSceneImage(image);

        this.canvas = GameCanvas.createCanvas(this.bounds.x, this.bounds.y);
        const tiledCtx = this.canvas.getContext('2d');
        const tilesX = Math.ceil(this.bounds.x / this.sceneImage.width);
        const tilesY = Math.ceil(this.bounds.y / this.sceneImage.height);

        //generate a canvas, tiled with the image
        for(let x = 0; x < tilesX; x++) {
            for(let y = 0; y < tilesY; y++){
                tiledCtx.drawImage($imageCanvas, this.sceneImage.width * x, this.sceneImage.height * y);
            }
        } 
    }
}

export class Prefab extends RenderObject implements IRectangle {
    childObjects: RenderObject[];
    prefabCanvas: HTMLCanvasElement;
    prefabCtx: CanvasRenderingContext2D;

    constructor(id: number, pos: IPoint, bounds: IPoint){ 
        super(id, pos);
        this.bounds = bounds;
        this.prefabCanvas = GameCanvas.createCanvas(bounds.x, bounds.y);
        this.prefabCtx = this.prefabCanvas.getContext('2d');
    }

    get width() {
        return this.bounds.x;
    }

    get height() {
        return this.bounds.y;
    }

    add(...children: RenderObject[]){
        this.childObjects.push(...children);
    }

    draw(ctx: CanvasRenderingContext2D, world: World){
        this.childObjects.forEach(c => c.draw(this.prefabCtx, world));

        ctx.drawImage(this.prefabCanvas, this.pos.x, this.pos.y);
    }

    update(dt: number, world: World){
        this.childObjects.forEach(c => c.update(dt, world));
    }

}

export class CanvasBounds extends GameObject implements IRectangle {
    constructor(id: number, pos: IPoint, bounds: IPoint){
        super(id, pos);

        this.bounds = bounds;
    }

    get width() {
        return this.bounds.x;
    }

    get height() {
        return this.bounds.y;
    }

    draw() {}
    preDraw() {}
    update(_dt: number, world: World) {
        this.pos.x = -world.pos.x;
        this.pos.y = -world.pos.y;
    }
}

export class CanvasRender extends RenderObject {
    constructor(id: number, canvas: HTMLCanvasElement) {
        super(id);
        
        this.canvas = canvas;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
    }
}
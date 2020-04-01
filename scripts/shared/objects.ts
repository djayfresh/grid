import { RenderObject, Point, IPoint } from './renderer';
import { Physics } from './physics';
import { Debug } from './utility';
import { World } from './world';
import { Colors } from './colors';
import { SceneImage, ImageManager } from './images';
import { GameCanvas } from './canvas';

export class Rectangle extends RenderObject {
    color = '';
    constructor(id: number, color: string, x: number, y: number, width: number, height: number) {
        super(id, x, y);

        this.color = color;
        this.bounds = { w: width, h: height };
    }

    get center() {
        return new Point(this.pos.x + (this.width/2), this.pos.y + (this.height/2));
    }

    set width(value: number) {
        this.bounds.w = value;
    }

    get width() {
        return this.bounds.w;
    }

    set height(value: number) {
        this.bounds.h = value;
    }

    get height() {
        return this.bounds.h;
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

export class Line extends RenderObject {
    color: string = Colors.Black;
    bounds = { x: 0, y: 0 }
    constructor(id: number, pos: Point, pos2: Point, color?: string) {
        super(id);

        this.pos = pos;
        this.bounds = pos2;
        this.color = color || this.color;
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

export class RenderImage extends RenderObject {
    sceneImage: SceneImage;

    constructor(image: SceneImage, id: number, pos: IPoint) {
        super(id, pos.x, pos.y);

        this.sceneImage = image;
        this.bounds = {x: this.sceneImage.width, y: this.sceneImage.height };
    }

    preDraw(ctx: CanvasRenderingContext2D) {
        const image = ImageManager.getImage(this.sceneImage.catalog, this.sceneImage.name);

        if (image.isLoaded && !this.canvas){
            this.canvas = GameCanvas.createCanvas(this.sceneImage.width, this.sceneImage.height);

            const context = this.canvas.getContext('2d');
            if (this.sceneImage.subX){
                context.drawImage(image.image, this.sceneImage.subX, this.sceneImage.subY, this.sceneImage.subWidth, this.sceneImage.subHeight, 0, 0, this.sceneImage.width, this.sceneImage.height);
            }
            else {
                context.drawImage(image.image, 0, 0, this.sceneImage.width, this.sceneImage.height);
            }

            ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
        }
        else {
            ctx.fillStyle = Colors.White;
            ctx.fillRect(this.pos.x, this.pos.y, this.sceneImage.width, this.sceneImage.height);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.canvas) {
            ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
        }
        else {
            this.preDraw(ctx);
        }
    }
}
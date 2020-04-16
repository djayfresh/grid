import { Physics, Point, IPoint } from './physics';
import { Debug, ID_CONST } from './utility';
import { World } from './world';
import { Colors } from './colors';
import { SceneImage, ImageManager, ImageSource } from './images';
import { GameCanvas } from './canvas';
import { GameEventQueue } from './event-queue';
import { ObjectDestroyedEvent } from './events';
import { Renderer } from './renderer';

import { GameObjectAttributes } from '../../../models/map/map-object.model';
export { GameObjectAttributes };

export interface IGameObject {
    id: number;
    pos: IPoint;
    attributes: GameObjectAttributes[];
    center: IPoint;

    update(dt: number, world: any): void; //TODO: replace world: any with proper world definition
    isDeleted(): boolean;
    isVisible(): boolean;
    setVisible(value: boolean): void;
    
    delete(): void;
}

export interface IDestroyable extends IGameObject {
    health: number;
    totalHealth: number;
    statusBar: StatusBar;
}

export interface IRectangle extends IGameObject {
    width: number;
    height: number;
}

export interface IDestroyer extends IGameObject {
    damage: number;
}

export class GameObject implements IGameObject {
    id: number;
    pos: Point;
    bounds: IPoint;
    private _isVisible = true;
    private _deleted = false;
    attributes: GameObjectAttributes[] = [];

    constructor(id: number, pos?: IPoint, bounds?: IPoint) {
        this.id = id;
        this.pos = new Point((pos && pos.x) || 0, (pos && pos.y) || 0);
        this.bounds = {...bounds};
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

    setVisible(value: boolean){
        this._isVisible = value;
    }

    isDeleted() {
        return this._deleted;
    }

    delete() {
        if (!this._deleted){
            GameEventQueue.notify(new ObjectDestroyedEvent(this), true, true);
        }
        this._deleted = true;
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

    constructor(id: number, pos?: IPoint, bounds?: IPoint) {
        super(id, pos, bounds)
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
        super(id, pos, bounds);

        this.color = color;
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
        this.setVisible(Physics.boxInBounds(this.pos, this.width, this.height, world));

        if (!this.isVisible()) {
            Debug.physics("Hidden", this);
        }
    }

    update(_dt: number, world: World) {
        //this.checkViewVisibility(world);
    }
}

export class RenderText extends RenderObject {
    text: string = '';
    font: string = 'Arial';
    size: string = '30px';
    color: string = Colors.Black;
    alignment: CanvasTextAlign = 'center';

    constructor(id: number, options: Partial<RenderText>) {
        super(id);

        Object.assign(this, options);
    }

    preDraw(ctx: CanvasRenderingContext2D) {
        ctx.font = `${this.size} ${this.font}`;
        ctx.fillStyle = this.color;
        ctx.textAlign = this.alignment;
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
        super(id, pos, {x: image.width, y: image.height});

        this.sceneImage = image;
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

        this.bounds = {...bounds};
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
        super(id, pos, bounds);
        this.prefabCanvas = GameCanvas.createCanvas(bounds.x, bounds.y);
        this.prefabCtx = this.prefabCanvas.getContext('2d');
        this.childObjects = [];
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
        Renderer.clearRect(this.prefabCtx, {x: this.width, y: this.height});

        this.childObjects
        .filter(ro => ro.isVisible())
        .forEach(c => c.draw(this.prefabCtx, world));

        ctx.drawImage(this.prefabCanvas, this.pos.x, this.pos.y);
    }

    update(dt: number, world: World){
        this.childObjects
        .filter(c => !c.isDeleted())
        .forEach(c => c.update(dt, world));
    }
    
    noCollisions(origin: IPoint, newPos: IPoint, rect: {x: number, y: number, w: number, h: number}) {
        //TODO: Other types of collision besides Rectangles
        const rectangles = this.childObjects.filter(ro => ro.isVisible()).ofType<IRectangle>((ro: any) => (ro as IRectangle).width !== undefined);
        const blockers = rectangles.filter(ro => ro.attributes.indexOf(GameObjectAttributes.Blocking) >= 0);

        const rectBlocked = blockers.some(s => {
            return Physics.collision(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x + this.pos.x, s.pos.y + newPos.y + this.pos.y, s.width, s.height)
        });

        if (rectBlocked){
            return false;
        }

        const holders = rectangles.filter(ro => ro.attributes.indexOf(GameObjectAttributes.Holding) >= 0);

        const rectLeavingHolding = holders.filter(s => {
            const wasInside = Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + origin.x + this.pos.x, s.pos.y + origin.y + this.pos.y, s.width, s.height);
            return wasInside && !Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x + this.pos.x, s.pos.y + newPos.y + this.pos.y, s.width, s.height)
        });

        if (rectLeavingHolding && rectLeavingHolding.length > 0){
            if (rectLeavingHolding.some(ro => ro.attributes.indexOf(GameObjectAttributes.NoExit) >= 0)) {
                return false;
            }
            
            const exits = rectangles.filter(ro => ro.attributes.indexOf(GameObjectAttributes.Exiting) >= 0);
            //moving into an exit
            const rectInExit = exits.some(s => Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x + this.pos.x, s.pos.y + newPos.y + this.pos.y, s.width, s.height))
            return rectInExit;
        }

        return true;
    }

    doDestroyableCheck(world: World) {
        const destroyers = world.map.ofType<IDestroyer>(ro => (ro as IDestroyer).damage && !ro.isDeleted());
        const destroyable = this.childObjects.ofType<IDestroyable>(ro => (ro as IDestroyable).totalHealth && !ro.isDeleted());

        destroyers.forEach(b => {
            destroyable.forEach(d => {
                if (Physics.simpleCollision(d, b, 4, this.pos)) {
                    if (d.health > b.damage){
                        b.delete();
                        d.health -= b.damage;
                    }
                    else if (d.health < b.damage){
                        b.damage -= d.health;
                        d.delete();
                    }
                    else {
                        b.delete();
                        d.delete();
                    }
                }
            });
        });
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

    draw(ctx: CanvasRenderingContext2D, world: World) {
        
        ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
    }
}

export class StatusBar extends Rectangle {
    maxStatus: number;
    _currentStatus: number;
    padding: number = 2;
    _attachedTo?: GameObject;

    constructor(color: string, pos: IPoint, bounds: IPoint, maxStatus: number, currentStatus: number){
        super(ID_CONST.StatusBar, color, pos, bounds);

        if (this.bounds.y <= 4){
            this.padding = 1;
        }
        
        this.maxStatus = maxStatus;
        this.setStatus(currentStatus);
    }

    setStatus(value: number){
        this._currentStatus = value;
    }

    draw(ctx: CanvasRenderingContext2D, _world: World) {
        let pos = this._attachedTo? this._attachedTo.pos : {x: 0, y: 0};

        ctx.fillStyle = Colors.Black;
        ctx.fillRect(pos.x + this.pos.x, pos.y + this.pos.y, this.width, this.height);

        ctx.fillStyle = this.color;
        ctx.fillRect(pos.x + this.pos.x + this.padding, pos.y + this.pos.y + this.padding, (this.width / (this.maxStatus / this._currentStatus)) - (this.padding * 2), this.height - (this.padding * 2));
    }
}

export class Wall extends Rectangle implements IDestroyable {
    totalHealth: number;
    health: number;
    statusBar: StatusBar;

    constructor(id: number, color: string, pos: IPoint, bounds: IPoint, totalHealth: number){
        super(id, color, pos, bounds);

        this.totalHealth = totalHealth;
        this.health = totalHealth;

        this.statusBar = new StatusBar(Colors.Environment, {x: 0, y: 0}, {x: 20, y: 4}, totalHealth, totalHealth);
        this.statusBar._attachedTo = this;
    }
    
    draw(ctx: CanvasRenderingContext2D, world: World){
        super.draw(ctx, world);

        if (this.health < (this.totalHealth * 0.75)) {
            this.statusBar.draw(ctx, world);
        }
    }

    update(dt: number, world: World){
        this.statusBar._currentStatus = this.health;
        this.statusBar.update(dt, world);
    }
}
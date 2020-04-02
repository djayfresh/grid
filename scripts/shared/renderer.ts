import { Debug, debounce } from './utility';
import { World } from './world';
import { GameCanvas } from './canvas';

export enum GameObjectAttributes {
    Blocking = 1, // collision with
    Holding = 2, // prevent leaving object
    Exiting = 3, // way to leave a holding object
}

export class GameObject {
    id: number;
    pos: Point;
    bounds: any = { w: 0, h: 0 };
    _isVisible = true;
    _deleted = false;
    attributes: GameObjectAttributes[] = [];

    constructor(id: number, pos?: IPoint) {
        this.id = id;
        this.pos = new Point(pos && pos.x || 0, pos && pos.y || 0);
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

export class CanvasRender extends RenderObject {
    constructor(id: number, canvas: HTMLCanvasElement) {
        super(id);
        
        this.canvas = canvas;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
    }
}

export class Renderer {
    draw(world: World, layer?: number) {
        const screen = { x: GameCanvas.canvas.clientWidth, y: GameCanvas.canvas.clientHeight };
        Renderer.clearRect(GameCanvas.ctx, screen);
        Renderer.clearScreen(world.$ctx, world);

        const worldDelta = world.getPosDelta();
        Debug.draw('Render Draw:', world.pos, world.map, worldDelta);
        world.$ctx.translate(worldDelta.x, worldDelta.y);

        const renderObjects = world.map.filter(o => o instanceof RenderObject) as RenderObject[];
        renderObjects
            .sort((a, b) => a.layer - b.layer)
            .filter(ro => !layer || ro.layer === layer)
            .filter(ro => ro.isVisible())
            .forEach(ro => {
                Debug.draw('Draw RO', ro.id, ro);
                ro.draw(world.$ctx, world);
            });

        GameCanvas.ctx.drawImage(world.$canvas, 0, 0, screen.x, screen.y);
    };

    update(dt: number, world: World) {
        world.map
            .filter(ro => !ro.isDeleted())
            .forEach(ro => ro.update(dt, world));
    };

    static clearScreen(ctx: CanvasRenderingContext2D, world: World) {
        ctx.translate(-world.pos.x, -world.pos.y); //reset world translate, move back to 0,0

        Renderer.clearRect(ctx, world.screen);

        ctx.translate(world.pos.x, world.pos.y); //reset the translate to w/e the world has been translated to
    }

    private static clearRect(ctx: CanvasRenderingContext2D, screen: IPoint) {
        ctx.clearRect(-10, -10, screen.x + 10, screen.y + 10); //clear off boarder too
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.strokeStyle = 'rgba(0, 153, 255, 1)';
    }
}

export interface IPoint {
    x: number;
    y: number;
}

export class Point implements IPoint {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    normalized() {
        const dis = Math.hypot(this.x, this.y);
        return new Point(this.x/dis, this.y/dis);
    }
    
    multiply(value: number){
        return new Point(this.x * value, this.y * value);
    }

    magnitude() {
        return Math.hypot(this.x, this.y);
    }

    static simple(x: number, y: number): IPoint {
        return { x, y };
    }

    static create(point: IPoint){
        return new Point(point.x, point.y);
    }

    static subtract(a: IPoint, b: IPoint) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return new Point(dx, dy);
    }

    static distance(a: IPoint, b: IPoint) {
        const delta = Point.subtract(a, b);
        return Math.hypot(delta.x, delta.y);
    }

    static dot(a: IPoint, b: IPoint){
        return a.x * b.x + a.y * b.y;
    }

    static direction(a: IPoint, b: IPoint) {
        return Point.subtract(a, b).normalized();
    }

    static lerp(t: number, a: IPoint, b: IPoint){ 
        const sub = Point.subtract(b, a);
        const percent = sub.multiply(t > 1? 1 : t < -1 ? -1 : t);

        return new Point(a.x + percent.x, a.y + percent.y);
    }
}
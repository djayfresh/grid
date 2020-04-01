import { Debug } from './utility';
import { World } from './world';

export enum RenderObjectAttributes {
    Blocking = 1, // collision with
    Holding = 2, // prevent leaving object
    Exiting = 3, // way to leave a holding object
}

export class RenderObject {
    id: number;
    pos: Point;
    layer = 0;
    bounds: any = { w: 0, h: 0 };
    _isVisible = true;
    _deleted = false;
    canvas: HTMLCanvasElement;
    renderer?: Renderer;
    attributes: RenderObjectAttributes[] = [];

    constructor(id: number, x?: number, y?: number) {
        this.id = id;
        this.layer = id;
        this.pos = new Point(x || 0, y || 0);
    }

    setPos(x: number, y: number) {
        this.pos = new Point(x, y);
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

    //should have individual types overwrite
    get center() {
        return new Point(this.pos.x, this.pos.y);
    };

    //Helper function to allow for world translate to to impact drawing an element
    //Use for UI & Player
    drawSticky(ctx: CanvasRenderingContext2D, world: World, drawFunc: () => void) {
        ctx.translate(-world.pos.x, -world.pos.y); //reset world translate, move back to 0,0

        drawFunc();

        ctx.translate(world.pos.x, world.pos.y); //reset the translate to w/e the world has been translated to
    }

    update(_dt: number, _world: World) {

    };

    isVisible() {
        return this._isVisible && !this._deleted;
    };

    isDeleted() {
        return this._deleted;
    }

    setRenderer(renderer: Renderer){
        this.renderer = renderer;
    }
}

export class CanvasRender extends RenderObject {
    constructor(id: number, canvas: HTMLCanvasElement) {
        super(id, 0, 0);
        
        this.canvas = canvas;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
    }
}

export class Renderer {
    renderObjects: RenderObject[] = [];

    draw(ctx: CanvasRenderingContext2D, world: World, layer?: number) {
        this.clearScreen(ctx, world);

        const worldDelta = world.getPosDelta();
        Debug.draw('Render Draw:', world.pos, this.renderObjects, worldDelta);
        ctx.translate(worldDelta.x, worldDelta.y);

        this.renderObjects
            .sort((a, b) => a.layer - b.layer)
            .filter(ro => !layer || ro.layer === layer)
            .filter(ro => ro.isVisible())
            .forEach(ro => {
                Debug.draw('Draw RO', ro.id, ro);
                ro.draw(ctx, world);
            });
    };

    update(dt: number, world: World) {
        this.renderObjects
            .filter(ro => !ro.isDeleted())
            .forEach(ro => ro.update(dt, world));
    };

    add(...renderObjects: RenderObject[]) {
        renderObjects.forEach(ro => {
            if (ro.setRenderer){ 
                ro.setRenderer(this);
            }
        });
        this.renderObjects.push(...renderObjects);
    };

    remove(id: number) {
        this.renderObjects = this.renderObjects.filter(ro => ro.id !== id);
    }

    _removeCanvasObjects() {
        this.renderObjects.filter(ro => !!ro.canvas).forEach(ro => {
            document.removeChild(ro.canvas);
        });
    }

    reset() {
        this.renderObjects = [];
    }

    clearScreen(ctx: CanvasRenderingContext2D, world: World) {
        ctx.translate(-world.pos.x, -world.pos.y); //reset world translate, move back to 0,0

        ctx.clearRect(-10, -10, world.screen.x + 10, world.screen.y + 10); //clear off boarder too
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.strokeStyle = 'rgba(0, 153, 255, 1)';

        ctx.translate(world.pos.x, world.pos.y); //reset the translate to w/e the world has been translated to
    }
}

export class Point {
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
    
    multiply(value){
        return new Point(this.x * value, this.y * value);
    }

    magnitude() {
        return Math.hypot(this.x, this.y);
    }

    static subtract(a: Point, b: Point) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return new Point(dx, dy);
    }

    static distance(a: Point, b: Point) {
        const delta = Point.subtract(a, b);
        return Math.hypot(delta.x, delta.y);
    }

    static dot(a: Point, b: Point){
        return a.x * b.x + a.y * b.y;
    }

    static direction(a: Point, b: Point) {
        return Point.subtract(a, b).normalized();
    }

    static lerp(t: number, a: Point, b: Point){ 
        const sub = Point.subtract(b, a);
        const percent = sub.multiply(t > 1? 1 : t < -1 ? -1 : t);

        return new Point(a.x + percent.x, a.y + percent.y);
    }
}
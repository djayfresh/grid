import { RenderObject, Point } from './renderer';
import { Physics } from './physics';
import { Debug } from './utility';
import { World } from './world';

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

export class Text extends RenderObject {
    text = '';
    font = 'Arial';
    size = '30px';
    color = '#000000';

    constructor(id, text, size, color, font, pos) {
        super(id);

        this.text = text;
        this.size = size || this.size;
        this.font = font || this.font;
        this.color = color || this.color;
        this.pos = pos || new Point(0, 0);
    }

    preDraw(ctx: CanvasRenderingContext2D) {
        ctx.font = `${this.size} ${this.font}`;
        ctx.fillStyle = this.color;
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
    color = '#000000';
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
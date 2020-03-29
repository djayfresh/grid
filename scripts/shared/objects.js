class Rectangle extends RenderObject {
    color = '';
    constructor(id, color, x, y, width, height) {
        super(id, x, y);

        this.color = color;
        this.bounds = { w: width, h: height };
    }

    get center() {
        return new Point(this.pos.x + (this.width/2), this.pos.y + (this.height/2));
    }

    set width(value) {
        this.bounds.w = value;
    }

    get width() {
        return this.bounds.w;
    }

    set height(value) {
        this.bounds.h = value;
    }

    get height() {
        return this.bounds.h;
    }

    draw(ctx, _world) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
    }

    checkViewVisibility(world) {
        this._isVisible = Physics.boxInBounds(this.pos, this.width, this.height, world);

        if (!this._isVisible) {
            Debug.physics("Hidden", this);
        }
    }

    update(_dt, world) {
        this.checkViewVisibility(world);
    }
}

class Text extends RenderObject {
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

    preDraw(ctx) {
        ctx.font = `${this.size} ${this.font}`;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.pos.x, this.pos.y);
    }

    draw(ctx) {
        if (this.canvas) {
            ctx.drawImage(this.canvas, 0, 0);
        }
        else {
            this.preDraw(ctx);
        }
    }
}

class Line extends RenderObject {
    color = '#000000';
    bounds = { x: 0, y: 0 }
    constructor(id, pos, x2, y2, color) {
        super(id);

        this.pos = pos;
        this.bounds = { x: x2, y: y2 };
        this.color = color || this.color;
    }

    preDraw(ctx) {
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.bounds.x, this.bounds.y);
        ctx.strokeStyle = this.color;
        ctx.stroke()
    }

    draw(ctx) {
        if (this.canvas) {
            ctx.drawImage(this.canvas, 0, 0);
        }
        else {
            this.preDraw(ctx);
        }
    }
}

class PreRender extends RenderObject {
    constructor(id, canvas) {
        super(id, 0, 0);
        
        this.canvas = canvas;
    }

    draw(ctx) {
        ctx.drawImage(this.canvas, this.pos.x, this.pos.y);
    }
}

define(['./renderer', './utility', './physics'], function (render) {
    return {
        Rectangle,
        Text,
        Line,
        Point: render.Point,
    }
});
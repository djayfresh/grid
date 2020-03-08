define(['./renderer'], function(render) {
    class Rectangle extends render.RenderObjet {
        color = '';
        constructor(id, color, width, height){
            this.id = id;
            this.color = color;
            this.bounds = { w: width, h: height };
        }

        get width() {
            return this.bounds.w;
        }

        get height() {
            return this.bounds.h;
        }
        
        draw(ctx, _world){
            ctx.fillStyle = this.color;
            ctx.fillRect(this.pox.x, this.pox.y, this.width, this.height);
        }
    }

    class Text extends render.RenderObjet {
        text = '';
        font = 'Arial';
        size = '30px';
        color = '#000000';

        constructor(id, text, size, color, font){
            this.id = id;
            this.text = text;
            this.size = size || this.size;
            this.font = font || this.font;
            this.color = color || this.color;
        }

        draw(ctx){
            ctx.font = `${this.size} ${this.font}`;
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.pos.x, this.pox.y);
        }
    }

    class Line extends render.RenderObjet {
        color = '#000000';
        bounds = { x = 0, y = 0 }
        constructor(id, pos, x2, y2, color) {
            this.id = id;
            this.pos = pos;
            this.bounds = { x = x2, y = y2 };
            this.color = color || this.color;
        }

        draw(ctx) {
            ctx.moveTo(this.pox.x, this.pox.y);
            ctx.lineTo(this.bounds.x, this.bounds.y);
            ctx.strokeStyle = this.color;
            ctx.stroke()
        }
    }

    return {
        Rectangle,
        Text,
        Line,
    }
});
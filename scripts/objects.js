define(['./renderer', './utility'], function(render, utility) {
    class Rectangle extends render.RenderObject {
        color = '';
        constructor(id, color, width, height){
            super(id);

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
            ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        }
    }

    class Text extends render.RenderObject {
        text = '';
        font = 'Arial';
        size = '30px';
        color = '#000000';

        constructor(id, text, size, color, font){
            super(id);

            this.text = text;
            this.size = size || this.size;
            this.font = font || this.font;
            this.color = color || this.color;
        }

        draw(ctx){
            ctx.font = `${this.size} ${this.font}`;
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.pos.x, this.pos.y);
        }
    }

    class Line extends render.RenderObject {
        color = '#000000';
        bounds = { x: 0, y: 0 }
        constructor(id, pos, x2, y2, color) {
            super(id);
            
            this.pos = pos;
            this.bounds = { x: x2, y: y2 };
            this.color = color || this.color;
        }

        draw(ctx) {
            ctx.moveTo(this.pos.x, this.pos.y);
            ctx.lineTo(this.bounds.x, this.bounds.y);
            ctx.strokeStyle = this.color;
            ctx.stroke()
        }
    }

    class Player extends Rectangle {
        constructor() {
            super(utility.ID_CONST.Player, '#002500', 5, 5);
        }

        draw(ctx, world) {
            translate(0, 0); //draw the player in the center of the screen, always
            ctx.fillStyle = this.color;
            ctx.fillRect((250 - this.width), (250 - this.height), this.width, this.height);
            translate(world.pos.x, world.pos.y); //reset the translate to w/e the world pos is. 
        }

        update(_dt, world){

        }
    }

    return {
        Rectangle,
        Text,
        Line,
        Player,
        Point: render.Point
    }
});
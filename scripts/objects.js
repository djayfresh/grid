    class Rectangle extends RenderObject {
        color = '';
        constructor(id, color, x, y, width, height){
            super(id, x, y);

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

        checkViewVisibility(world) {
            this._isVisible = Physics.boxInBounds(this.pos, this.width, this.height, world);

            if (!this._isVisible){
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

    class Line extends RenderObject {
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
            super(ID_CONST.Player, '#004600', 0, 0, 10, 10);
        }

        draw(ctx, world) {
            this.drawSticky(ctx, world, () => {
                ctx.fillStyle = this.color;
                const posX = ((world.screen.x/2) - (this.width/2));
                const posY = ((world.screen.y/2) - (this.height/2));
                Debug.draw('Player', 'x', posX, 'y', posY, 'w', this.width, 'h', this.height);
                ctx.fillRect(posX, posY, this.width, this.height);
            })
        }

        update(_dt, _world){

        }
    }

    class Bullet extends Rectangle {
        force = { x: 0, y: 0};

        constructor(startPos, force) {
            super(ID_CONST.Bullet, '#8e8702', startPos.x, startPos.y, 3, 3);
            
            this.force = force;
        }
        
        update(dt, world) {
            this.setPos(this.pos.x + ( dt * this.force.x), this.pos.y + (dt * this.force.y)); 

            this.checkViewVisibility(world); 
            if(!this._isVisible) { 
                this._deleted = true; 
            } 
        }
    }

define(['./renderer', './utility', './physics'], function(render) {
    return {
        Rectangle,
        Text,
        Line,
        Player,
        Point: render.Point,
        Bullet
    }
});
class Rectangle extends RenderObject {
    constructor(id, color, x, y, width, height) {
        super(id, x, y);

        this.color = color;
        this.bounds = { w: width, h: height };
    }

    get center() {
        return new Point(this.pos.x + (this.width/2), this.pos.y + (this.height/2));
    }

    get width() {
        return this.bounds.w;
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
    constructor(id, text, size, color, font) {
        super(id);

        this.text = text || '';
        this.size = size || '30px';
        this.font = font || 'Arial';
        this.color = color || '#000000';
    }

    draw(ctx) {
        ctx.font = `${this.size} ${this.font}`;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.pos.x, this.pos.y);
    }
}

class Line extends RenderObject {
    constructor(id, pos, x2, y2, color) {
        super(id);

        this.pos = pos;
        this.bounds = { x: x2, y: y2 };
        this.color = color || '#000000';
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

    get center() {
        return new Point(((this.screen.x / 2) - (this.width / 2)), ((this.screen.y / 2) - (this.height / 2)))
    }

    draw(ctx, world) {
        this.screen = world.screen;

        this.drawSticky(ctx, world, () => {
            ctx.fillStyle = this.color;
            const posX = this.center.x;
            const posY = this.center.y;
            Debug.draw('Player', 'x', posX, 'y', posY, 'w', this.width, 'h', this.height);
            ctx.fillRect(posX, posY, this.width, this.height);
        })
    }

    update(_dt, _world) {

    }
}

class Bullet extends Rectangle {
    constructor(startPos, force, range, damage) {
        super(ID_CONST.Bullet, '#8e8702', startPos.x, startPos.y, 3, 3);

        this.force = force;
        this.lifeSpan = range || 500;
        this.lifeTime = 0;
        this.damage = damage || 1;
    }

    update(dt, world) {
        this.lifeTime += dt;
        const worldMove = KeyboardManager.moves();

        this.setPos(this.pos.x + (dt * this.force.x) - worldMove.x, this.pos.y + (dt * this.force.y) - worldMove.y);

        this.checkViewVisibility(world);
        if (!this._isVisible || this.lifeTime >= this.lifeSpan || this.damage <= 0) {
            this._deleted = true;
        }
    }
}

class Enemy extends Rectangle {
    constructor(color, x, y, speed, health){
        super(ID_CONST.Enemy, color, x, y, 10, 10);
        this.speed = speed;
        this.health = health;
    }

    update(dt, world){

        const bullets = this._renderer.renderObjects.filter(ro => ro.id === ID_CONST.Bullet && !ro.isDeleted());

        bullets.forEach(b => {
            const dis = Point.distance(b.pos, this.center);

            if (dis < 4){ //dis ^2
                if (this.health > b.damage){
                    b._deleted = true;
                    this.health -= b.damage;
                }
                else if (this.health < b.damage){
                    b.damage -= this.health;
                    this._deleted = true;
                }
                else {
                    b._deleted = true;
                    this._deleted = true;
                }
            }
        });

        //bullet killed us
        if (this._deleted){
            return;
        }

        const toPlayer = Point.subtract(world.player.center, world.toWorldPositition(this.pos));
        const norm = toPlayer.normalized();
        Debug.physics('To Player', toPlayer, 'norm', norm);

        if (toPlayer.magnitude() <= world.player.width) { //TODO: Replace with Physics collision check
            //player hit
            this._deleted = true;
            return;
        }

        this.setPos(this.pos.x + (norm.x * this.speed), this.pos.y + (norm.y * this.speed));
    }

    //only some objects need this, probably /shrug
    setRenderer(renderer){
        this._renderer = renderer;
    }
}

class Spawner extends Rectangle {

    constructor(color, x, y, rate, enemySpeed){
        super(ID_CONST.Spawner, color, x, y, 20, 20);

        this.rate = rate || 2000; //ms
        this.enemySpeed = enemySpeed || 1;
        this.spawnPoint = new Point(x + (this.width/2), y + (this.height/2));
        
        this.spawnCount = 0;
        this.currentSpawnTime = 0;
        this.maxSpawns = 10; //should get reset each day
    }

    update(dt, world){
        this.currentSpawnTime += dt;
        Debug.time('Spawn Time', this.currentSpawnTime);

        if (this.currentSpawnTime >= this.rate && this.spawnCount < this.maxSpawns) {
            this.spawn(dt, world);
            this.currentSpawnTime = 0;
        }
    }

    //only some objects need this, probably /shrug
    setRenderer(renderer){
        this._renderer = renderer;
    }

    spawn(dt, world) {
        this.spawnCount++;
        const spawnPoint = this.spawnPoint;
        const enemyHealth = Math.range(1, 5);
        const enemy = new Enemy('#820027', spawnPoint.x, spawnPoint.y, (this.enemySpeed / enemyHealth) + 0.5, enemyHealth);
        Debug.game('Spawn ', spawnPoint, "Enemy ", enemy);

        this._renderer.add(enemy);
    }
}

define(['./renderer', './utility', './physics'], function (render) {
    return {
        Rectangle,
        Text,
        Line,
        Player,
        Point: render.Point,
        Bullet,
        Spawner
    }
});
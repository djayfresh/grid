import { Rectangle } from '../shared/objects';
import { ID_CONST, Debug, KeyboardManager, KEY_CONST, Mouse } from '../shared/utility';
import { Point, Renderer } from '../shared/renderer';
import { World } from '../shared/world';
import { ZombieWorld } from './world';
import { Colors } from '../shared/colors';
import { Weapon, FiringInfo } from '../shared/weapons';
import { GenerateGuns } from './weapons';
import { GameCanvas } from '../shared/canvas';

export class Player extends Rectangle {    
    pos: Point; //Player POS is always relative to the screen pos, not the world movement;
    weaponIndex = 0;
    activeWeapon: Weapon;
    weapons: Weapon[];
    weaponSwitched = false;

    moveToCenter: number = 0;
    moveToCenterRate: number = 0.006;
    attachPlayerToCenter: boolean = false;
    playerFreeMoveChanged: boolean = false;
    freeMovePos: Point;

    constructor() {
        super(ID_CONST.Player, Colors.Player, 0, 0, 10, 10);

        const guns = GenerateGuns();
        this.weapons = Object.keys(guns).map(k => guns[k]);
        this.SetWeapon(this.weapons[Object.keys(this.weapons)[this.weaponIndex]]);
    }

    //player position adjusted for world transform if not centered
    actualCenterPos(world: ZombieWorld) {
        const pos = new Point(this.pos.x + (this.width / 2), this.pos.y + (this.height / 2));

        pos.x -= world.pos.x;
        pos.y -= world.pos.y;

        return pos;
    }

    draw(ctx: CanvasRenderingContext2D, world: ZombieWorld) {
        if (!this.attachPlayerToCenter){
            const move = KeyboardManager.moves();
            this.pos.x += -move.x;
            this.pos.y += -move.y;
        }

        this.drawSticky(ctx, world, () => this._drawPlayer(ctx));
    }

    _drawPlayer(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        Debug.draw('Player', 'x', this.pos.x, 'y', this.pos.y, 'w', this.width, 'h', this.height);
    }

    update(dt: number, world: ZombieWorld) {
        if(KeyboardManager.isKeyDown(KEY_CONST.j)){
            if (!this.playerFreeMoveChanged){
                this.playerFreeMoveChanged = true;
                this.attachPlayerToCenter = !this.attachPlayerToCenter;
                this.moveToCenter = 0;

                this.freeMovePos = new Point(this.pos.x, this.pos.y);
                if (!this.attachPlayerToCenter){
                    this.pos = new Point(this.pos.x, this.pos.y);
                }
            }
        }
        else {
            this.playerFreeMoveChanged = false;
        }

        if (this.attachPlayerToCenter && this.moveToCenter <= 1){
            const pos = new Point(world.screen.x / 2, world.screen.y / 2);
            pos.x -= this.width / 2;
            pos.y -= this.height / 2;
            console.log("Lerp", this.pos, this.moveToCenter, this.freeMovePos, pos);

            this.pos = Point.lerp(this.moveToCenter, this.freeMovePos, pos);

            this.moveToCenter += this.moveToCenterRate;
        }
        else if (this.attachPlayerToCenter){
            world.playerAttachedToCenter = true;
        }
        else if (!this.attachPlayerToCenter){
            world.playerAttachedToCenter = false;
        }

        if (KeyboardManager.isKeyDown(KEY_CONST.x)) {
            if (!this.weaponSwitched) {
                this.weaponSwitched = true;
                this.SwitchWeapons();
            }
        }
        else {
            this.weaponSwitched = false;
        }

        if (this.activeWeapon) {
            this.activeWeapon.update(dt, world);
        }
    }

    SwitchWeapons() {
        const weaponIds = Object.keys(this.weapons);
        const weaponId = weaponIds[++this.weaponIndex % weaponIds.length];
        Debug.game('Switched Weapons', this.activeWeapon, weaponIds, weaponId);
        this.SetWeapon(this.weapons[weaponId]);
    }

    SetWeapon(weapon: Weapon) {
        this.activeWeapon = weapon;
        this.activeWeapon.getFiringInfo = (mouse: Mouse, world: ZombieWorld) => this._onWeaponFired(mouse, world);
        this.activeWeapon.fired = bullet => this.renderer.add(bullet);
    }

    _onWeaponFired(mouse: Mouse, world: ZombieWorld): FiringInfo {
        const direction = Point.subtract(mouse.pos, this.pos).normalized();

        const playerCenter = this.actualCenterPos(world);
        Debug.mouse('direction', direction, 'mouse', mouse.pos, 'player', playerCenter, "player pos", this.pos);

        return { pos: playerCenter, direction: direction };
    }
}

export class Bullet extends Rectangle {
    lifeSpan = 500;
    lifeTime = 0;
    damage = 1;
    force = { x: 0, y: 0 };

    constructor(startPos: Point, options: Partial<Bullet>) {
        super(ID_CONST.Bullet, Colors.Bullet, startPos.x, startPos.y, 3, 3);

        Object.assign(this, options);
    }

    update(dt: number, world: World) {
        this.lifeTime += dt;
        const worldMove = world.getPosDelta();

        this.setPos(this.pos.x + (dt * this.force.x) - worldMove.x, this.pos.y + (dt * this.force.y) - worldMove.y);

        this.checkViewVisibility(world);
        if (!this._isVisible || this.lifeTime >= this.lifeSpan || this.damage <= 0) {
            this._deleted = true;
        }
    }
}

export class Enemy extends Rectangle {
    speed = 1;
    health = 1;
    _renderer;

    constructor(color, x, y, speed, health){
        super(ID_CONST.Enemy, color, x, y, 10, 10);
        this.speed = speed;
        this.health = health;
    }

    update(_dt: number, world: ZombieWorld){

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

        const toPlayer = Point.subtract(world.player.pos, world.toWorldPosition(this.pos));
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

export class Spawner extends Rectangle {
    spawnPoint = new Point(0, 0);
    rate = 2000; //ms
    spawnCount = 0;
    enemySpeed = 1;
    currentSpawnTime = 0;
    maxSpawns = 10; //should get reset each day
    _renderer;

    constructor(color: string, x: number, y: number, options?: Partial<Spawner>){
        super(ID_CONST.Spawner, color, x, y, 20, 20);

        Object.assign(this, options || {});
        this.spawnPoint = new Point(x + (this.width/2), y + (this.height/2));
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
    setRenderer(renderer: Renderer){
        this._renderer = renderer;
    }

    spawn(_dt: number, _world: World) {
        this.spawnCount++;
        const spawnPoint = this.spawnPoint;
        const enemyHealth = Math.range(1, 5);
        const enemy = new Enemy(Colors.Enemy, spawnPoint.x, spawnPoint.y, (this.enemySpeed / enemyHealth) + 0.5, enemyHealth);
        Debug.game('Spawn ', spawnPoint, "Enemy ", enemy);

        this._renderer.add(enemy);
    }
}
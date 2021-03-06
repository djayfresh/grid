import { Rectangle, GameObjectAttributes, StatusBar, IDestroyable, IDestroyer } from '../shared/objects';
import { ID_CONST, Debug, KeyboardManager, KEY_CONST, Mouse } from '../shared/utility';
import { World } from '../shared/world';
import { ZombieWorld } from './world';
import { Colors } from '../shared/colors';
import { Weapon, FiringInfo } from '../shared/weapons';
import { GenerateGuns } from './weapons';
import { Point, IPoint } from '../shared/physics';
import { Renderer } from '../shared/renderer';
import { GameEventQueue } from '../shared/event-queue';
import { WeaponFoundEvent, EnemyHitPlayerEvent, EnemyKilledEvent } from './events';

export class Player extends Rectangle {    
    pos: Point; //Player POS is always relative to the screen pos, not the world movement;
    weaponIndex = 0;
    activeWeapon: Weapon;
    weapons: Weapon[];
    weaponSwitched = false;

    moveToCenterTime = 0;
    moveToCenter: number = 1;
    moveToCenterRate: number = 1000;
    attachPlayerToCenter: boolean = false;
    playerFreeMoveChanged: boolean = false;
    freeMovePos: Point;

    constructor() {
        super(ID_CONST.Player, Colors.Player, {x: 0, y: 0}, {x: 10, y: 10});

        const guns = GenerateGuns();
        this.weapons = Object.keys(guns).map(k => guns[k]);
        this.SetWeapon(this.weapons[Object.keys(this.weapons)[this.weaponIndex]]);

        GameEventQueue.subscribe(WeaponFoundEvent, ID_CONST.Player, found => {
            this.weapons.push(found.data.weapon);
        });
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
            const move = KeyboardManager.moves(false);

            world.validateMove(move, {
                x: this.pos.x,
                y: this.pos.y,
                w: this.width,
                h: this.height
            }, {
                x: world.pos.x,
                y: world.pos.y
            }
            , (x, y) => {
                this.pos.x -= x - world.pos.x;
                this.pos.y -= y - world.pos.y;
            });
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
                this.moveToCenterTime = 0;

                this.freeMovePos = new Point(this.pos.x, this.pos.y);
                if (!this.attachPlayerToCenter){
                    this.pos = new Point(this.pos.x, this.pos.y);
                }
            }
        }
        else {
            this.playerFreeMoveChanged = false;
        }

        if (this.attachPlayerToCenter && this.moveToCenter < 1){
            this.moveToCenterTime += dt;

            const pos = Point.simple(world.canvas.x / 2, world.canvas.y / 2);
            pos.x -= this.width / 2;
            pos.y -= this.height / 2;
            // const dist = Point.subtract(pos, this.freeMovePos).magnitude();

            this.pos = Point.lerp(this.moveToCenter, this.freeMovePos, pos);

            this.moveToCenter = this.moveToCenterTime / this.moveToCenterRate;
        }
        else if (this.attachPlayerToCenter){
            const pos = new Point(world.canvas.x / 2, world.canvas.y / 2);
            pos.x -= this.width / 2;
            pos.y -= this.height / 2;
            this.pos = pos;
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
    }

    _onWeaponFired(mouse: Mouse, world: ZombieWorld): FiringInfo {
        const direction = Point.subtract(mouse.pos, this.pos).normalized();

        const playerCenter = this.actualCenterPos(world);
        Debug.mouse('direction', direction, 'mouse', mouse.pos, 'player', playerCenter, "player pos", this.pos);

        return { pos: playerCenter, direction: direction };
    }
}

export class Bullet extends Rectangle implements IDestroyer {
    lifeSpan = 500;
    lifeTime = 0;
    damage = 1;
    force = { x: 0, y: 0 };

    constructor(startPos: Point, options: Partial<Bullet>) {
        super(ID_CONST.Bullet, Colors.Bullet, startPos, {x: 3, y: 3});

        Object.assign(this, options);
    }

    update(dt: number, world: World) {
        this.lifeTime += dt;
        const worldMove = world.getPosDelta();

        this.setPos(this.pos.x + (dt * this.force.x) - worldMove.x, this.pos.y + (dt * this.force.y) - worldMove.y);

        this.checkViewVisibility(world);
        if (!this.isVisible() || this.lifeTime >= this.lifeSpan || this.damage <= 0) {
            this.delete();
        }
    }
}

export class Enemy extends Rectangle implements IDestroyable {
    speed = 1;
    health = 1;
    totalHealth: number;
    statusBar: StatusBar;
    siteRange: number;
    _renderer;

    constructor(color: string, pos: IPoint, speed: number, health: number, siteRange: number){
        super(ID_CONST.Enemy, color, pos, {x: 10, y: 10});
        this.speed = speed;
        this.health = health;
        this.totalHealth = health;
        this.siteRange = siteRange;
        
        this.statusBar = new StatusBar(Colors.Enemy, {x: -5, y: 5}, {x: 20, y: 4}, health, health);
        this.statusBar._attachedTo = this;
    }
    
    draw(ctx: CanvasRenderingContext2D, world: World){
        super.draw(ctx, world);

        if (this.health < this.totalHealth) {
            this.statusBar.draw(ctx, world);
        }
    }

    update(dt: number, world: ZombieWorld){

        //bullet killed us
        if (this.isDeleted()){
            return;
        }

        const toPlayer = Point.subtract(world.player.pos, world.toWorldPosition(this.pos));
        const norm = toPlayer.normalized();
        Debug.physics('To Player', toPlayer, 'norm', norm);

        const distanceToPlayer = toPlayer.magnitude();
        if (distanceToPlayer <= world.player.width) { //TODO: Replace with Physics collision check
            //player hit
            GameEventQueue.notify(new EnemyHitPlayerEvent(this));
            this.delete();
            return;
        }
        else if (distanceToPlayer <= this.siteRange){
            this.setPos(this.pos.x + (norm.x * this.speed), this.pos.y + (norm.y * this.speed));
        }

        this.statusBar._currentStatus = this.health;
        this.statusBar.update(dt, world);
    }
}

export class Spawner extends Rectangle implements IDestroyable {
    private _spawnPoint = new Point(0, 0);
    rate = 2000; //ms
    spawnCount = 0;
    enemySpeed = 0.5;
    minEnemyHealth = 1;
    maxEnemyHealth = 5;
    private _currentSpawnTime = 0;
    maxSpawns = 10; //should get reset each day
    totalHealth: number = 100;
    health: number = 100;
    statusBar: StatusBar;

    constructor(color: string, pos: IPoint, options?: Partial<Spawner>){
        super(ID_CONST.Spawner, color, pos, {x: 20, y: 20});

        Object.assign(this, options || {});
        this.attributes.push(GameObjectAttributes.Blocking);
        this._spawnPoint = new Point(pos.x + (this.width/2), pos.y + (this.height/2));

        this.statusBar = new StatusBar(Colors.Enemy, {x: 5, y: 5}, {x: 10, y: 4}, this.totalHealth, this.totalHealth);
        this.statusBar._attachedTo = this;
    }

    draw(ctx: CanvasRenderingContext2D, world: World) {
        super.draw(ctx, world);

        if (this.health < (this.totalHealth * 0.9)){
            this.statusBar.draw(ctx, world);
        }
    }

    update(dt: number, world: World){
        this._currentSpawnTime += dt;
        Debug.time('Spawn Time', this._currentSpawnTime);

        if (this._currentSpawnTime >= this.rate && this.spawnCount < this.maxSpawns) {
            this.spawn(dt, world);
            this._currentSpawnTime = 0;
        }

        this.statusBar.setStatus(this.health);
        this.statusBar.update(dt, world);
    }

    spawn(_dt: number, world: World) {
        this.spawnCount++;
        const spawnPoint = this._spawnPoint;
        const enemyHealth = Math.range(this.minEnemyHealth, this.maxEnemyHealth);
        const enemy = new Enemy(Colors.Enemy, spawnPoint, (this.enemySpeed / enemyHealth) + 0.5, enemyHealth, 200);
        Debug.game('Spawn ', spawnPoint, "Enemy ", enemy);

        world.add(enemy);
    }
}
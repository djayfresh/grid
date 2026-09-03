import { Rectangle, RenderObject, GameObjectAttributes, StatusBar, TiledImage, IDestroyable, IDestroyer } from '../shared/objects';
import { ID_CONST, Debug, KeyboardManager, KEY_CONST, Mouse } from '../shared/utility';
import { World } from '../shared/world';
import { ZombieWorld } from './world';
import { Colors } from '../shared/colors';
import { Weapon, FiringInfo } from '../shared/weapons';
import { SceneImage } from '../shared/images';
import { Point, IPoint } from '../shared/physics';
import { GameEventQueue } from '../shared/event-queue';
import { WeaponFoundEvent, EnemyHitPlayerEvent, ObjectiveReachedEvent } from './events';

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

    baseMoveSpeed = 0.06;
    moveSpeedMultiplier: number = 1;

    health = 100;
    maxHealth = 100;
    hudBar: StatusBar;

    constructor(weapons: Weapon[]) {
        super(ID_CONST.Player, Colors.ZombiePlayer, {x: 0, y: 0}, {x: 10, y: 10});

        this.weapons = weapons;
        this.SetWeapon(this.weapons[this.weaponIndex]);

        this.hudBar = new StatusBar(Colors.Enemy, {x: 0, y: 0}, {x: 120, y: 10}, this.maxHealth, this.health);

        GameEventQueue.subscribe(WeaponFoundEvent, ID_CONST.Player, found => {
            this.weapons.push(found.data.weapon);
        });
    }

    get moveSpeed() {
        return this.baseMoveSpeed * this.moveSpeedMultiplier;
    }

    //dt-scaled movement vector for the given input frame; normalizes diagonal speed to match cardinal speed
    moveDelta(dt: number, reversed: boolean = false): IPoint {
        const move = KeyboardManager.moves(reversed);
        const diagonal = move.x !== 0 && move.y !== 0;
        const scale = this.moveSpeed * dt * (diagonal ? Math.SQRT1_2 : 1);

        return { x: move.x * scale, y: move.y * scale };
    }

    takeDamage(amount: number): number {
        this.health = Math.max(0, this.health - amount);
        this.hudBar.setStatus(this.health);
        return this.health;
    }

    //player position adjusted for world transform if not centered
    actualCenterPos(world: ZombieWorld) {
        const pos = new Point(this.pos.x + (this.width / 2), this.pos.y + (this.height / 2));

        pos.x -= world.pos.x;
        pos.y -= world.pos.y;

        return pos;
    }

    draw(ctx: CanvasRenderingContext2D, world: ZombieWorld) {
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

            const move = this.moveDelta(dt, false);

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
    speed = 1; //px/ms
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
            this.setPos(this.pos.x + (norm.x * this.speed * dt), this.pos.y + (norm.y * this.speed * dt));
        }

        this.statusBar._currentStatus = this.health;
        this.statusBar.update(dt, world);
    }
}

export class Spawner extends Rectangle implements IDestroyable {
    protected spawnPoint = new Point(0, 0);
    rate = 2000; //ms
    spawnCount = 0;
    enemySpeed = 0.026; //px/ms
    minEnemyHealth = 1;
    maxEnemyHealth = 5;
    enemySiteRange = 300;
    private _currentSpawnTime = 0;
    maxSpawns = 10; //should get reset each day
    totalHealth: number = 30;
    health: number = 30;
    statusBar: StatusBar;

    constructor(color: string, pos: IPoint, options?: Partial<Spawner>, bounds: IPoint = {x: 20, y: 20}){
        super(ID_CONST.Spawner, color, pos, bounds);

        Object.assign(this, options || {});
        if (options && options.totalHealth !== undefined && options.health === undefined) {
            this.health = this.totalHealth;
        }
        this.attributes.push(GameObjectAttributes.Blocking);
        this.spawnPoint = this.computeSpawnPoint();

        this.statusBar = new StatusBar(Colors.Enemy, {x: 5, y: 5}, {x: 10, y: 4}, this.totalHealth, this.totalHealth);
        this.statusBar._attachedTo = this;
    }

    //subclasses (eg. SpawnerHouse) can move where enemies actually emerge from
    protected computeSpawnPoint(): Point {
        return new Point(this.pos.x + (this.width / 2), this.pos.y + (this.height / 2));
    }

    draw(ctx: CanvasRenderingContext2D, world: World) {
        super.draw(ctx, world);

        if (this.health < this.totalHealth){
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
        const enemyHealth = Math.range(this.minEnemyHealth, this.maxEnemyHealth);
        const speed = this.enemySpeed + ((this.maxEnemyHealth - enemyHealth) * 0.002);
        const enemy = new Enemy(Colors.Enemy, this.spawnPoint, speed, enemyHealth, this.enemySiteRange);
        Debug.game('Spawn ', this.spawnPoint, "Enemy ", enemy);

        world.add(enemy);
    }
}

//a spawner reskinned as a small house - destroy it to stop the flow, or leave it standing and risk zombies piling up
export class SpawnerHouse extends Spawner {
    constructor(pos: IPoint, options?: Partial<Spawner>){
        super(Colors.SpawnerRoof, pos, options, {x: 40, y: 40});

        //the base Spawner's bar position sits under where the roof band is drawn below - move it clear
        this.statusBar.pos = new Point(5, 12);
    }

    protected computeSpawnPoint(): Point {
        //enemies emerge from the "door" rather than dead-center
        return new Point(this.pos.x + (this.width / 2), this.pos.y + this.height - 4);
    }

    draw(ctx: CanvasRenderingContext2D, world: World) {
        //body + decorations first, then the health bar last so nothing paints over it
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);

        ctx.fillStyle = Colors.Environment;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, 8); //roof band

        ctx.fillStyle = Colors.Wall;
        ctx.fillRect(this.pos.x + (this.width / 2) - 4, this.pos.y + this.height - 12, 8, 12); //door

        if (this.health < this.totalHealth){
            this.statusBar.draw(ctx, world);
        }
    }
}

//road/path segments that hold the player - overlap them fully at junctions so `stillHeld` lets the player cross
export class Road extends TiledImage {
    constructor(img: SceneImage, id: number, pos: IPoint, bounds: IPoint){
        super(img, id, pos, bounds);
        this.attributes.push(GameObjectAttributes.Holding);
    }
}

export class Path extends Rectangle {
    constructor(id: number, pos: IPoint, bounds: IPoint){
        super(id, Colors.Path, pos, bounds);
        this.attributes.push(GameObjectAttributes.Holding);
    }
}

//destructible obstacle blocking a route until shot down. Doesn't extend Wall - Wall is for plain,
//indestructible obstacles (see House); this is the one place that actually wants IDestroyable
export class Barricade extends Rectangle implements IDestroyable {
    totalHealth: number;
    health: number;
    statusBar: StatusBar;

    constructor(pos: IPoint, bounds: IPoint, totalHealth: number){
        super(ID_CONST.Barricade, Colors.Barricade, pos, bounds);

        this.totalHealth = totalHealth;
        this.health = totalHealth;
        this.attributes.push(GameObjectAttributes.Blocking);

        this.statusBar = new StatusBar(Colors.Environment, {x: 0, y: 0}, {x: 20, y: 4}, totalHealth, totalHealth);
        this.statusBar._attachedTo = this;
    }

    draw(ctx: CanvasRenderingContext2D, world: World){
        super.draw(ctx, world);

        //show damage immediately - a barricade should read as responsive right away
        if (this.health < this.totalHealth) {
            this.statusBar.draw(ctx, world);
        }
    }

    update(dt: number, world: World){
        this.statusBar._currentStatus = this.health;
        this.statusBar.update(dt, world);
    }
}

//round goal - reach it to advance
export class Objective extends Rectangle {
    reached = false;

    constructor(pos: IPoint, bounds: IPoint){
        super(ID_CONST.Objective, Colors.Flag, pos, bounds);
    }

    update(_dt: number, world: ZombieWorld) {
        if (this.reached || this.isDeleted() || !world.player) {
            return;
        }

        const toPlayer = Point.subtract(world.player.pos, world.toWorldPosition(this.pos));
        if (toPlayer.magnitude() <= (world.player.width + this.width) / 2) {
            this.reached = true;
            GameEventQueue.notify(new ObjectiveReachedEvent(this));
        }
    }
}

//screen-fixed health/round/level HUD, drawn last so it renders above everything else
export class ZombieHud extends RenderObject {
    constructor() {
        super(ID_CONST.Hud);
    }

    draw(ctx: CanvasRenderingContext2D, world: ZombieWorld) {
        this.drawSticky(ctx, world, () => this._drawHud(ctx, world));
    }

    private _drawHud(ctx: CanvasRenderingContext2D, world: ZombieWorld) {
        const player = world.player;
        if (!player) {
            return;
        }

        const barX = 10;
        const barY = 10;
        player.hudBar.pos = new Point(barX, barY);
        player.hudBar.setStatus(player.health);
        player.hudBar.draw(ctx, world);

        const spawnersRemaining = world.map
            .ofType<Spawner>(ro => ro instanceof Spawner)
            .filter(s => !s.isDeleted()).length;

        ctx.fillStyle = Colors.White;
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Round ${world.round}`, barX, barY + 30);
        ctx.fillText(`Level ${world.stats.level + 1}  XP ${world.stats.xp}`, barX, barY + 48);
        ctx.fillText(`Spawners left: ${spawnersRemaining}`, barX, barY + 66);
    }
}

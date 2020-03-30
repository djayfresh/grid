import { Game } from '../shared/game';
import { ZombieWorld } from './world';
import { Weapon } from '../shared/weapons';
import { Mouse, Debug, KeyboardManager, KEY_CONST, ID_CONST } from '../shared/utility';
import { GameCanvas } from '../shared/canvas';
import { Physics } from '../shared/physics';
import { Point } from '../shared/renderer';
import { Bullet } from './objects';
import { Rectangle } from '../shared/objects';
import { GenerateGuns } from './weapons';
import { LevelConst } from '../lobby/lobby';

class ZombieGame extends Game {
    world: ZombieWorld;
    mouse: Mouse;
    weaponIndex = 0;
    activeWeapon: Weapon;
    weapons: Weapon[];
    weaponSwitched = false;

    constructor() {
        super();
    }

    SwitchWeapons() {
        const weaponIds = Object.keys(this.weapons);
        const weaponId = weaponIds[++this.weaponIndex % weaponIds.length];
        Debug.game('Switched Weapons', this.activeWeapon, weaponIds, weaponId);
        this.SetWeapon(this.weapons[weaponId]);
    }

    SetWeapon(weapon) {
        this.activeWeapon = weapon;
        this.activeWeapon.onFire = (weapon, mouse) => this._onWeaponFired(weapon, mouse);
    }

    Resize() {
        GameCanvas.height = GameCanvas.width;
        if (this.world){
            this.world.setScreen(GameCanvas.width, GameCanvas.height);
            this.world.setCanvas(GameCanvas.canvas.clientWidth, GameCanvas.canvas.clientHeight);
        }
    }

    _frame(dt) {
        super._frame(dt);

        Debug.time('DT:', dt);
        const worldMove = KeyboardManager.moves();

        if (KeyboardManager.isKeyDown(KEY_CONST.x)) {
            if (!this.weaponSwitched) {
                this.weaponSwitched = true;
                this.SwitchWeapons();
            }
        }
        else {
            this.weaponSwitched = false;
        }

        //move the world
        const worldX = this.world.pos.x;
        const worldY = this.world.pos.y;
        const move = { x: worldX + worldMove.x, y: worldY + worldMove.y };
        if (this.checkStreets(move)) {
            this.world.setPos(move.x, move.y);
        }
        else if (this.checkStreets({ x: worldX - worldMove.x, y: move.y })) {
            Debug.game("valid 1", worldMove);
            this.world.setPos(worldX, move.y);
        }
        else if (this.checkStreets({ x: move.x, y: worldY - worldMove.y })) {
            Debug.game("valid 2", worldMove);
            this.world.setPos(move.x, worldY);
        }
        else {
            Debug.game("No valid moves", worldMove);
            this.world.setPos(worldX, worldY);
        }

        if (this.activeWeapon) {
            this.activeWeapon.update(dt);
        }

        this.renderer.draw(GameCanvas.ctx, this.world);
        this.renderer.update(dt, this.world);
    }

    checkStreets(newPos: {x: number, y: number}) {
        const streets = this.world.map.filter(ro => ro.id === ID_CONST.Street) as Rectangle[];

        const playerX = this.world.player.actualPos.x;// + (this.world.player.width / 2);
        const playerY = this.world.player.actualPos.y;// + (this.world.player.height / 2);

        return streets.some(s => {
            return Physics.insideBounds(playerX, playerY, this.world.player.width, this.world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        });
    }

    _onWeaponFired(weapon: Weapon, mouse: Mouse) {
        const force = Point.subtract(mouse.pos, this.world.canvasCenter).normalized().multiply(0.06);
        const bullet = new Bullet(this.world.worldCenter, { force, lifeSpan: weapon.range, damage: weapon.damage });
        Debug.mouse("Fire", mouse.pos, "c", this.world.worldCenter);
        this.renderer.add(bullet);
    }

    _init() {
        super._init();

        if (!this._initialized){
            this.world = new ZombieWorld(LevelConst.Zombie);
            this.Resize();
        
            KeyboardManager.track(KEY_CONST.down);
            KeyboardManager.track(KEY_CONST.up);
            KeyboardManager.track(KEY_CONST.left);
            KeyboardManager.track(KEY_CONST.right);
            KeyboardManager.track(KEY_CONST.x);
            KeyboardManager.track(KEY_CONST.r);
        }
        

        const guns = GenerateGuns();
        this.weapons = Object.keys(guns).map(k => guns[k]);

        this.renderer.reset();
        this.renderer.add(...this.world.generateMap());
        this.SetWeapon(this.weapons[Object.keys(this.weapons)[this.weaponIndex]]);

        GameCanvas.canvas.style.cursor = 'default';

    }

    Restart() {
        super.Restart();

        this.world.setPos(0, 0);

        this.Resize();
    }
}

export var zombie = new ZombieGame();
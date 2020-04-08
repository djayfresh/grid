import { Mouse, Debug } from './utility';
import { GameCanvas } from './canvas';
import { World } from './world';
import { Point } from './physics';
import { Bullet } from '../zombie/objects';

export interface FiringInfo {
    pos: Point;
    direction: Point;
}

export class Weapon {
    mouse: Mouse;
    rate = 500; //ms
    range: number;
    damage = 1;
    _lastShot = 0;
    ammo = 0;
    maxAmmo = 0;
    bulletSpeed = 0.06;

    getFiringInfo: (mouse: Mouse, world: World) => FiringInfo = () => null;

    constructor(getFiringInfo: (mouse: Mouse, world: World) => FiringInfo, options: Partial<Weapon>) {
        this.mouse = new Mouse(0, GameCanvas.canvas, true); //TODO: Remove mouse

        this.getFiringInfo = getFiringInfo || this.getFiringInfo;

        Object.assign(this, options);

        this.Reload();
    }

    update(dt: number, world: World) {
        if (this.mouse.isDown){ //TODO: Track in a static mouse manager
            if (this._lastShot === 0 || this._lastShot >= this.rate){
                if (this.maxAmmo === 0 || this.ammo > 0) {
                    this.onFire(this.getFiringInfo(this.mouse, world), world);
                    this._lastShot = 1;
                }
            }
            this._lastShot += dt;
        }
        else {
            this._lastShot = 0;
        }
    }

    onFire(firingInfo: FiringInfo, world: World) {
        const bullet = new Bullet(firingInfo.pos, { force: firingInfo.direction.multiply(this.bulletSpeed), lifeSpan: this.range, damage: this.damage });
        world.add(bullet);
    }

    Reload() {
        this.ammo = this.maxAmmo;
    }
}
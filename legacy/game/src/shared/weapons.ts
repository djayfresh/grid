import { Mouse, Debug } from './utility';
import { GameCanvas } from './canvas';
import { World } from './world';
import { Point, IPoint } from './physics';
import { Bullet } from '../zombie/objects';

export interface FiringInfo {
    pos: Point;
    direction: Point;
    velocity?: IPoint; //shooter's current world velocity (px/ms), blended into the bullet so it still
                        //flies straight toward the aim point instead of drifting as the camera pans
}

export class Weapon {
    mouse: Mouse;
    rate = 500; //ms
    rateMultiplier: number = 1;
    range: number;
    damage = 1;
    _lastShot = 0;
    ammo = 0;
    maxAmmo = 0;
    bulletSpeed = 0.1; //must clear the player's own top move speed (~0.093 px/ms at max level), or bullets fired while running just stack up next to the player instead of pulling away

    getFiringInfo: (mouse: Mouse, world: World) => FiringInfo = () => null;

    constructor(getFiringInfo: (mouse: Mouse, world: World) => FiringInfo, options: Partial<Weapon>) {
        this.mouse = new Mouse(0, GameCanvas.canvas, true); //TODO: Remove mouse

        this.getFiringInfo = getFiringInfo || this.getFiringInfo;

        Object.assign(this, options);

        this.Reload();
    }

    update(dt: number, world: World) {
        if (this.mouse.isDown){ //TODO: Track in a static mouse manager
            if (this._lastShot === 0 || this._lastShot >= (this.rate * this.rateMultiplier)){
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
        const aim = firingInfo.direction.multiply(this.bulletSpeed);
        const velocity = firingInfo.velocity || { x: 0, y: 0 };

        const force = { x: aim.x + velocity.x, y: aim.y + velocity.y };
        const bullet = new Bullet(firingInfo.pos, { force, lifeSpan: this.range, damage: this.damage });
        world.add(bullet);
    }

    Reload() {
        this.ammo = this.maxAmmo;
    }
}
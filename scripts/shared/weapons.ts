import { Mouse } from './utility';
import canvas = require('./canvas');

export class Weapon {
    mouse: Mouse;
    rate = 500; //ms
    range: number;
    damage = 1;
    _lastShot = 0;
    ammo = 0;
    maxAmmo = 0;
    onFire: (weapon: Weapon, mouse: Mouse) => void = () => {};

    constructor(onFire: (weapon: Weapon, mouse: Mouse) => void, options: Partial<Weapon>) {
        this.mouse = new Mouse(0, canvas.canvas);

        this.onFire = onFire || this.onFire;

        Object.assign(this, options);

        this.Reload();
    }

    update(dt) {
        if (this.mouse.isDown){
            if (this._lastShot === 0 || this._lastShot >= this.rate){
                if (this.maxAmmo === 0 || this.ammo > 0) {
                    this.onFire(this, this.mouse);
                    this._lastShot = 1;
                }
            }
            this._lastShot += dt;
        }
        else {
            this._lastShot = 0;
        }
    }

    Reload() {
        this.ammo = this.maxAmmo;
    }
}
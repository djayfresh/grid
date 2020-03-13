class Weapon {
    mouse;
    rate = 500; ms
    damage = 1;
    _lastShot = 0;
    ammo = 0;
    maxAmmo = 0;
    onFire = () => {};

    constructor(onFire, options) {
        this.mouse = new Mouse(0, canvas);

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

define(['./canvas', './utility'], function() {
    return {
        pistol: new Weapon(null, { rate: 200, range: 200 }),
        machineGun: new Weapon(null, { rate: 50, range: 700 }),
        sniper: new Weapon(null, { rate: 500, range: 7000, damage: 10 })
    }
})
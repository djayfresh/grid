class Weapon {
    constructor(onFire, options) {
        this.mouse = new Mouse(0, canvas);

        this.rate = 500; //ms
        this.damage = 1;
        this._lastShot = 0;
        this.ammo = 0;
        this.maxAmmo = 0;

        this.onFire = onFire || (() => {});

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
        pistol: new Weapon(null, { rate: 200, range: 1000 }),
        machineGun: new Weapon(null, { rate: 75, range: 1700, damage: 0.5 }),
        sniper: new Weapon(null, { rate: 750, range: 7000, damage: 10 })
    }
})
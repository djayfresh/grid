define(['../shared/weapons'], function() {
    return {
        pistol: new Weapon(null, { rate: 200, range: 1000 }),
        machineGun: new Weapon(null, { rate: 75, range: 1700, damage: 0.5 }),
        sniper: new Weapon(null, { rate: 750, range: 7000, damage: 10 })
    }
})
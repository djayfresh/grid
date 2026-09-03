import { Weapon } from '../shared/weapons'

export function GenerateGuns() {
    //range is bullet lifespan in ms, not distance - values scaled down to hold travel distance
    //(bulletSpeed * range) roughly constant now that bulletSpeed went from 0.06 to 0.1 px/ms
    return {
        pistol: new Weapon(null, { rate: 200, range: 600 }),
        machineGun: new Weapon(null, { rate: 75, range: 1020, damage: 0.5 }),
        sniper: new Weapon(null, { rate: 750, range: 4200, damage: 10 })
    }
}
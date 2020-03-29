import { Weapon } from '../shared/weapons'

export var pistol = new Weapon(null, { rate: 200, range: 1000 });
export var machineGun = new Weapon(null, { rate: 75, range: 1700, damage: 0.5 });
export var sniper = new Weapon(null, { rate: 750, range: 7000, damage: 10 });
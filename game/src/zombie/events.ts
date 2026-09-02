import { BaseEvent } from '../shared/event-queue';
import { GameEvent } from '../shared/events';
import { Weapon } from '../shared/weapons';
import { IPoint } from '../shared/physics';
import { Enemy, Objective, Barricade, Spawner } from './objects';

//TODO: Player inventory management, weapons, items (health packs, food, water)
interface WeaponFound {
    weapon: Weapon,
    pos: IPoint,
}

@GameEvent('Events.Zombie.WeaponFound')
export class WeaponFoundEvent extends BaseEvent<WeaponFound> {}

@GameEvent('Events.Zombie.EnemyKilled')
export class EnemyKilledEvent extends BaseEvent<Enemy> {}

@GameEvent('Events.Zombie.EnemyHitPlayer')
export class EnemyHitPlayerEvent extends BaseEvent<Enemy> {}

@GameEvent('Events.Zombie.ObjectiveReached')
export class ObjectiveReachedEvent extends BaseEvent<Objective> {}

@GameEvent('Events.Zombie.BarricadeDestroyed')
export class BarricadeDestroyedEvent extends BaseEvent<Barricade> {}

@GameEvent('Events.Zombie.SpawnerDestroyed')
export class SpawnerDestroyedEvent extends BaseEvent<Spawner> {}

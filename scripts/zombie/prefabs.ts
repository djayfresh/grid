import { Prefab } from '../shared/objects';
import { IPoint } from '../shared/physics';

export class House extends Prefab {
    constructor(id: number, pos: IPoint, bounds: IPoint){
        super(id, pos, bounds);

        this.buildHouse();
    }

    private buildHouse() {
        // this.add(...);
    }
}
import { Prefab, Rectangle, GameObjectAttributes, Wall } from '../shared/objects';
import { IPoint } from '../shared/physics';
import { Colors } from '../shared/colors';

export class House extends Prefab {
    constructor(id: number, pos: IPoint, bounds: IPoint){
        super(id, pos, bounds);

        //the whole footprint is held, so a player who enters through the door can walk the
        //interior freely - the actual walls (Blocking, below) are what stop them, not this
        this.attributes.push(GameObjectAttributes.Holding);

        this.buildHouse();
    }

    private buildHouse() {
        const floor = new Rectangle(1, Colors.Wall, {x: 0, y: 0}, {x: 200, y: 200});
        this.add(floor);

        const walls: {x: number, y: number, w: number, h: number}[] = [
            {x: 0, y: 0, w: 200, h: 2}, // Top
            {x: 198, y: 0, w: 2, h: 200}, // Right
            {x: 0, y: 198, w: 200, h: 2}, // Bottom
            {x: 0, y: 0, w: 2, h: 40 }, // Left - top door
            {x: 0, y: 80, w: 2, h: 120 }, // Left - bottom door
            {x: 0, y: 50, w: 60, h: 2 }, // Kitchen - Bottom
            {x: 60, y: 0, w: 2, h: 15 }, // Kitchen - top door
            {x: 60, y: 35, w: 2, h: 17 }, // Kitchen - bottom door
        ];

        walls.forEach(wall => {
            this.add(new Wall(2, Colors.Black, { x: wall.x, y: wall.y }, { x: wall.w, y: wall.h }));
        });
    }
}
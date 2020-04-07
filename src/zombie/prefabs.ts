import { Prefab, Rectangle, IRectangle, GameObjectAttributes, Wall } from '../shared/objects';
import { IPoint, Physics } from '../shared/physics';
import { Colors } from '../shared/colors';

export class House extends Prefab {
    constructor(id: number, pos: IPoint, bounds: IPoint){
        super(id, pos, bounds);

        this.buildHouse();
    }

    private buildHouse() {
        const floor = new Rectangle(1, Colors.Wall, {x: 0, y: 0}, {x: 200, y: 200});
        this.add(floor);

        const walls: {x: number, y: number, w: number, h: number}[] = [
            {x: 0, y: 0, w: 200, h: 2}, // Top
            {x: 198, y: 0, w: 2, h: 200}, // Right
            {x: 0, y: 198, w: 200, h: 2}, // Bottom
            {x: 0, y: 0, w: 2, h: 50 }, // Left - top door
            {x: 0, y: 70, w: 2, h: 130 }, // Left - bottom door
            {x: 0, y: 50, w: 60, h: 2 }, // Kitchen - Bottom
            {x: 60, y: 0, w: 2, h: 15 }, // Kitchen - top door
            {x: 60, y: 35, w: 2, h: 17 }, // Kitchen - bottom door
        ];

        walls.forEach(wall => {
            const wallRect = new Wall(2, Colors.Black, { x: wall.x, y: wall.y }, { x: wall.w, y: wall.h }, 20);
            wallRect.attributes.push(GameObjectAttributes.Blocking);
            this.add(wallRect);
        });
    }
}
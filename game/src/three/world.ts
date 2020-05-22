import { World } from "../shared/world";
import { Rectangle, Circle } from "../shared/objects";
import { Board } from "../grid/board";
import { Color } from "../shared/colors";

export class ThreeWorld extends World {
    level: number = 0;
    next: number = 0;
    
    //Replace with proper extraction
    die: Rectangle;
    
    //Replace with proper extraction
    dice: Rectangle;

    generateMap() {
        this.map = [];
const grid: Board = new Board(5);

const cup = new Circle(0, Color.randomColor(), {x: -2, y: -1}, 36);

        this.add({... cup, id: 10, bounds: {x: 2, y: cup.bounds.y}} as Circle);
        this.add({... cup, id: 20, bounds: {x: cup.bounds.x, y: 1}} as Circle);
        this.add({... cup, id: 30, bounds: {x: 2, y: 1}} as Circle);
        this.add(cup);

        //might want to use Card (extract shared methods)
        //Adding ability to set faces
        //Flip & Random
        this.die = new Rectangle(0, '#4D4D4D', {x: 0, y:0}, {x:  /* Put a var here */ 50, y: 50});
        this.dice = new Rectangle(1, '#4D4D4D', {x: 0, y: 0}, { x: 50, y: 50});

        this.add(this.die);
        this.add(this.dice);

        return this.map;
    }
}
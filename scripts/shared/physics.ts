import { Point } from './renderer';
import { World } from './world';

export class Physics {
    static collision(x: number, y: number, w: number, h: number, x1: number, y1: number, w1: number, h1: number){
        if (x < x1 + w1 &&
            x + w > x1 &&
            y < y1 + h1 &&
            y + h > y1) {
                return true;
        }
        
        return false;
    }

    static outOfBounds(x: number, y: number, w: number, h: number, x1: number, y1: number, w1: number, h1: number){
        return (x1 > (x + w) || (x1 + w1) < x || (y1 < (y + h) || (y1 + h1 > y)))
    }

    static insideBounds(x: number, y: number, w: number, h: number, x1: number, y1: number, w1: number, h1: number){
        return x > x1 && (x + w) < (x1 + w1) && y > y1 && (y + h) < (y1 + h1);
    }
    
    static boxInBounds(pos: Point, w: number, h: number, world: World, sticky: boolean = false) {   
        const tx = sticky ? 0 : world.pos.x;
        const ty = sticky ? 0 : world.pos.y;

        return Physics.collision(pos.x + tx, pos.y + ty, w, h, 0, 0, world.screen.x, world.screen.y);
    }
    
    static inBounds(x: number, y: number, world: World, sticky: boolean = false){
        const tx = sticky ? 0 : world.pos.x;
        const ty = sticky ? 0 : world.pos.y;
    
        return Physics.collision(x + tx, y + ty, 0, 0, 0, 0, world.screen.x, world.screen.y)
    }
    
    static lerp(value: number, x: number, y: number){
        return (1 - value) * x + value * y;
    }
}
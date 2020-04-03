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

export interface IPoint {
    x: number;
    y: number;
}

export class Point implements IPoint {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    normalized() {
        const dis = Math.hypot(this.x, this.y);
        return new Point(this.x/dis, this.y/dis);
    }
    
    multiply(value: number){
        return new Point(this.x * value, this.y * value);
    }

    magnitude() {
        return Math.hypot(this.x, this.y);
    }

    static simple(x: number, y: number): IPoint {
        return { x, y };
    }

    static create(point: IPoint){
        return new Point(point.x, point.y);
    }

    static subtract(a: IPoint, b: IPoint) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return new Point(dx, dy);
    }

    static distance(a: IPoint, b: IPoint) {
        const delta = Point.subtract(a, b);
        return Math.hypot(delta.x, delta.y);
    }

    static dot(a: IPoint, b: IPoint){
        return a.x * b.x + a.y * b.y;
    }

    static direction(a: IPoint, b: IPoint) {
        return Point.subtract(a, b).normalized();
    }

    static lerp(t: number, a: IPoint, b: IPoint){ 
        const sub = Point.subtract(b, a);
        const percent = sub.multiply(t > 1? 1 : t < -1 ? -1 : t);

        return new Point(a.x + percent.x, a.y + percent.y);
    }
}
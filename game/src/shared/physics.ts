import { World } from './world';
import { GameObject, IRectangle, IGameObject } from './objects';

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

    static simpleCollision(object: IGameObject, object2: IGameObject, collisionBuffer: number = 4, origin: IPoint = {x: 0, y: 0}, origin2: IPoint = {x: 0, y: 0}): boolean {
        if ((object as IRectangle).width !== undefined && (object2 as IRectangle).width !== undefined){
            const rect = (object as any) as IRectangle;
            const bRect = (object2 as any) as IRectangle;

            if (Physics.collision(rect.pos.x + origin.x, rect.pos.y + origin.y, rect.width, rect.height, bRect.pos.x + origin2.x, bRect.pos.y + origin2.y, bRect.width, bRect.height)) {
                return true;
            }
        }
        else {
            const dis = Point.distance({x: object2.pos.x + origin2.x, y: object2.pos.y + origin2.y}, {x: object.center.x + origin.x, y: object.center.y + origin.y});

            if (dis < collisionBuffer){ //dis ^2
                return true;
            }
        }

        return false;
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
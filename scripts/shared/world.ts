import { Point, RenderObject } from './renderer';

export class World {
    pos = new Point(0, 0);
    lastPos = new Point(0, 0);
    origin = new Point(0, 0);
    map: RenderObject[] = [];
    screen = { x: 500, y: 500 };
    canvas = { x: 500, y: 500 };
    player: RenderObject = null;
    moved = false;
    id: number;

    constructor(id: number){
        this.id = id;
        
        this.pos = new Point(0, 0);
        this.lastPos = new Point(0, 0);
        this.origin = new Point(0, 0);
    }

    setMap(map: RenderObject[]){
        this.map = map;
    }

    setPlayer(player: RenderObject){
        this.player = player;
    }

    setScreen(x: number, y: number) {
        this.screen = { x, y };
    }

    setPos(x, y) {
        this.moved = this.pos.x !== x || this.pos.y !== y;
        this.origin = new Point(this.pos.x - x, this.pos.y - y);
        this.lastPos = this.pos;

        this.pos = new Point(x, y);
    }

    getPosDelta() {
        return Point.subtract(this.pos, this.lastPos);
    }

    get center() {
        return new Point(this.screen.x / 2, this.screen.y / 2);
    }

    get canvasCenter() {
        return new Point(this.canvas.x / 2, this.canvas.y / 2);
    }

    get worldCenter() {
        return this.toWorldOffset(this.center); // new Point(this.center.x - this.pos.x, this.center.y - this.pos.y);
    }

    toWorldPositition(a: Point){
        return new Point(a.x + this.pos.x, a.y + this.pos.y);
    }

    toWorldOffset(a: Point){
        return new Point(a.x - this.pos.x, a.y - this.pos.y);
    }

    generateMap(): RenderObject[] {
        //placeholder
        return [];
    }
}
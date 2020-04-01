import { Point, RenderObject, RenderObjectAttributes, IPoint } from './renderer';
import { ImageSource, ImageManager } from './images';
import { Rectangle } from './objects';
import { Physics } from './physics';
import { Debug } from './utility';

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

    images: ImageSource[] = [];
    loadedImages: ImageSource[] = [];

    constructor(id: number){
        this.id = id;
        
        this.pos = new Point(0, 0);
        this.lastPos = new Point(0, 0);
        this.origin = new Point(0, 0);
    }

    addImage(img: ImageSource){
        const $img = ImageManager.addImage(img);
        if ($img){
            this.images.push(img);
        }
    }

    setMap(map: RenderObject[]){
        this.map = map;
    }

    setPlayer(player: RenderObject){
        this.player = player;
    }

    setCanvas(x: number, y: number){
        this.canvas = {x, y};
    }

    setScreen(x: number, y: number) {
        this.screen = { x, y };
    }

    setPos(x: number, y: number) {
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

    toWorldPosition(a: Point){
        return new Point(a.x + this.pos.x, a.y + this.pos.y);
    }

    toWorldOffset(a: Point){
        return new Point(a.x - this.pos.x, a.y - this.pos.y);
    }

    generateMap(): RenderObject[] {
        //placeholder
        return [];
    }

    validateMove(move: IPoint, rect: {x: number, y: number, w: number, h: number}, origin: IPoint, validMove: (x: number, y: number) => void) {
        //move the world
        const worldMove = { x: origin.x + move.x, y: origin.y + move.y };

        if (this.noCollisions(origin, worldMove, rect)) {
            validMove(worldMove.x, worldMove.y);
        }
        else if (this.noCollisions(origin, { x: origin.x - move.x, y: worldMove.y }, rect)) {
            Debug.game("valid 1", move);
            validMove(origin.x, worldMove.y);
        }
        else if (this.noCollisions(origin, { x: worldMove.x, y: origin.y - move.y }, rect)) {
            Debug.game("valid 2", move);
            validMove(worldMove.x, origin.y);
        }
        else {
            Debug.game("No valid moves", move);
            validMove(origin.x, origin.y);
        }
    }

    noCollisions(origin: IPoint, newPos: IPoint, rect: {x: number, y: number, w: number, h: number}) {
        //TODO: Make sure collision detection works for all object types
        const blockers = this.map.filter(ro => ro.attributes.indexOf(RenderObjectAttributes.Blocking) >= 0) as Rectangle[];

        const rectBlocked = blockers.some(s => {
            return Physics.collision(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        });

        if (rectBlocked){
            return false;
        }

        const holders = this.map.filter(ro => ro.attributes.indexOf(RenderObjectAttributes.Holding) >= 0) as Rectangle[];

        const rectLeavingHolding = holders.some(s => {
            const wasInside = Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + origin.x, s.pos.y + origin.y, s.width, s.height);
            return wasInside && !Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        });

        if (rectLeavingHolding){
            const exits = this.map.filter(ro => ro.attributes.indexOf(RenderObjectAttributes.Exiting) >= 0) as Rectangle[];
            //moving into an exit
            const rectInExit = exits.some(s => Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height))
            return rectInExit;
        }

        return true;
    }
}
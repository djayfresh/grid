import { ImageSource, ImageManager } from './images';
import { Rectangle, GameObject, RenderObject, GameObjectAttributes, IRectangle, IGameObject, RenderText } from './objects';
import { Physics, Point, IPoint } from './physics';
import { Debug } from './utility';
import { GameCanvas } from './canvas';
import { Renderer } from './renderer';
import { GameEventQueue } from './event-queue';
import { GameResizeEvent } from './events';
import { Colors } from './colors';

export class World {
    pos = new Point(0, 0);
    lastPos = new Point(0, 0);
    origin = new Point(0, 0);
    map: IGameObject[] = [];
    screen = { x: 500, y: 500 };
    canvas = { x: 500, y: 500 };
    player: GameObject = null;
    moved = false;
    id: number;
    $canvas: HTMLCanvasElement;
    $ctx: CanvasRenderingContext2D;

    images: ImageSource[] = [];
    loadedImages: ImageSource[] = [];

    constructor(id: number){
        this.id = id;
        
        this.pos = new Point(0, 0);
        this.lastPos = new Point(0, 0);
        this.origin = new Point(0, 0);
        this.$canvas = GameCanvas.createCanvas(GameCanvas.canvas.width, GameCanvas.canvas.height);
        this.$ctx = this.$canvas.getContext('2d');

        this.subscribe();
    }

    subscribe() {
        GameEventQueue.subscribe(GameResizeEvent, this.id, resizeEvent => {
            console.log("On resize event");
            this.setScreen(resizeEvent.data.screen.x, resizeEvent.data.screen.y);
            this.setCanvas(resizeEvent.data.canvas.x, resizeEvent.data.canvas.y);
        });
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

    reset() {
        this._removeCanvasObjects();
        Renderer.clearScreen(this.$ctx, this);
        this.map = [];

        this.pos = new Point(0, 0);
        this.lastPos = this.pos;
        this.origin = this.pos;
        this.moved = false;
    }

    setPlayer(player: RenderObject){
        this.player = player;
    }

    setCanvas(x: number, y: number){
        this.canvas = {x, y};
        this.$canvas.width = x;
        this.$canvas.height = y;
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

    generateMap() {
        //placeholder
    }

    validateMove(move: IPoint, rect: {x: number, y: number, w: number, h: number}, origin: IPoint, validMove: (x: number, y: number) => void, invalidMove?: () => void) {
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
        else if (!!invalidMove) {
            invalidMove();
        }
    }

    noCollisions(origin: IPoint, newPos: IPoint, rect: {x: number, y: number, w: number, h: number}) {
        //TODO: Other types of collision besides Rectangles
        const rectangles = this.map.ofType<IRectangle>((ro: any) => (ro as IRectangle).width !== undefined);

        const blockers = rectangles.filter(ro => ro.attributes.indexOf(GameObjectAttributes.Blocking) >= 0);

        const rectBlocked = blockers.some(s => {
            return Physics.collision(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        });

        if (rectBlocked){
            return false;
        }

        const holders = rectangles.filter(ro => ro.attributes.indexOf(GameObjectAttributes.Holding) >= 0);

        const rectLeavingHolding = holders.filter(s => {
            const wasInside = Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + origin.x, s.pos.y + origin.y, s.width, s.height);
            return wasInside && !Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
        });

        if (rectLeavingHolding && rectLeavingHolding.length > 0){
            if (rectLeavingHolding.some(ro => ro.attributes.indexOf(GameObjectAttributes.NoExit) >= 0)) {
                return false;
            }
            
            const exits = rectangles.filter(ro => ro.attributes.indexOf(GameObjectAttributes.Exiting) >= 0);
            //moving into an exit
            const rectInExit = exits.some(s => Physics.insideBounds(rect.x, rect.y, rect.w, rect.h, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height))
            return rectInExit;
        }

        return true;
    }

    add(...renderObjects: IGameObject[]) {
        this.map.push(...renderObjects);
    };

    remove(id: number) {
        this.map = this.map.filter(ro => ro.id !== id);
    }
    
    _removeCanvasObjects() {
        this.map.ofType<RenderObject>(ro => ro instanceof RenderObject)
        .filter(ro => !!ro.canvas).forEach(ro => {
            delete ro.canvas;
        });
    }
    

    setRoundStart(roundNumber: number, score?: number) {
        const renderObjects = [];

        renderObjects.push(new Rectangle(0, Colors.White, {x: 0, y: 0}, {x: GameCanvas.width, y: GameCanvas.height}));
        renderObjects.push(new RenderText(1, { text: `Round Starting - ${roundNumber}`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, GameCanvas.height/3) }));
        
        if (score !== undefined){
            renderObjects.push(new RenderText(1, { text: `Score: ${score}`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, GameCanvas.height/2) }));
        }
        
        this.setMap(renderObjects);
    }

    setGameOver(score: number){
        const renderObjects = [];
        
        renderObjects.push(new Rectangle(0, Colors.White, {x: 0, y: 0}, {x: GameCanvas.width, y: GameCanvas.height}));
        renderObjects.push(new RenderText(1, { text: `Game Over`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, GameCanvas.height/3) }));
        renderObjects.push(new RenderText(1, { text: `Score: ${score}`, color: Colors.Black, centered: true, pos: new Point(GameCanvas.width/2, GameCanvas.height/2) }));
        
        this.setMap(renderObjects);
    }
}
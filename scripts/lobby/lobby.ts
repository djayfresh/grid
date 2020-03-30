import { Game } from '../shared/game';
import { World } from '../shared/world';
import { GameCanvas } from '../shared/canvas';
import { Physics } from '../shared/physics';
import { Debug, Mouse, ID_CONST } from '../shared/utility';
import { Rectangle, RenderText } from '../shared/objects';
import { Point, CanvasRender } from '../shared/renderer';
import { Colors } from '../shared/colors';

export var LevelConst = { Grid: 0, Zombie: 1, HighScore: 2, Memory: 3 };
export var Levels = [LevelConst.Grid, LevelConst.Zombie, LevelConst.HighScore, LevelConst.Memory];

export interface MenuOption {
    id: number;
    action: () => void;
    text: string;
}

export class Lobby extends Game {
    world: World;
    menuOptions: MenuOption[];
    mouse: Mouse;
    wasDownLastFrame: boolean;

    constructor(world: World) {
        super();
        this.world = world;
    }

    Resize() {
        GameCanvas.height = GameCanvas.width;
        this.world.setScreen(GameCanvas.width, GameCanvas.height);
    }

    SetMenu(menuOptions: MenuOption[]) {
        this.menuOptions = menuOptions;
    }

    _selectMenuOption(id: number) {
        this.menuOptions.forEach(mo => {
            if (mo.id === id) {
                mo.action();
            }
        })
    }

    _frame(dt: number) {
        super._frame(dt);
        
        Debug.time('DT:', dt);

        let isMouseOverButon = false;
        //hover mouse
        this.renderer.renderObjects.filter(ro => Levels.indexOf(ro.id) >= 0).forEach((ro: Rectangle) => {
            if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                Debug.game("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);

                //button highlight
                ro.color = Colors.HoverDark;
                isMouseOverButon = true;
            }
            else {
                ro.color = Colors.White;
            }
        });

        if (isMouseOverButon) {
            GameCanvas.canvas.style.cursor = 'pointer';
        }
        else {
            GameCanvas.canvas.style.cursor = 'default';
        }

        if (this.mouse.isDown) {
            this.wasDownLastFrame = true;
        }
        else {
            if (this.wasDownLastFrame) {
                this.renderer.renderObjects.filter(ro => Levels.indexOf(ro.id) >= 0).forEach((ro: Rectangle) => {
                    ro.color = Colors.White;

                    if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                        setTimeout(() => {
                            this._selectMenuOption(ro.id);
                        }, 100);
                    }
                });
            }
            this.wasDownLastFrame = false;
        }

        this.renderer.draw(GameCanvas.ctx, this.world);
        this.renderer.update(dt, this.world);
    }

    _init() {
        super._init();
        this.score = 0;

        this.renderer.reset();
        this._buildLobbyButtons();
        this.wasDownLastFrame = false;

        if (!this._initialized) {
            this.mouse = new Mouse(0, GameCanvas.canvas, true);
        }
    }

    Restart() {
        super.Restart();

        this.world.setPos(0, 0);

        this.Resize();
    }

    _buildLobbyButtons() {
        const left = GameCanvas.width * 0.25;
        const buttonH = 50;
        const buttonW = GameCanvas.width / 2;

        const height = (GameCanvas.height / this.menuOptions.length) - (buttonH + 10);

        const t_canvas = CanvasRender.createCanvas(GameCanvas.width, GameCanvas.height);

        const preRender = new CanvasRender(100, t_canvas);

        this.menuOptions.forEach((mo, i) => {

            const textOffset = mo.text.length > 8 ? 10 : 0; //Do real pixel centering
            const y = (height * i) + (buttonH * i) + height;
            const x = left - textOffset;
            const btn = new Rectangle(mo.id, Colors.White, x, y, buttonW + (textOffset * 2), buttonH);
            this.renderer.add(btn);

            const btnTextPos = new Point(btn.pos.x + buttonW / 2, btn.pos.y + buttonH * 0.75);
            const btnText = new RenderText(100, {text: mo.text, color: Colors.Black, pos: btnTextPos, centered: true});
            btnText.setContext(t_canvas);
        });

        this.renderer.add(preRender);

        this.renderer.add(new Rectangle(ID_CONST.Ground, Colors.Black, 0, 0, GameCanvas.width, GameCanvas.height));

        const cubeSizes = 60;
        const colorCubes = [Colors.Player, Colors.Flag, Colors.PowerUp, Colors.Enemy, Colors.Wall];

        const genCords: {x: number, y: number}[] = []

        const cubeSub = cubeSizes/3;
        const cubeW = GameCanvas.width - cubeSub;
        const cubeH = GameCanvas.height - cubeSub;

        colorCubes.forEach(color => {
            let ranX = Math.range(-cubeSub, cubeW);
            let ranY = Math.range(-cubeSub, cubeH);

            while(genCords.some(c => Physics.collision(ranX, ranY, cubeSizes, cubeSizes, c.x, c.y, cubeSizes, cubeSizes))){
                ranX = Math.range(-cubeSub, cubeW);
                ranY = Math.range(-cubeSub, cubeH);
            }

            genCords.push({x: ranX, y: ranY});

            this.renderer.add(new Rectangle(-10, color, ranX, ranY, cubeSizes, cubeSizes));
        });
    }
}


export var lobby = new Lobby(new World(0));
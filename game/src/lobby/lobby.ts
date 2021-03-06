import { Game } from '../shared/game';
import { World } from '../shared/world';
import { GameCanvas } from '../shared/canvas';
import { Physics, Point, IPoint } from '../shared/physics';
import { Debug, Mouse, ID_CONST } from '../shared/utility';
import { Rectangle, RenderText } from '../shared/objects';
import { CanvasRender } from '../shared/objects';
import { Colors } from '../shared/colors';
import { Levels } from './levels';

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

    constructor() {
        super();
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

        let isMouseOverButton = false;
        //hover mouse
        this.world.map.filter(ro => Levels.indexOf(ro.id) >= 0).forEach((ro: Rectangle) => {
            if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                Debug.game("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);

                //button highlight
                ro.color = Colors.HoverDark;
                isMouseOverButton = true;
            }
            else {
                ro.color = Colors.White;
            }
        });

        if (isMouseOverButton) {
            GameCanvas.canvas.style.cursor = 'pointer';
        }
        else {
            GameCanvas.canvas.style.cursor = 'default';
        }
    }

    onMouseDown() {
        this.world.map.filter(ro => Levels.indexOf(ro.id) >= 0).forEach((ro: Rectangle) => {
            ro.color = Colors.White;

            if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                setTimeout(() => {
                    this._selectMenuOption(ro.id);
                }, 100);
            }
        });
    }

    _init() {
        super._init();
        this.score = 0;

        if (!this._initialized) {
            this.world = new World(0);
            this.mouse = new Mouse(0, GameCanvas.canvas, true);
            
            this.Resize();
        }

        this.world.reset();
        this._buildLobbyButtons();

        this.wasDownLastFrame = false;
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

        const t_canvas = GameCanvas.createCanvas(GameCanvas.width, GameCanvas.height);

        const preRender = new CanvasRender(100, t_canvas);

        this.menuOptions.forEach((mo, i) => {

            const textOffset = mo.text.length > 8 ? mo.text.length + 4 : 0; //Do real pixel centering
            const y = (height * i) + (buttonH * i) + height;
            const x = left - textOffset;
            const btn = new Rectangle(mo.id, Colors.White, {x, y}, {x: buttonW + (textOffset * 2), y: buttonH});
            this.world.add(btn);

            const btnTextPos = new Point(btn.pos.x + (buttonW / 2) + textOffset, btn.pos.y + buttonH * 0.75);
            const btnText = new RenderText(100, {text: mo.text, color: Colors.Black, pos: btnTextPos});
            btnText.setContext(t_canvas);
        });

        this.world.add(preRender);

        this.world.add(new Rectangle(ID_CONST.Ground, Colors.Black, {x: 0, y: 0}, {x: GameCanvas.width, y: GameCanvas.height}));

        const cubeSizes = 60;
        const colorCubes = [Colors.Player, Colors.Flag, Colors.PowerUp, Colors.Enemy, Colors.Wall];

        const genCords: IPoint[] = []

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

            this.world.add(new Rectangle(-10, color, {x: ranX, y: ranY}, {x: cubeSizes, y: cubeSizes}));
        });
    }
}


export var lobby = new Lobby();
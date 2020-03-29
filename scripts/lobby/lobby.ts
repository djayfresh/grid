import { Game } from '../shared/game';
import { World } from '../shared/world';
import { canvas, ctx } from '../shared/canvas';
import { Physics } from '../shared/physics';
import { Debug, Mouse, ID_CONST } from '../shared/utility';
import { Rectangle, Text } from '../shared/objects';
import { Point } from '../shared/renderer';

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
        canvas.height = canvas.width;
        this.world.setScreen(canvas.width, canvas.height);
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
        Debug.time('DT:', dt);

        let isMouseOverButon = false;
        //hover mouse
        this.renderer.renderObjects.filter(ro => Levels.indexOf(ro.id) >= 0).forEach((ro: Rectangle) => {
            if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                Debug.game("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);

                //button highlight
                ro.color = '#333333';
                isMouseOverButon = true;
            }
            else {
                ro.color = '#FFFFFF';
            }
        });

        if (isMouseOverButon) {
            canvas.style.cursor = 'pointer';
        }
        else {
            canvas.style.cursor = 'default';
        }

        if (this.mouse.isDown) {
            this.wasDownLastFrame = true;
        }
        else {
            if (this.wasDownLastFrame) {
                this.renderer.renderObjects.filter(ro => Levels.indexOf(ro.id) >= 0).forEach((ro: Rectangle) => {
                    ro.color = '#FFFFFF';

                    if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                        setTimeout(() => {
                            this._selectMenuOption(ro.id);
                        }, 100);
                    }
                });
            }
            this.wasDownLastFrame = false;
        }

        this.renderer.draw(ctx, this.world);
        this.renderer.update(dt, this.world);
    }

    _init() {
        super._init();

        this.renderer.reset();
        this._buildLobbyButtons();
        this.wasDownLastFrame = false;

        this.mouse = new Mouse(0, canvas, true);
    }

    Restart() {
        super.Restart();

        this.world.setPos(0, 0);

        this.Resize();
    }

    _buildLobbyButtons() {
        const left = canvas.width * 0.25;
        const buttonH = 50;
        const buttonW = canvas.width / 2;
        const white = '#FFFFFF';
        const black = '#000000';

        const height = (canvas.height / this.menuOptions.length) - (buttonH + 10);

        this.menuOptions.forEach((mo, i) => {

            const textOffset = mo.text.length > 8 ? 10 : 0; //Do real pixel centering
            const y = (height * i) + (buttonH * i) + height;
            const x = left - textOffset;
            const btn = new Rectangle(mo.id, white, x, y, buttonW + (textOffset * 2), buttonH);
            this.renderer.add(btn);

            const btnTextPos = new Point(btn.pos.x + 20 - textOffset, btn.pos.y + (buttonH * 0.75));
            this.renderer.add(new Text(100, mo.text, undefined, black, undefined, btnTextPos));
        });

        this.renderer.add(new Rectangle(ID_CONST.Ground, '#000000', 0, 0, canvas.width, canvas.height));

        console.log("World", this.renderer.renderObjects, Levels);
    }
}


export var lobby = new Lobby(new World(0));
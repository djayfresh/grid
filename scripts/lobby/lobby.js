var LevelConst = { Grid: 0, Zombie: 1, HighScore: 2, Memory: 3 };
var Levels = [LevelConst.Grid, LevelConst.Zombie, LevelConst.HighScore, LevelConst.Memory];

define(['../shared/game', '../shared/world'], function(_game) {

    class Lobby extends Game {
        constructor(world) {
            super();
            this.world = world;
        }

        Resize() {
            canvas.height = canvas.width;
            this.world.setScreen(canvas.width, canvas.height);
        }

        SetMenu(menuOptions){
            this.menuOptions = menuOptions;
        }

        _selectMenuOption(id) {
            this.menuOptions.forEach(mo => {
                if (mo.id === id){
                    mo.action();
                }
            })
        }

        _frame(dt) {
            Debug.time('DT:', dt);

            let isMouseOverButon = false;
            //hover mouse
            this.renderer.renderObjects.filter(ro => Levels.indexOf(ro.id) >= 0).forEach(ro => {
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

            if (isMouseOverButon){ 
                canvas.style.cursor = 'pointer';
            }
            else {
                canvas.style.cursor = 'default';
            }

            if (this.mouse.isDown){
                this.wasDownLastFrame = true;
            }
            else {
                if (this.wasDownLastFrame) {
                    this.renderer.renderObjects.filter(ro => Levels.indexOf(ro.id) >= 0).forEach(ro => {
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
            
            this.mouse = new Mouse(0, canvas, true);
        }

        Restart() {
            super.Restart();

            this.world.setPos(0, 0);

            this.Resize();
            this.Play();
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


    return new Lobby(new World(0));
});
var LevelConst = { Zombie: 0, HighScore: 1 };
var Levels = [LevelConst.Zombie, LevelConst.HighScore];

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

        onLevelSelect(callback){
            this._levelSelected = callback;
        }

        _frame(dt) {
            Debug.time('DT:', dt);

            if (this.mouse.isDown){
                this.wasDownLastFrame = true;
                this.renderer.renderObjects.filter(ro => Levels.indexOf(ro.id) >= 0).forEach(ro => {
                    if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                        Debug.game("Mouse down on RO", ro.pos, ro.bounds, "mouse info", this.mouse.pos);

                        //button highlight
                        ro.color = '#333333';
                    }
                    else {
                        ro.color = '#FFFFFF';
                    }
                });
            }
            else {
                if (this.wasDownLastFrame) {
                    this.renderer.renderObjects.filter(ro => Levels.indexOf(ro.id) >= 0).forEach(ro => {
                        ro.color = '#FFFFFF';

                        if (Physics.collision(this.mouse.pos.x, this.mouse.pos.y, 1, 1, ro.pos.x, ro.pos.y, ro.width, ro.height)) {
                            setTimeout(() => {
                                this._levelSelected(ro.id);
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
        }

        _buildLobbyButtons() {
            const buttons = [];
            canvas.width, canvas.height
            const left = canvas.width * 0.25;
            const height = canvas.height * 0.25;
            const buttonH = 50;
            const buttonW = canvas.width / 2;

            const zombiePlayBtn = new Rectangle(LevelConst.Zombie, '#FFFFFF', left, height, buttonW, buttonH);
            buttons.push(zombiePlayBtn); //Play Zombie

            const highScoreBtn = new Rectangle(LevelConst.HighScore, '#FFFFFF', left - 20, height + buttonH + 20, buttonW + 40, buttonH);
            buttons.push(highScoreBtn); //High Score

            console.log("Buttons", buttons);

            this.renderer.add(...buttons);
            this.renderer.add(new Rectangle(ID_CONST.Ground, '#000000', 0, 0, canvas.width, canvas.height));


            const zombiePlayTextPos = new Point(zombiePlayBtn.pos.x + 20, zombiePlayBtn.pos.y + (buttonH * 0.75));
            this.renderer.add(new Text(100, 'Zombie', undefined, '#000000', undefined, zombiePlayTextPos));

            const highScoreTextPos = new Point(highScoreBtn.pos.x + 15, highScoreBtn.pos.y + (buttonH * 0.75));
            this.renderer.add(new Text(100, 'Highscores', undefined, '#000000', undefined, highScoreTextPos));
        }
    }


    return new Lobby(new World(0));
});
var LevelConst = { Grid: 0, Zombie: 1, HighScore: 2 };
var Levels = [LevelConst.Grid, LevelConst.Zombie, LevelConst.HighScore];

define(['../shared/game', './world'], function(_game, world) {

    class Grid extends Game {
        constructor(world) {
            super();
            this.world = world;
        }

        Resize() {
            canvas.height = canvas.width;
            this.world.setScreen(canvas.width, canvas.height);
        }
        _frame(dt) {
            Debug.time('DT:', dt);

            if (this.mouse.isDown){
                this.wasDownLastFrame = true;
            }
            else {
                if (this.wasDownLastFrame) {
                }
                this.wasDownLastFrame = false;
            }
    
            this.renderer.draw(ctx, this.world);
            this.renderer.update(dt, this.world);
        }
    
        _init() {
            super._init();

            this.renderer.reset();
            this.renderer.add(...this.world.generateMap())
            
            this.mouse = new Mouse(0, canvas, true);
        }

        Restart() {
            super.Restart();

            this.world.setPos(0, 0);

            this.Resize();
            this.Play();
        }
    }


    return new Grid(world);
});
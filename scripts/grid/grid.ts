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
            super._frame(dt);
            
            Debug.time('DT:', dt);

            if (this.mouse.isDown){
                this.wasDownLastFrame = true;
            }
            else {
                if (this.wasDownLastFrame) {
                    //temp
                    this.world.player.pos.x += this.world.squareSize.x;
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
            canvas.style.cursor = 'pointer'; //change mouse pointer
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
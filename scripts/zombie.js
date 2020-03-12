define(['./world', './game'], function(world) {
    class ZombieGame extends Game {
        world;
    
        constructor(world){
            super();
            
            this.world = world;
    
            this.Resize();
    
            this.renderer.add(...world.generateMap());
        }
    
        Resize() {
            canvas.height = canvas.width;
            this.world.setScreen(canvas.width, canvas.height);
        }
    
        _frame(dt) {
            Debug.time('DT:', dt);
            const worldMove = KeyboardManager.moves();
            
            //move the world
            if (!this.checkStreets({ x: this.world.pos.x + (worldMove.x * 2), y: this.world.pos.y + (worldMove.y * 2) })){
                this.world.setPos(this.world.lastPos.x, this.world.lastPos.y);
            }
            else {
                this.world.setPos(this.world.pos.x + worldMove.x, this.world.pos.y + worldMove.y);
            }
    
            this.renderer.draw(ctx, this.world);
            this.renderer.update(dt, this.world);
        }
    
        checkStreets(newPos) {
            const streets = this.world.map.filter(ro => ro.id === ID_CONST.Street);
            return streets.some(s => 
                Physics.collision(this.world.center.x - (this.world.player.width), this.world.center.y - (this.world.player.height), this.world.player.width, this.world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
            );
        }
    
        _init() {
            super._init();
            
            var mouse = new Mouse(0, canvas);
            mouse.press = () => {
                if (this.isPaused()){
                    return;
                }
                
                const force = Point.subtract(mouse.pos, this.world.canvasCenter).normalized().multiply(0.06);
                const bullet = new Bullet(this.world.worldCenter, force);
                Debug.mouse("Fire", mouse.pos, "c", this.world.worldCenter);
                this.renderer.add(bullet);
            };
            
            KeyboardManager.track(KEY_CONST.down);
            KeyboardManager.track(KEY_CONST.up);
            KeyboardManager.track(KEY_CONST.left);
            KeyboardManager.track(KEY_CONST.right);
        }
    }

    var game = new ZombieGame(world);
    game.Play();
})
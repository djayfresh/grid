define(['./world', './game', './weapons'], function(world, _game, weapons) {

    class ZombieGame extends Game {
        world;
        mouse;
        weaponIndex = 0;
        activeWeapon;
        weapons;
        weaponSwitched = false;
    
        constructor(world, weapons){
            super();
            
            this.world = world;
            this.weapons = weapons;
    
            this.Resize();
        }

        SwitchWeapons() {
            const weaponIds = Object.keys(this.weapons);
            const weaponId = weaponIds[++this.weaponIndex % weaponIds.length];
            Debug.game('Switched Weapons', this.activeWeapon, weaponIds, weaponId);
            this.SetWeapon(this.weapons[weaponId]);
        }

        SetWeapon(weapon){
            this.activeWeapon = weapon;
            this.activeWeapon.onFire = (weapon, mouse) => this._onWeaponFired(weapon, mouse);
        }
    
        Resize() {
            canvas.height = canvas.width;
            this.world.setScreen(canvas.width, canvas.height);
        }
    
        _frame(dt) {
            Debug.time('DT:', dt);
            const worldMove = KeyboardManager.moves();

            if(KeyboardManager.isKeyDown(KEY_CONST.x)) {
                if(!this.weaponSwitched) {
                    this.weaponSwitched = true;
                    this.SwitchWeapons();
                }
            }
            else {
                this.weaponSwitched = false;
            }
            
            //move the world
            const worldX = this.world.pos.x;
            const worldY = this.world.pos.y;
            const move = { x: worldX + worldMove.x, y: worldY + worldMove.y };
            if (this.checkStreets(move)){
                this.world.setPos(move.x, move.y);
            }
            else if (this.checkStreets({x: worldX - worldMove.x, y: move.y})){
                Debug.game("valid 1", worldMove);
                this.world.setPos(worldX, move.y);
            }
            else if (this.checkStreets({x: move.x, y: worldY - worldMove.y})){
                Debug.game("valid 2", worldMove);
                this.world.setPos(move.x, worldY);
            }
            else {
                Debug.game("No valid moves", worldMove);
                this.world.setPos(worldX, worldY);
            }

            if (this.activeWeapon){
                this.activeWeapon.update(dt);
            }
    
            this.renderer.draw(ctx, this.world);
            this.renderer.update(dt, this.world);
        }
    
        checkStreets(newPos) {
            const streets = this.world.map.filter(ro => ro.id === ID_CONST.Street);

            const playerX = this.world.player.actualPos.x;// + (this.world.player.width / 2);
            const playerY = this.world.player.actualPos.y;// + (this.world.player.height / 2);

            return streets.some(s => {
                return Physics.insideBounds(playerX, playerY, this.world.player.width, this.world.player.height, s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height)
            });
        }

        _onWeaponFired(weapon, mouse){
            const force = Point.subtract(mouse.pos, this.world.canvasCenter).normalized().multiply(0.06);
            const bullet = new Bullet(this.world.worldCenter, force, weapon.range, weapon.damage);
            Debug.mouse("Fire", mouse.pos, "c", this.world.worldCenter);
            this.renderer.add(bullet);
        }
    
        _init() {
            super._init();

            this.renderer.reset();
            this.renderer.add(...this.world.generateMap());
            this.SetWeapon(this.weapons[Object.keys(this.weapons)[this.weaponIndex]]);
            
            KeyboardManager.track(KEY_CONST.down);
            KeyboardManager.track(KEY_CONST.up);
            KeyboardManager.track(KEY_CONST.left);
            KeyboardManager.track(KEY_CONST.right);
            KeyboardManager.track(KEY_CONST.x);
            KeyboardManager.track(KEY_CONST.r);
        }

        Restart() {
            super.Restart();

            this.world.setPos(0, 0);

            this.Resize();
        }
    }

    var game = new ZombieGame(world, weapons);
    game.Play();
})
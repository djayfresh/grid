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
    
            this.renderer.add(...world.generateMap());

            this.SetWeapon(this.weapons[Object.keys(this.weapons)[this.weaponIndex]]);
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
            if (!this.checkStreets({ x: this.world.pos.x + (worldMove.x * 2), y: this.world.pos.y + (worldMove.y * 2) })){
                this.world.setPos(this.world.lastPos.x, this.world.lastPos.y);
            }
            else {
                this.world.setPos(this.world.pos.x + worldMove.x, this.world.pos.y + worldMove.y);
            }

            if (this.activeWeapon){
                this.activeWeapon.update(dt);
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

        _onWeaponFired(weapon, mouse){
            if (weapon.damage){
                //maybe set this on bullet
            }

            const force = Point.subtract(mouse.pos, this.world.canvasCenter).normalized().multiply(0.06);
            const bullet = new Bullet(this.world.worldCenter, force);
            Debug.mouse("Fire", mouse.pos, "c", this.world.worldCenter);
            this.renderer.add(bullet);
        }
    
        _init() {
            super._init();
            
            KeyboardManager.track(KEY_CONST.down);
            KeyboardManager.track(KEY_CONST.up);
            KeyboardManager.track(KEY_CONST.left);
            KeyboardManager.track(KEY_CONST.right);
            KeyboardManager.track(KEY_CONST.x);
        }
    }

    var game = new ZombieGame(world, weapons);
    game.Play();
})
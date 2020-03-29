class Physics {
    static collision(x, y, w, h, x1, y1, w1, h1){
        if (x < x1 + w1 &&
            x + w > x1 &&
            y < y1 + h1 &&
            y + h > y1) {
                return true;
        }
        
        return false;
    }

    static outOfBounds(x, y, w, h, x1, y1, w1, h1){
        return (x1 > (x + w) || (x1 + w1) < x || (y1 < (y + h) || (y1 + h1 > y)))
    }

    static insideBounds(x, y, w, h, x1, y1, w1, h1){
        return x > x1 && (x + w) < (x1 + w1) && y > y1 && (y + h) < (y1 + h1);
    }
    
    static boxInBounds(pos, w, h, world, sticky) {   
        const tx = sticky ? 0 : world.pos.x;
        const ty = sticky ? 0 : world.pos.y;

        return Physics.collision(pos.x + tx, pos.y + ty, w, h, 0, 0, world.screen.x, world.screen.y);
    }
    
    static inBounds(x, y, world, sticky){
        const tx = sticky ? 0 : world.pos.x;
        const ty = sticky ? 0 : world.pos.y;
    
        return Physics.collision(x + tx, y + ty, 0, 0, 0, 0, world.screen.x, world.screen.y)
    }
    
    static lerp(value, x, y){
        return (1 - value) * x + value * y;
    }
}

define(function() {
    return Physics;
});
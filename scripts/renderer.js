class RenderObject {
    id = id;
    layer = 0;
    pos = new Point(0, 0);
    bounds = { w: 0, h: 0 };

    constructor(id){
        this.id = id;
    }

    draw(_canvas, _world) {

    };

    update(_dt) {
        
    };

    isVisible() { 
        return true; 
    };
}

class Renderer {
    renderObjects = [];
    draw(canvas, world){
        this.renderObjects.sort((a, b) => a.layer - b.layer).forEach(ro => {
            ro.draw(canvas, world);
        });
    };
    update(dt) {
        this.renderObjects.forEach(ro => ro.update(dt));
    };
    add(renderObject){
        this.renderObjects.push(renderObject);
    };
    remove(id) { 
        this.renderObjects = this.renderObjects.filter(ro => ro.id !== id); 
    };
}

class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  
    static distance(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
  
      return Math.hypot(dx, dy);
    }
  }

define(function() {
    return {
        Point,
        Renderer,
        RenderObject
    }
})
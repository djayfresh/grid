import { Rectangle } from '../shared/objects';
import { ID_CONST, Debug } from '../shared/utility';
import { World } from '../shared/world';
import { Colors } from '../shared/colors';

export class GridPlayer extends Rectangle {
    constructor(x: number, y: number, w: number, h: number) {
        super(ID_CONST.Player, Colors.Player, x, y, w, h);
    }

    draw(ctx: CanvasRenderingContext2D, world: World) {
        this.drawSticky(ctx, world, () => {
            const posX = this.pos.x;
            const posY = this.pos.y;

            ctx.fillStyle = this.color;
            Debug.draw('Player', 'x', posX, 'y', posY, 'w', this.width, 'h', this.height);
            ctx.fillRect(posX, posY, this.width, this.height);
        })
    }

    update() {
        
    }
}
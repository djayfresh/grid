import { Debug } from './utility';
import { World } from './world';
import { GameCanvas } from './canvas';
import { RenderObject } from './objects';
import { IPoint } from './physics';

export class Renderer {
    draw(world: World, layer?: number) {
        const canvasRect = { x: GameCanvas.canvas.width, y: GameCanvas.canvas.height };
        Renderer.clearRect(GameCanvas.ctx, canvasRect);
        Renderer.clearScreen(world.$ctx, world);

        const worldDelta = world.getPosDelta();
        Debug.draw('Render Draw:', world.pos, world.map, worldDelta);
        world.$ctx.translate(worldDelta.x, worldDelta.y);

        const renderObjects = world.map.filter(o => o instanceof RenderObject) as RenderObject[];
        renderObjects
            .sort((a, b) => a.layer - b.layer)
            .filter(ro => !layer || ro.layer === layer)
            .filter(ro => ro.isVisible())
            .forEach(ro => {
                Debug.draw('Draw RO', ro.id, ro);
                ro.draw(world.$ctx, world);
            });

        GameCanvas.ctx.drawImage(world.$canvas, 0, 0, canvasRect.x, canvasRect.y);
    };

    update(dt: number, world: World) {
        world.map
            .filter(ro => !ro.isDeleted())
            .forEach(ro => ro.update(dt, world));
    };

    static clearScreen(ctx: CanvasRenderingContext2D, world: World) {
        ctx.translate(-world.pos.x, -world.pos.y); //reset world translate, move back to 0,0

        Renderer.clearRect(ctx, world.canvas);

        ctx.translate(world.pos.x, world.pos.y); //reset the translate to w/e the world has been translated to
    }

    static clearRect(ctx: CanvasRenderingContext2D, screen: IPoint) {
        ctx.clearRect(-10, -10, screen.x + 10, screen.y + 10); //clear off boarder too
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.strokeStyle = 'rgba(0, 153, 255, 1)';
    }
}
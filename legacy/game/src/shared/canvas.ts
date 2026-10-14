import { Point } from './physics';

export class GameCanvas {
    static _canvas: HTMLCanvasElement;
    static id: string = 'grid-canvas';

    static get width() {
        return GameCanvas.canvas ? GameCanvas.canvas.width : 0;
    }
    static get height() {
        return GameCanvas.canvas ? GameCanvas.canvas.height : 0;
    }
    static set height(value) {
        if (GameCanvas.canvas){
            GameCanvas.canvas.height = value;
        }
    }

    static get canvas() {
        if (!GameCanvas._canvas){
            GameCanvas._canvas = document.getElementById(GameCanvas.id) as HTMLCanvasElement;
        }

        return GameCanvas._canvas;
    }

    static get ctx() {
        return GameCanvas._canvas.getContext('2d');
    }

    static canvasToScreen(pos: Point){
        const rect = GameCanvas.canvas.getBoundingClientRect();
        return new Point(pos.x - rect.left, pos.y - rect.top);
    }

    static createCanvas(width: number, height: number) {
        var m_canvas = document.createElement('canvas');
        m_canvas.width = width;
        m_canvas.height = height;
        return m_canvas;
    }
}
// The touch stick: a thumb ring that appears where a finger lands on the left
// part of the canvas and steers while it is held. Its geometry is the engine's
// (engine-core MobileControlsScene: MOBILE_JOY_RADIUS 55, a 22 px thumb, an 8 px
// dead zone), copied here because that one is a Phaser scene and these games
// draw on a plain canvas. A candidate to move into engine-ui as a canvas stick.

export const JOY_RADIUS = 55;
const THUMB_RADIUS = 22;
const DEAD_ZONE = 8;

export interface Stick {
  /** -1..1 on each axis; 0, 0 when no finger is down. */
  readonly x: number;
  readonly y: number;
  readonly active: boolean;
  /** Draws the ring and thumb while a finger holds it, in the canvas's CSS pixels. */
  draw(ctx: CanvasRenderingContext2D, accent: string): void;
  /** Whether a pointer at canvas x, y belongs to the stick (the left part of the canvas). */
  owns(x: number, width: number): boolean;
  destroy(): void;
}

/** A stick on `canvas`, for touch pointers that land on its left `share` (0..1) of the width. */
export function createStick(canvas: HTMLCanvasElement, share = 0.5): Stick {
  let id: number | null = null;
  let baseX = 0;
  let baseY = 0;
  let dx = 0;
  let dy = 0;
  const local = (e: PointerEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const down = (e: PointerEvent): void => {
    if (e.pointerType !== 'touch' || id !== null) return;
    const [x, y] = local(e);
    if (x > canvas.clientWidth * share) return;
    id = e.pointerId;
    baseX = x;
    baseY = y;
    dx = 0;
    dy = 0;
  };
  const move = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    const [x, y] = local(e);
    let mx = x - baseX;
    let my = y - baseY;
    const len = Math.hypot(mx, my);
    if (len > JOY_RADIUS) {
      mx = (mx / len) * JOY_RADIUS;
      my = (my / len) * JOY_RADIUS;
    }
    dx = mx;
    dy = my;
  };
  const up = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    id = null;
    dx = 0;
    dy = 0;
  };
  canvas.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  const axis = (v: number): number => (Math.hypot(dx, dy) < DEAD_ZONE ? 0 : v / JOY_RADIUS);

  return {
    get x() {
      return axis(dx);
    },
    get y() {
      return axis(dy);
    },
    get active() {
      return id !== null;
    },
    owns: (x, width) => x <= width * share,
    draw(ctx, accent) {
      if (id === null) return;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 3;
      ctx.strokeStyle = accent;
      ctx.beginPath();
      ctx.arc(baseX, baseY, JOY_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(baseX + dx, baseY + dy, THUMB_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    destroy() {
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    },
  };
}

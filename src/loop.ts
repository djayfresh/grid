// The frame loop. Updates run in fixed steps, so the game plays the same on a
// 60Hz laptop and a 144Hz monitor, and a tab left in the background doesn't come
// back to one enormous step: the backlog is capped, so it drops that time
// instead of simulating it. Rendering is once a frame, after the steps.

const STEP = 1 / 60;
const MAX_BACKLOG = 0.25;

export interface Loop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

export function createLoop(update: (step: number) => void, render: () => void): Loop {
  let frame = 0;
  let last = 0;
  let backlog = 0;

  function tick(now: number): void {
    frame = requestAnimationFrame(tick);
    backlog = Math.min(backlog + (now - last) / 1000, MAX_BACKLOG);
    last = now;
    while (backlog >= STEP) {
      update(STEP);
      backlog -= STEP;
    }
    render();
  }

  return {
    start(): void {
      if (frame) return;
      last = performance.now();
      backlog = 0;
      frame = requestAnimationFrame(tick);
    },
    stop(): void {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    },
    get running(): boolean {
      return frame !== 0;
    },
  };
}

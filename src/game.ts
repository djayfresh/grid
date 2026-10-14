import { createRng, randomSeed, type Rng } from '@djayfresh/engine-kit';
import type { Round } from './roundFields';

// THE PLACEHOLDER GAME — replace this file with the real one.
//
// Targets drift in and shrink; a tap pops them for a point, a tap on nothing
// costs half a second. It is here so a fresh repo is playable on the first
// `npm run dev`, and so the wiring around a game (loop, cards, saves,
// analytics) has something real running through it while the actual game is
// being built.
//
// Keep the shape when you replace it: main.ts only needs reset/update/render/
// pointer and the score, timeLeft and over it reads back. The seeded RNG is the
// engine's (@djayfresh/engine-kit): one seed gives the same run on every device,
// which is what daily challenges and shared rooms are built on. Its numbers are
// a Round (src/roundFields.ts), read from content/rounds/ and edited on the dev
// server's Rounds page.

/**
 * The game's feel, in CSS pixels: a target's size, its speed, how near a miss
 * still counts. A round's numbers are in content/rounds/; these are the ones
 * every round shares, read live, so `?tune` on the dev server moves them as
 * the game runs (src/tune.ts).
 */
export const TUNE = {
  /** No target appears closer than this to an edge. */
  margin: 44,
  /** A target's radius as it fades out, and how much bigger it is when it appears. */
  smallest: 14,
  growth: 24,
  /** A tap this far outside a target still pops it. */
  slack: 6,
  /** Drift speed, pixels a second. */
  speedMin: 20,
  speedMax: 70,
};

export interface Game {
  /** A fresh round, of `round` if given (else the last one). The same seed replays the same run. */
  reset(seed?: number, round?: Round): void;
  update(step: number): void;
  render(): void;
  /** A tap or click, in CSS pixels relative to the canvas. */
  pointer(x: number, y: number): void;
  /** The canvas changed size: re-read it before the next frame. */
  fit(): void;
  readonly score: number;
  readonly timeLeft: number;
  readonly over: boolean;
}

interface Target {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds left before it gives up and fades out. */
  life: number;
  hue: number;
}

/** One target: a disc in its hue with a darker rim. The Art dev page draws it too (dev/art.ts). */
export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hue: number, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue} 80% 58%)`;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = `hsl(${hue} 80% 30%)`;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// As a function, so the context is non-null for the closures below: TypeScript
// doesn't carry a narrowing from the body into the functions the body creates.
function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser has no 2D canvas.');
  return ctx;
}

export function createGame(canvas: HTMLCanvasElement, round: Round): Game {
  const ctx = context2d(canvas);

  let rng: Rng = createRng(randomSeed());
  let targets: Target[] = [];
  let spawnIn = 0;
  let score = 0;
  let timeLeft = round.seconds;
  let width = 0;
  let height = 0;

  // The canvas is sized in CSS pixels and drawn in device pixels, so it stays
  // sharp on a phone; the transform lets everything below think in CSS pixels.
  // Capped at 2, because a 3x buffer costs fill rate for no visible gain.
  function fit(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const radius = (t: Target): number => TUNE.smallest + TUNE.growth * Math.max(0, t.life / round.targetLife);

  function spawn(): void {
    const speed = rng.range(TUNE.speedMin, Math.max(TUNE.speedMin, TUNE.speedMax));
    const angle = rng.range(0, Math.PI * 2);
    targets.push({
      x: rng.range(TUNE.margin, Math.max(TUNE.margin + 1, width - TUNE.margin)),
      y: rng.range(TUNE.margin, Math.max(TUNE.margin + 1, height - TUNE.margin)),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: round.targetLife,
      hue: rng.int(0, 360),
    });
  }

  return {
    fit,

    reset(seed = randomSeed(), next = round): void {
      round = next;
      rng = createRng(seed);
      targets = [];
      spawnIn = 0;
      score = 0;
      timeLeft = round.seconds;
      fit();
    },

    update(step: number): void {
      if (timeLeft <= 0) return;
      timeLeft = Math.max(0, timeLeft - step);

      spawnIn -= step;
      if (spawnIn <= 0 && targets.length < round.maxTargets) {
        spawn();
        spawnIn = round.spawnEvery;
      }

      for (const t of targets) {
        t.life -= step;
        t.x += t.vx * step;
        t.y += t.vy * step;
        // Bounce off the edges, so a target never drifts out of reach.
        const r = radius(t);
        if (t.x < r || t.x > width - r) t.vx = -t.vx;
        if (t.y < r || t.y > height - r) t.vy = -t.vy;
        t.x = Math.min(Math.max(t.x, r), Math.max(r, width - r));
        t.y = Math.min(Math.max(t.y, r), Math.max(r, height - r));
      }
      targets = targets.filter((t) => t.life > 0);
    },

    pointer(x: number, y: number): void {
      if (timeLeft <= 0) return;
      const hit = targets.findIndex((t) => Math.hypot(t.x - x, t.y - y) <= radius(t) + TUNE.slack);
      if (hit === -1) {
        timeLeft = Math.max(0, timeLeft - round.missPenalty);
        return;
      }
      targets.splice(hit, 1);
      score += 1;
    },

    render(): void {
      ctx.clearRect(0, 0, width, height);
      for (const t of targets) drawTarget(ctx, t.x, t.y, radius(t), t.hue, Math.min(1, t.life / 0.4));
    },

    get score(): number {
      return score;
    },
    get timeLeft(): number {
      return timeLeft;
    },
    get over(): boolean {
      return timeLeft <= 0;
    },
  };
}

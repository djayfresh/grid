import { createRng, type Rng } from '@djayfresh/engine-kit';

// The engine's seeded random numbers, counting how many it has given, so a
// saved game can be picked up with the same numbers still to come: replay
// `draws` from the seed. Every method draws through the one counted next().

export interface CountedRng extends Rng {
  readonly draws: number;
}

export function countedRng(seed: number, skip = 0): CountedRng {
  const base = createRng(seed);
  let draws = 0;
  const next = (): number => {
    draws += 1;
    return base.next();
  };
  for (let i = 0; i < skip; i++) next();
  const int = (min: number, maxExclusive: number): number => min + Math.floor(next() * (maxExclusive - min));
  return {
    get draws() {
      return draws;
    },
    next,
    int,
    range: (min, max) => min + next() * (max - min),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick from empty list');
      return items[int(0, items.length)];
    },
    shuffle: (items) => {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i + 1);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    chance: (p) => next() < p,
  };
}

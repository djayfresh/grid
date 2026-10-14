import { tune, tunePanel } from '@djayfresh/engine-dev';
import { TUNE } from './game';
import { SOUND } from './sound';

// The game's working numbers on the dev server, until a playtest settles them.
// main.ts loads this only behind import.meta.env.DEV, so none of it is in the
// published game. With ?tune in the address the game shows a panel of
// sliders over TUNE; any of them can be given in the address too
// (?speedMax=120), so a setting worth keeping is a link. Both sets are kept in
// this browser until Defaults, and the Sounds page's frame (?tune=follow)
// follows the lab's sliders as they move. When a number is right, Copy and
// paste it back over TUNE or SOUND.

/** The sound's numbers, kept under the key the Sounds page uses too. */
export const soundTune = () =>
  tune(SOUND, {
    remember: 'grid:tune:sound',
    url: 'sound',
    ranges: {
      'pop.freq': { min: 200, max: 2000, label: 'Pitch (Hz)' },
      'pop.rise': { min: 0.5, max: 3, step: 0.01, label: 'Second note (x)' },
      'pop.gap': { max: 0.2, step: 0.005, label: 'Gap (s)' },
      'pop.duration': { max: 0.4, step: 0.005, label: 'Length (s)' },
      'pop.volume': { max: 0.3, step: 0.005, label: 'Volume' },
      'miss.freq': { min: 40, max: 600, label: 'Pitch (Hz)' },
      'miss.duration': { max: 0.4, step: 0.005, label: 'Length (s)' },
      'miss.volume': { max: 0.3, step: 0.005, label: 'Volume' },
      'over.freq': { min: 200, max: 1200, label: 'Pitch (Hz)' },
      'over.step': { max: 0.4, step: 0.005, label: 'Between notes (s)' },
      'over.duration': { max: 0.6, step: 0.005, label: 'Length (s)' },
      'over.volume': { max: 0.3, step: 0.005, label: 'Volume' },
    },
  });

/** The game's feel, from the address and the panel. */
export const gameTune = () =>
  tune(TUNE, {
    remember: 'grid:tune:game',
    ranges: {
      margin: { max: 150, label: 'Edge margin (px)' },
      smallest: { min: 4, max: 60, label: 'Smallest (px)' },
      growth: { max: 80, label: 'Growth (px)' },
      slack: { max: 30, label: 'Miss slack (px)' },
      speedMin: { max: 300, label: 'Slowest (px/s)' },
      speedMax: { max: 300, label: 'Fastest (px/s)' },
    },
  });

/** `mode` is ?tune's value: `follow` takes the numbers without the panel (the Sounds page's frame). */
export function startTuning(mode: string): void {
  const game = gameTune();
  soundTune();
  if (mode !== 'follow') tunePanel(game, { title: 'Tune', closed: matchMedia('(max-width: 600px)').matches });
}

import { run, tone, tones } from '@djayfresh/engine-ui';

// What the game sounds like: short tones from the engine (engine-ui's `tone`),
// so it ships no audio files, and every one goes through the site's Sound
// setting. SOUND is every number they are made from, read as each one plays:
// the dev server's Sounds page (dev/sounds.ts) has a slider for each and a pad
// per sound, with the game running beside it on the same numbers. What sounds
// right there is pasted back here by hand (Copy, on its panel).

export const SOUND = {
  /** Two quick notes, the second higher by `rise`, `gap` seconds behind. */
  pop: { freq: 660, rise: 1.5, gap: 0.045, duration: 0.07, volume: 0.09 },
  /** One low buzz. */
  miss: { freq: 150, duration: 0.14, volume: 0.08 },
  /** Three notes, `step` seconds apart: up for a new best, down for the rest. */
  over: { freq: 523, step: 0.11, duration: 0.16, volume: 0.07 },
};

/** A target popped. `strength`, 0 to 1, scales how loud. */
export function pop(strength = 1): void {
  const s = SOUND.pop;
  const volume = s.volume * strength;
  tones([
    { freq: s.freq, duration: s.duration, volume, type: 'triangle' },
    { freq: s.freq * s.rise, start: s.gap, duration: s.duration, volume, type: 'triangle' },
  ]);
}

/** A tap on nothing. */
export function miss(strength = 1): void {
  const s = SOUND.miss;
  tone({ freq: s.freq, duration: s.duration, volume: s.volume * strength, type: 'sawtooth' });
}

/** The round is over. */
export function roundOver(best: boolean, strength = 1): void {
  const s = SOUND.over;
  const notes = [s.freq, s.freq * 1.26, s.freq * 1.5];
  run(best ? notes : notes.reverse(), { step: s.step, duration: s.duration, volume: s.volume * strength, type: 'square' });
}

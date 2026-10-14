import { devNav, soundLab } from '@djayfresh/engine-dev';
import { silenceAudio, unlockAudio } from '@djayfresh/engine-ui';
import { PAGES } from '../src/pages';
import { miss, pop, roundOver } from '../src/sound';
import { soundTune } from '../src/tune';

// The Sounds page: a pad for each of the game's sounds (keys 1 to 9 too), a
// slider for every number in SOUND (src/sound.ts), and the game beside them on
// the same numbers, to hear a change in play. A new sound is its function in
// src/sound.ts, its numbers in SOUND, and a pad here.
devNav(PAGES);
await soundLab({
  page: 'sounds',
  tune: soundTune(),
  wake: unlockAudio,
  hush: silenceAudio,
  game: '/?tune=follow',
  pads: [
    { label: 'Pop', group: 'In play', play: pop },
    { label: 'Miss', group: 'In play', play: miss },
    { label: 'New best', group: 'Round over', play: (s) => roundOver(true, s) },
    { label: 'Time', group: 'Round over', play: (s) => roundOver(false, s) },
  ],
});

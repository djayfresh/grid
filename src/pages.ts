import type { DevPage } from '@djayfresh/engine-dev';

// Every page this game has: the one it publishes and the dev pages, which only
// `npm run dev` serves (http://localhost:5321/dev/). One list drives both
// the build's inputs (devPages in vite.config.ts) and the bar across the top of
// each dev page, so a page cannot be built and missing from the nav, or the
// other way round. A new dev page is its HTML file in dev/ and one line here.
// Plain data: vite.config.ts imports it too.

export const PAGES: DevPage[] = [
  { id: 'game', title: 'Game', html: 'index.html' },
  { id: 'dev', title: 'Dev', html: 'dev/index.html', devOnly: true, blurb: 'Every dev page, notes on the game, and a link that opens it on a phone.' },
  { id: 'rounds', title: 'Rounds', html: 'dev/rounds.html', devOnly: true, blurb: 'The rounds in content/rounds/, each as a form, saved into the repo.' },
  { id: 'art', title: 'Art', html: 'dev/art.html', devOnly: true, blurb: 'Everything the game draws, by its own code, at the sizes it draws it, over light and dark.' },
  { id: 'sounds', title: 'Sounds', html: 'dev/sounds.html', devOnly: true, blurb: 'A pad for each sound, a slider for every number it is made from, and the game beside them on the same numbers.' },
];

import type { DevPage } from '@djayfresh/engine-dev';
import { GAMES, gamePage } from './site';

// Every page this repo has: the home and each game's page, which are published,
// and the dev pages, which only `npm run dev` serves (http://localhost:5321/dev/).
// One list drives both the build's inputs (devPages in vite.config.ts) and the
// bar across the top of each dev page. Plain data: vite.config.ts imports it too.

export const PAGES: DevPage[] = [
  { id: 'home', title: 'Home', html: 'index.html' },
  ...GAMES.map((g): DevPage => ({ id: g.id, title: g.title, html: gamePage(g) })),
  { id: 'dev', title: 'Dev', html: 'dev/index.html', devOnly: true, blurb: 'Every dev page, notes on the games, and a link that opens them on a phone.' },
  { id: 'mockups', title: 'Mock-ups', html: 'dev/mockups.html', devOnly: true, blurb: 'Three looks for the face lift, side by side: the home and a game in each.' },
  { id: 'art', title: 'Art', html: 'dev/art.html', devOnly: true, blurb: 'Every piece the games draw, by their own code, at the sizes they draw it.' },
];

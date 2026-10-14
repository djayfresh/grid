import { type ArtSection, artSheet, devNav } from '@djayfresh/engine-dev';
import { ART as memoryArt } from '../src/games/memory/art';
import { drawBonus, drawEnemy, drawFlag, drawPlayer } from '../src/games/run/art';
import { ART as zombiesArt } from '../src/games/zombies/art';
import { PAGES } from '../src/pages';
import { GAMES } from '../src/site';

// The Art page: every piece the arcade's games draw, by the games' own code, at
// the sizes they draw it, over light, dark and a checkerboard, with a note box
// on each (saved to dev/notes/art.json).
devNav(PAGES);

/** The hub cards live in the platform repo; there are none to show when it isn't checked out beside this one. */
const CARDS = import.meta.glob<string>('../../playallday/site/thumbs/grid*.{svg,png}', { query: '?url', import: 'default', eager: true });

const sections: ArtSection[] = [
  {
    title: 'Grid Run',
    note: 'src/games/run/art.ts: you, a red square, the flag and the bonus.',
    sizes: [40, 72, 96],
    items: [
      { name: 'You', draw: (ctx: CanvasRenderingContext2D, s: number) => drawPlayer(ctx, 0, 0, s, [1, 0]) },
      { name: 'Red square', draw: (ctx: CanvasRenderingContext2D, s: number) => drawEnemy(ctx, 0, 0, s, 0.5) },
      { name: 'Flag', draw: (ctx: CanvasRenderingContext2D, s: number) => drawFlag(ctx, 0, 0, s) },
      { name: 'Bonus', draw: (ctx: CanvasRenderingContext2D, s: number) => drawBonus(ctx, 0, 0, s) },
    ],
  },
  { title: 'Memory Grid', note: 'src/games/memory/art.ts: the 18 faces (shape and fill, readable without colour), face down, and found.', sizes: [48, 80], items: memoryArt },
  { title: 'Zombie Grid', note: 'src/games/zombies/art.ts.', sizes: [48, 96], items: zombiesArt },
  {
    title: 'Card art',
    note: `The hub cards, from the playallday repo's site/thumbs/ (../playallday): ${['grid', ...GAMES.map((g) => g.slug)].join(', ')}.`,
    sizes: [96, 192],
    items: Object.entries(CARDS).map(([path, url]) => ({ name: path.split('/').at(-1) ?? path, src: url })),
  },
];

await artSheet({ page: 'art', sections });

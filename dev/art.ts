import { type ArtSection, artSheet, devNav } from '@djayfresh/engine-dev';
import { drawTarget } from '../src/game';
import { PAGES } from '../src/pages';

// The Art page: everything the game draws, by the game's own code, at the
// sizes it draws it, over light, dark and a checkerboard, with a note box on
// each (saved to dev/notes/art.json). A new drawing is one more item: a
// draw(ctx, size), an image's URL, or an atlas through the engine's atlasArt.
devNav(PAGES);

/** The hub card lives in the platform repo; there is none to show when it isn't checked out beside this one. */
const CARD = import.meta.glob<string>('../../playallday/site/thumbs/grid.{svg,png}', { query: '?url', import: 'default', eager: true });

const sections: ArtSection[] = [
  {
    title: 'Targets',
    note: 'drawTarget in src/game.ts, at its smallest, middle and largest (a target shrinks as its life runs out).',
    sizes: [28, 52, 76],
    // The rim is 3px wide and half of it is outside the disc, so the disc is drawn 2px in.
    items: [10, 130, 250].map((hue) => ({ name: `Hue ${hue}`, draw: (ctx: CanvasRenderingContext2D, size: number) => drawTarget(ctx, size / 2, size / 2, size / 2 - 2, hue) })),
  },
  {
    title: 'Card art',
    note: "The hub card, from the playallday repo's site/thumbs/ (../playallday): the SVG it is drawn as and the PNG made from it.",
    sizes: [96, 192],
    items: Object.entries(CARD).map(([path, url]) => ({ name: path.split('/').at(-1) ?? path, src: url })),
  },
];

await artSheet({ page: 'art', sections });

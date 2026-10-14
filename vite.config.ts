import { devPages } from '@djayfresh/engine-dev/vite';
import { headTags, headTagsPlugin } from '@djayfresh/engine-site/vite';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { PAGES } from './src/pages';
import { DESCRIPTION, GAME_URL, GAMES, gamePage, gameUrl, SITE_ORIGIN, SLUG, TITLE } from './src/site';

// The arcade is built for /grid/ and every asset URL is relative to it; the dev
// server stays at the root. Each game's page (<slug>/index.html) is built
// beside the home and deployed to its own folder (tools/deploy.ts), its code
// staying under /grid/assets/, the way the escape room ships its mini-games.
//
// The head tags the platform expects (canonical, description, Open Graph, and
// the shared account and sync scripts) are added by the build only, from the
// engine's plugin. They are never in index.html: the dev server has no /shared/
// to point them at, and Vite would try to bundle an absolute script URL it
// cannot see.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

const STORAGE_SCRIPT = '<script src="/shared/storage.js"></script>';

/** Each page's own canonical, description, title and analytics game_id. */
function metaFor(page: string) {
  const game = GAMES.find((g) => gamePage(g) === page);
  if (game) return { canonical: gameUrl(game), description: game.description, title: game.title, game: game.slug, image: `${SITE_ORIGIN}/thumbs/${game.slug}.png` };
  return { canonical: GAME_URL, description: DESCRIPTION, title: TITLE, game: SLUG, image: `${SITE_ORIGIN}/thumbs/${SLUG}.png` };
}

// storage.js is the one shared script the engine's headTags doesn't offer, since
// a game only needs it if it saves anything. In dev it's injected here instead,
// so a dev server running behind the platform's own (the /shared proxy below)
// saves exactly as the real site does.
const storageInDev = (): Plugin => ({
  name: 'playallday-storage-dev',
  apply: 'serve',
  transformIndexHtml: () => [{ tag: 'script', attrs: { src: '/shared/storage.js' }, injectTo: 'head-prepend' }],
});

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${SLUG}/` : '/',
  plugins: [
    // The dev pages (src/pages.ts): the build's inputs are the published pages
    // only, and the dev server answers the dev pages' notes (dev/notes/). The Art
    // page shows the hub cards from the playallday repo beside this one.
    devPages({
      pages: PAGES,
      allow: ['../playallday/site/thumbs'],
    }),
    storageInDev(),
    headTagsPlugin(
      (page) =>
        `${STORAGE_SCRIPT}\n    ${headTags(
          metaFor(page),
          // account brings the sign-in sheet and the feedback form; sync carries
          // this game's saves to the player's other devices; rooms is playing
          // together (rooms by code, lobbies, casts); leaderboard is the boards.
          // Every call into them is optional-chained, so a game that never uses
          // one loses nothing by loading it. Drop a name to leave it off the page.
          { version, scripts: ['account', 'sync', 'rooms', 'leaderboard'] },
        )}`,
    ),
  ],
  server: {
    port: 5321,
    host: '0.0.0.0',
    // /shared/*.js only exists on the real site. The playallday repo's
    // `npm run dev` serves it at :5500, so with that running the dev server has
    // storage, accounts and sync too; without it they 404 and the game plays on
    // with none of them, which is why every call to window.playallday is
    // optional-chained.
    proxy: { '/shared': { target: 'http://localhost:5500', changeOrigin: true } },
  },
  preview: { host: '0.0.0.0' },
}));

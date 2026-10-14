# Grid games

Grid Run, Memory Grid and Zombie Grid on **[playallday.games](https://playallday.games)**,
the way the escape room has its mini-games: each a game of its own on the hub
with its own folder, card and leaderboard, and a main menu at `/grid/` that
links the three (it has no hub card of its own). The Grid as a project, with
its 2020 story and scores, is on djayfresh.com (`/project/grid/`).

| Game | Slug | Board |
| --- | --- | --- |
| Grid Run | `grid-run` | Moves, fewest wins |
| Memory Grid | `grid-memory` | Points, most wins |
| Zombie Grid | `grid-zombies` | Score, most wins |

The games started in 2020 (tag `start-2020`; that code is in `legacy/`, with its
own scores server, which the playallday leaderboards replaced). The hub, the
shared browser scripts and the backend live in the `playallday` repo; this repo
is the arcade and its deploy.

```sh
npm install            # the engine submodule's packages are workspaces of this repo
npm run dev            # http://localhost:5321
npm run typecheck
npm test               # the game's own tests (tests/)
npm run build          # dist/, built for /grid/
npm run deploy:dry     # build, then show what would change in the bucket
npm run deploy         # build, upload, purge Cloudflare
```

For storage, accounts and sync on the dev server, run `npm run dev` in the
`playallday` repo too: the dev server proxies `/shared/*` to it (`vite.config.ts`).
Without it the game still runs, with no saves.

| Path | What it is |
| --- | --- |
| `src/site.ts` | The home's slug, title and description, and `GAMES`: each game's slug, title, lines, board and colour. The pages, the deploy's folders, the head tags and the home's cabinets all read it. |
| `index.html`, `src/home/` | The main menu (`/grid/`): a cabinet per game, with its attract loop, best and Play link. No hub card (`"card": false`). |
| `grid-run/`, `grid-memory/`, `grid-zombies/` | Each game's page (deployed to its own folder of the bucket). |
| `src/games/<id>/` | A game: `rules.ts` (pure, tested), `art.ts` (its drawings and attract loop), `main.ts` (the round). |
| `src/arcade/` | What the games share: `page.ts` (canvas, top bar, cards, pause menu, the move between a card and a round), `score.ts` (saves, offline scores, the board), `theme.ts` (palette and tiles), `joystick.ts` (a touch stick). |
| `src/loop.ts` | Fixed-step update, render once a frame. |
| `src/pages.ts`, `dev/` | Every page, and the dev pages `npm run dev` serves at `/dev/` (never built): an index, the Art page and the look mock-ups. |
| `tests/` | The games' rules (vitest). |
| `public/<slug>/hub.js`, `public/hub-best.js` | Each game's best on its own hub card (`hubScript` in the hub's `games.json`); the menu has no card. |
| `tools/deploy.ts` | The deploy: the home's folder and each game's, then a Cloudflare purge. |
| `legacy/` | The 2020 game and its server, kept as they were. |
| `engine/` | The engine (git submodule, `web-game-engine`). |

## The rules this game keeps

Every game on the domain shares one origin, so these are not style points:

- **Slugs** `grid`, `grid-run`, `grid-memory` and `grid-zombies` are permanent: each is a URL, an analytics `game_id`, a save prefix and a board.
- **Base path**: the build is made for `/grid/`. No root-absolute asset
  paths (`/assets/...`) — that is another game's folder.
- **Storage**: keys through `window.playallday.storage(<the game's slug>)`, never a bare
  `localStorage` key. IndexedDB names through `.dbName()`.
- **Analytics**: `window.playallday.track`, never `gtag`, and only the platform's
  event list (`level_start`, `level_end`, `post_score`, `unlock_achievement`,
  `game_complete`).
- **Shared scripts can be missing** (blocked, or a dev server without the
  platform behind it): every call goes through optional chaining and the game
  plays on without them.


The full list, and what the platform gives a game in return (accounts, feedback,
saves on every device, leaderboards, rooms) is in the `playallday` repo's README.
The page loads all four of its scripts (`vite.config.ts`); a game that never
uses one loses nothing by it.

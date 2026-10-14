# The Grid

Pick a game on the grid: race to the flag, match the colours or hold off the zombies.

A game on **[playallday.games](https://playallday.games)**: it is served as one
folder of that site, at `/grid/`. The hub, the shared browser scripts and the
backend live in the `playallday` repo; this repo is the game and its deploy.

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
| `src/site.ts` | Slug, title, description, origin. The build's base path, the deploy's prefix check and the canonical link all read it. |
| `src/main.ts` | Boot: the engine-ui top bar, cards and pause menu, the loop, and the move between a card and a round. |
| `src/game.ts` | **The game.** Starts as a placeholder so the repo is playable at once; replace it. |
| `src/sound.ts` | The game's sounds, as engine-ui tones (no audio files), and `SOUND`, every number they are made from. |
| `src/tune.ts` | Dev server only: `?tune` puts a panel of sliders over the game's `TUNE` numbers. |
| `src/loop.ts` | Fixed-step update, render once a frame. |
| `src/roundFields.ts`, `src/rounds.ts`, `content/rounds/` | A round's shape and form, the files, and how the game reads them (`?round=<id>` picks one). |
| `src/multiplayer.ts`, `src/together.ts` | Playing together: the race's rules, and the card, lobby and board over the platform's rooms. |
| `src/pages.ts`, `dev/` | Every page, and the dev pages `npm run dev` serves at `/dev/` (never built): an index, the rounds editor, the Art page and the Sounds page. |
| `src/score.ts` | Saves, the leaderboard and analytics, through `window.playallday`. |
| `tests/` | The game's own tests (vitest). The placeholder's go when it does. |
| `public/hub.js` | The player's progress on the hub card (`hubScript` in the hub's `games.json`). |
| `tools/deploy.ts` | The deploy: this game's folder of the bucket, then a Cloudflare purge. |
| `engine/` | The engine (git submodule, `web-game-engine`). |

## The rules this game keeps

Every game on the domain shares one origin, so these are not style points:

- **Slug** `grid` is permanent: it is the URL and the analytics `game_id`.
- **Base path**: the build is made for `/grid/`. No root-absolute asset
  paths (`/assets/...`) — that is another game's folder.
- **Storage**: keys through `window.playallday.storage('grid')`, never a bare
  `localStorage` key. IndexedDB names through `.dbName()`.
- **Analytics**: `window.playallday.track`, never `gtag`, and only the platform's
  event list (`level_start`, `level_end`, `post_score`, `unlock_achievement`,
  `game_complete`).
- **Shared scripts can be missing** (blocked, or a dev server without the
  platform behind it): every call goes through optional chaining and the game
  plays on without them.
- **Service worker**, if it ever gets one: scoped to `/grid/`, never `/`.

The full list, and what the platform gives a game in return (accounts, feedback,
saves on every device, leaderboards, rooms) is in the `playallday` repo's README.
The page loads all four of its scripts (`vite.config.ts`); a game that never
uses one loses nothing by it.

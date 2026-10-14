# The Grid

A small collection of HTML5 canvas games — **Grid**, **Zombie Survival**, and **Memory** — built on a shared TypeScript rendering/game-loop engine, plus a lightweight Node/Express server for high scores and Socket.IO messaging.

Live-ish demo target: `djayfresh.com` (see `game/index.html`).

## Structure

This repo contains two independent npm projects — there is no root `package.json`.

```
game/     Browser client: canvas engine + games (TypeScript, Webpack)
server/   Node/Express API + Socket.IO server (TypeScript)
```

### `game/`

- `src/shared/` — engine core: `Game` (state machine + loop), `World`, `Renderer`, `GameCanvas`, `Physics`, `event-queue` (RxJS-based pub/sub), `objects` (render primitives), `images`, `analytics`.
- `src/grid/`, `src/zombie/`, `src/memory/` — one folder per game, each extending `Game`/`World`.
- `src/lobby/` — main menu, wired to the game list in `src/main.ts`.
- `src/highscore/` — local high-score storage + UI world.
- `src/services/` — `HighScoreService` (REST via `rxjs/ajax`) and `SocketService` (`socket.io-client`), both pointed at the `server/` API.
- `src/runner.ts` — dev entry point (`import './main'` + `Start()`), bundled to `dist/runner.js` for `index.html`.
- `src/main.ts` — also exports `Start`, `SetApiUrl`, `SetCanvasId`, `ImageAssets` for embedding the bundle (`dist/launcher.js`) on another page.

### `server/`

- `src/app.ts` — Express app: CORS (hardcoded origin whitelist), `/api/*` routes, Socket.IO on path `/io`.
- `src/controllers/` — `BaseController` + `@Get`/`@Post`/`@Put` decorators (`src/utility/decorators.ts`) auto-register routes from decorated methods.
- `src/controllers/highscore.controller.ts` — reads/writes `server/high-score.json` directly on disk (no database).
- `src/index.ts` — starts the HTTP server (`PORT` env var, default `3000`).

## Getting started

Requires Node.js and npm. Each project is set up and run separately.

### Server

```bash
cd server
npm install
npm run watch   # tsc --watch, compiles src/ -> dist/
node dist/index.js
```

Serves the API on `http://localhost:3000` (`/api/high-score/list`, `/api/high-score/save`) and Socket.IO on `/io`.

### Game

```bash
cd game
npm install
npm run watch   # tsc -w, compiles src/ -> build/
npm run pack    # webpack (dev config), bundles build/ -> dist/runner.js
```

Then open `game/index.html` in a browser (or serve the `game/` folder statically). The client defaults to `http://localhost:3000/` for the API/socket — make sure the server is running.

Other game scripts:

```bash
npm run build         # compile + dev bundle
npm run pack-deploy   # webpack (production config), bundles build/main.js -> dist/launcher.js
npm run publish        # compile + production bundle
```

## Notes

- No automated tests or linting are currently configured in either project.
- High scores are stored both locally (browser) and merged with the server's `high-score.json` file.
- See `CLAUDE.md` for architecture notes aimed at AI-assisted development in this repo.

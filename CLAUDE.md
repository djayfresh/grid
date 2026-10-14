# CLAUDE.md

Guidance for Claude Code (or any AI agent) working in this repository.

## What this is

A personal hobby project: a handful of HTML5 canvas games (Grid, Zombie, Memory) sharing one small TypeScript game engine, plus a companion Express/Socket.IO server for high scores and real-time messaging. Small scale, single author (Doug Fresh), no CI, no tests. Treat it accordingly — favor minimal, readable changes over heavy process or new tooling unless asked.

## Repo layout

Two independent npm projects, no root `package.json`, no workspaces:

- `game/` — browser client (TypeScript, compiled with `tsc` then bundled with Webpack).
- `server/` — Node/Express + Socket.IO API (TypeScript, compiled with `tsc`).

Always `cd` into the relevant project before running npm scripts — there is no root-level `npm install`/`build`.

## Build pipeline (`game/`)

Two-stage: `tsc` compiles `src/**/*.ts` to `build/`, then Webpack bundles `build/` to `dist/`.

- `npm run compile` → `tsc` (`src/` → `build/`)
- `npm run pack` → webpack `dev` config, `build/runner.js` → `dist/runner.js` (what `index.html` loads)
- `npm run pack-deploy` → webpack `deploy` config, `build/main.js` → `dist/launcher.js`, exposed as UMD global `Grid` (for embedding on another site)
- `npm run build` = compile + pack; `npm run publish` = compile + pack-deploy

If you change `.ts` files and want to see them reflected in `dist/`, both steps must run (or use `npm run watch` for the compile half and re-run `pack` manually — webpack watch is not wired up).

`server/` is single-stage: `tsc --watch` → `dist/`, run with `node dist/index.js`.

## Engine architecture (`game/src/shared/`)

- **`Game`** (`game.ts`) — base class for every playable screen (`Grid`, `Zombie`, `Memory`, `Lobby`, `HighScore`). Owns a `requestAnimationFrame` loop (`Run` → `_frame`) driven by a tiny state machine (`_state` is either `_play` or `_pause`). Subclasses override `_init`, `StartRound`, `RunRound`, `onMouseDown`, etc. Each game module instantiates and exports a singleton at the bottom of its file (e.g. `export var grid = new Grid();`) — `main.ts` imports these singletons and switches `selectedGame` between them; only one is ever "current" at a time, but *all* keep running their internal loop (paused ones just no-op in `_pause`).
- **`World`** (`world.ts`) — holds the map (`IGameObject[]`), player, camera position/origin, collision checks (`noCollisions`, `validateMove`), and destroy/damage resolution (`doDestroyableCheck`). Each game has its own `World` subclass in its folder.
- **`Renderer`** (`renderer.ts`) — draws/updates a `World`'s object map each frame.
- **`GameEventQueue`** (`event-queue.ts`) — a small RxJS-based pub/sub bus. Events extend `BaseEvent<T>` and must be registered with a static `eventName` (see `events.ts`) or `subscribe` throws. Used for cross-cutting concerns: resize, menu navigation, socket data relay.
- **`objects.ts`** — render primitives (`Rectangle`, `RenderText`, `Prefab`, etc.) and the `IDestroyable`/`IDestroyer` interfaces used by collision/damage.
- **`utility.ts`** — also monkey-patches globals used throughout the codebase: `Array.prototype.first`, `Array.prototype.ofType<C>()`, `Math.range(min, max)`. These aren't optional helpers — engine code (e.g. `World.noCollisions`) depends on `ofType` existing on arrays.

To add a new game: create a folder under `src/`, subclass `Game`/`World`, export a singleton instance, and wire it into `gamesList`/`menuOptions` in `src/main.ts` plus a new `LevelConst` entry in `src/lobby/levels.ts`.

## Server architecture (`server/src/`)

- Routing is decorator-based: `BaseController` (`controllers/base.controller.ts`) reflects over `@Get('path')`/`@Post('path')`/`@Put('path')`-annotated methods (`utility/decorators.ts`) and auto-registers them under `/api/<controllerBaseUrl>/<path>`. To add an endpoint, add a decorated method to a controller and list the controller in `routes/config.ts`.
- `HighScoreController` persists to a flat file, `server/high-score.json`, via `fs.readFile`/`writeFile` — no locking, no database. Concurrent saves can race; keep this in mind before adding write-heavy features.
- CORS whitelist in `app.ts` is a hardcoded array (`localhost:4000`, `djayfresh.com`, `'null'`) — update it there if a new client origin needs access. Note it also allows `Origin: null` unconditionally, which is intentional-but-loose (covers `file://`/sandboxed contexts); tighten it if that becomes a concern.
- Socket.IO is mounted at path `/io` (not the default `/socket.io`) — client and server must agree on this.

## Cross-cutting conventions

- Public game-loop methods use PascalCase (`Play`, `Pause`, `Restart`, `Resize`, `StartRound`) to distinguish the `Game`/`World` "framework API" from ordinary lowercase helper methods — follow this when adding methods meant to be called externally.
- Neither `tsconfig.json` allows implicit strictness (`strict` is not set) — expect loose typing (`any`, non-null assumptions) in existing code; don't feel obligated to retrofit strict types repo-wide, but don't introduce new `any` where a real type is easy.
- No linter/formatter is configured. Match the surrounding file's style (4-space indent, single quotes, semicolons).
- No test framework is set up in either project. If asked to add tests, ask which stack is preferred (Jest is the path of least friction for both TS projects) rather than assuming.
- `game/src/services/*.service.ts` hardcode `http://localhost:3000/` as the default `baseUrl`; `SetApiUrl()` in `main.ts` overrides both for embedded/production use — don't hardcode a different default without also updating that override path.

## Known rough edges (don't "fix" silently — flag/ask first)

- `game/package.json`'s `repository.url` points to a local `G:/Dropbox/...` path, not a real remote.
- `server/high-score.json` is committed to the repo as the server's live data file — be careful not to overwrite real high-score data when testing locally.

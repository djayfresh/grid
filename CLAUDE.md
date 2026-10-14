# The Grid (`grid`)

Three games on playallday.games, like the escape room's mini-games, each a
game of its own on the hub with its own folder, card and leaderboard: Grid Run
(`grid-run`), Memory Grid (`grid-memory`) and Zombie Grid (`grid-zombies`), and
a main menu at `/grid/` linking them, which has no hub card (`"card": false` in
the hub's games.json). The Grid as a project, its 2020 story and high scores,
lives on djayfresh.com (`/project/grid/`), not here. All four pages are built
from this repo under the `/grid/` base and deployed each to its own folder
(`ownFolders`). The
platform around it — the hub, the shared browser scripts at `/shared/`, the
registry, the backend, the infrastructure — is the **`playallday` repo**
(`../playallday`). Read its README before changing anything about how this game
meets the site.

## Commands

```sh
npm run dev          # http://localhost:5321 (run playallday's `npm run dev` too for /shared/*)
npm run typecheck    # tsc --noEmit; run it before saying a change is done
npm test             # the game's own tests (tests/); the engine's run in the engine
npm run build        # dist/: the home and each game's folder, built for /grid/
npm run deploy:dry   # build, then show what would change in the bucket
npm run deploy       # build, upload, purge Cloudflare
```

## Rules that are not negotiable

All the games share one origin, so a mistake here leaks into another game:

- The slugs `grid`, `grid-run`, `grid-memory` and `grid-zombies` are
  permanent. Each is a URL path, an analytics `game_id`, a save prefix and a
  board; changing one breaks saves, links and every stat.
- Build for `/grid/`. Never a root-absolute asset path (`/assets/...`): that
  is a different game's folder. Assets load relative, or through an `import`.
- Save only through `window.playallday.storage(<the game's slug>)`
  (`src/arcade/score.ts`), never a bare `localStorage` key — a bare `best` is
  every game's `best`.
- Track only through `window.playallday.track`, never `gtag`, and only the
  platform's events: `level_start`, `level_end`, `post_score`,
  `unlock_achievement`, `game_complete`. A GA4 property has a limited number of
  custom dimensions, so the games share one event list.
- Every `window.playallday` call is optional-chained. The scripts are absent on a
  bare dev server and can be blocked in a browser; the game must still play.
- `public/<slug>/hub.js` (one per game, sharing `public/hub-best.js`) is loaded
  by the hub itself. The file names must not change, and they must bring no CSS of their own — it uses the hub's classes so it follows the
  hub's theme.

## Where things are

`src/site.ts` is the one place the slugs, titles and descriptions live: `SLUG`
and friends for the home, `GAMES` for the three games (each one's board metric
and direction, colour and lines). The Vite pages and base path, the deploy's
folders, the canonical URLs, the Open Graph tags and the home's cabinets all
read it. The head tags the platform expects are added by the build only
(`vite.config.ts`, the engine's `headTagsPlugin`, one set per page), because
the dev server has no `/shared/` to point them at.

Each game is `src/games/<id>/`: `rules.ts` is the game as pure code (seeded by
engine-kit's `createRng`, tested in `tests/<id>.test.ts`), `art.ts` draws it
(and its `attract` loop, which the home's cabinet plays), `main.ts` is the
round on `src/arcade/page.ts`. The page gives every game the same canvas, top
bar, title and result cards, pause menu (with links to the other games), the
keyboard/pointer input and, for games that ask, the touch joystick
(`src/arcade/joystick.ts`, the engine's stick geometry on a plain canvas).
`src/arcade/theme.ts` is the look: the palette, tiles and boards. The look is
Neon Arcade (picked on the Mock-ups page), in dark and light: `src/arcade/mode.ts`
is the player's switch (a sun or moon in the home's top bar; the cards and the
pause menu in a game), kept in `storage('grid')`, and swaps `INK` in place. Draw
with `INK` so a piece follows the mode; Zombie's night town and Memory's
face-up tiles stay dark on purpose (`DARK`).

Memory Grid's pairs differ by shape and fill as well as colour, so it plays
without telling colours apart. Keep it that way: no piece in any game should
be told apart by colour alone.

A game in progress is kept, like a Space Pirates run: the page saves
`Round.save()` to the game's `run` key whenever it's paused, the tab goes away
or the page closes, and the title card then offers Continue, New game and Main
menu. Each game's rules have `save()` and take the saved data back in their
`create*` (random numbers through `src/arcade/rng.ts`'s `countedRng`, so a
restored game deals what the original would have). A finished game or a new
one drops it; New game on a Zombie save scores what it had (`forfeit`). Bump
`RUN_VERSION` in `src/arcade/page.ts` when a saved shape changes.

`src/arcade/score.ts` keeps each game's best and what the board last took, and
sends a signed-out best when the player signs in. Each game's board shape (the
metric, which way it wins, how it reads) is its `leaderboard` entry in the
hub's `games.json`; the two must agree with `GAMES`.

The dev pages (`npm run dev`, then `/dev/`) are the engine's `engine-dev` kit.
`src/pages.ts` lists every page: a dev page is its HTML in `dev/` plus one line
there, and `devPages` in `vite.config.ts` keeps them out of the build. The Art
page (`dev/art.ts`) draws everything the games draw by their own code
(`artSheet`): add each new drawing to it as it is made. The Mock-ups page
(`dev/mockups.ts`) sets the three looks for the face lift side by side. Notes
typed on a dev page land in `dev/notes/` and belong in the repo.

`legacy/` is the 2020 game and its scores server, as they were (tag
`start-2020`). Read it for how a game played; don't build on it.

## Deploying

`npm run deploy` syncs `dist/` into this game's folder of the
`playallday.games` bucket and purges Cloudflare. It refuses to write to a folder
that doesn't carry this game's marker (`grid.deploy.json`), so it cannot wipe
another game. Credentials come from aws-vault (`AWS_VAULT_PROFILE` in `.env`), never a
file in the repo; run deploys as the `aws-vault` skill says.

A new game in the arcade is a folder in `src/games/`, its page folder, an entry
in `GAMES`, and in the `playallday` repo its `games.json` entry (`"group":
"grid"`, its leaderboard) and card art in `site/thumbs/`. The slug redirects
(`/grid` → `/grid/` and each game's) come from the hub's games.json, applied by
the owner's `terraform apply` (done 2026-10-14); a new game's needs one too. The games are unlisted on the hub until the owner says
otherwise.

## The plan

The design is `docs/plan.md`, written before the game was. Read it first, and keep it
up to date as decisions change.

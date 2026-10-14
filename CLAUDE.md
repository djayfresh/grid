# The Grid (`grid`)

A game on playallday.games, served as one folder of that site: `/grid/`. The
platform around it — the hub, the shared browser scripts at `/shared/`, the
registry, the backend, the infrastructure — is the **`playallday` repo**
(`../playallday`). Read its README before changing anything about how this game
meets the site.

## Commands

```sh
npm run dev          # http://localhost:5321 (run playallday's `npm run dev` too for /shared/*)
npm run typecheck    # tsc --noEmit; run it before saying a change is done
npm test             # the game's own tests (tests/); the engine's run in the engine
npm run build        # dist/, built for /grid/
npm run deploy:dry   # build, then show what would change in the bucket
npm run deploy       # build, upload, purge Cloudflare
```

## Rules that are not negotiable

All the games share one origin, so a mistake here leaks into another game:

- The slug `grid` is permanent. It is the URL path and the analytics
  `game_id`; changing it breaks saves, links and every stat.
- Build for `/grid/`. Never a root-absolute asset path (`/assets/...`): that
  is a different game's folder. Assets load relative, or through an `import`.
- Save only through `window.playallday.storage('grid')` (`src/score.ts`),
  never a bare `localStorage` key — a bare `best` is every game's `best`.
- Track only through `window.playallday.track`, never `gtag`, and only the
  platform's events: `level_start`, `level_end`, `post_score`,
  `unlock_achievement`, `game_complete`. A GA4 property has a limited number of
  custom dimensions, so the games share one event list.
- Every `window.playallday` call is optional-chained. The scripts are absent on a
  bare dev server and can be blocked in a browser; the game must still play.
- `public/hub.js` is loaded by the hub itself. Its file name must not change, and
  it must bring no CSS of its own — it uses the hub's classes so it follows the
  hub's theme.

## Where things are

`src/site.ts` is the one place the slug, title and description live: the Vite
base path, the deploy's prefix check, the canonical URL and the Open Graph tags
all read it. The head tags the platform expects are added by the build only
(`vite.config.ts`, the engine's `headTagsPlugin`), because the dev server has no
`/shared/` to point them at.

`src/game.ts` started as a placeholder (drifting targets), and `tests/game.test.ts`
tests that placeholder. If it still is, say so rather than building around it;
when it goes, its test goes with it and the real game's tests take the folder.

The round's numbers are content, not code: `content/rounds/*.json`, shaped by
`src/roundFields.ts` (the type and the form's fields), read by `src/rounds.ts`,
picked with `?round=<id>`. `tests/content.test.ts` holds every file to those
fields. Content the real game has (levels, waves, words) takes the same shape.

The dev pages (`npm run dev`, then `/dev/`) are the engine's `engine-dev` kit.
`src/pages.ts` lists every page: a dev page is its HTML in `dev/` plus one line
there, and `devPages` in `vite.config.ts` keeps them out of the build. The Rounds
page edits `content/rounds/` through the dev server's store. The Art page
(`dev/art.ts`) draws everything the game draws by the game's own code
(`artSheet`): add each new drawing, image or atlas to it as it is made. The
Sounds page (`dev/sounds.ts`, `soundLab`) has a pad for each sound in
`src/sound.ts` and a slider for every number in its `SOUND`, with the game
beside it following the sliders: add each new sound to both as it is made.
The game's feel numbers (`TUNE`, in `src/game.ts`) get a panel of sliders
with `?tune` on the dev server (`src/tune.ts`, loaded only behind
`import.meta.env.DEV`); a number worth tuning goes in `TUNE`, with its range
there. When one is right, Copy on the panel and paste it back as the default.
 When the
game gets achievements (engine-ui's), add an Icons page on the engine's
`iconReview` (every icon in each state, with the toast). Notes typed on a dev
page land in `dev/notes/` and belong in the repo.

Playing together is a race in the placeholder: `src/multiplayer.ts` is the
rules (pure, the host's page the one writer, followers ask by intent),
`src/together.ts` the card, lobby, share link (`?room=<code>`) and board, on the
engine's `HostLink`/`FollowerLink`. It only appears on playallday.games, where
the rooms script is, so its tests use the engine's in-memory rooms
(`@djayfresh/engine-platform/testing`). Everything read off a room is checked
before it is believed: anyone in a room can send anything.

`src/score.ts` sends a finished round to the all-time leaderboard. The board's
shape (what the number is, which way it wins, how it reads) is this game's
`leaderboard` entry in the hub's `games.json`; the two must agree. A daily game
sends `submitDaily` and has a `daily` entry too (the playallday README).

## Deploying

`npm run deploy` syncs `dist/` into this game's folder of the
`playallday.games` bucket and purges Cloudflare. It refuses to write to a folder
that doesn't carry this game's marker (`grid.deploy.json`), so it cannot wipe
another game. Credentials come from aws-vault (`AWS_VAULT_PROFILE` in `.env`), never a
file in the repo; run deploys as the `aws-vault` skill says.

A new game also needs, once, in the `playallday` repo: its `games.json` entry,
its card art in `site/thumbs/`, and a `terraform apply` for the `/grid` →
`/grid/` redirect. The `new-game` skill there does all of it.

## The plan

The design is `docs/plan.md`, written before the game was. Read it first, and keep it
up to date as decisions change.

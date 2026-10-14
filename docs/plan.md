# Grid on playallday.games

Written 2026-10-13. Grid is three different games in one 2020 codebase: **Grid** (a 6x6
board: step to the flag, dodge the enemy, fewest moves wins), **Zombie** (top-down survival
on a road map, from the September 2026 work) and **Memory** (flip and match colour cards).
They come to playallday.games the way the AR Escape Room's mini-games did: one repo, a home
page, and each game a game of its own on the hub. The port is a complete face lift, and the
structure is built to take more games later.

## Starting point

- Tag `start-2020`: the 2020 code (plus the 2026 dependency fixes) as it was. The "then"
  screenshots are in djayfresh-com `shots/grid/`.
- `master` after the merge of `dev`: the September 2026 Zombie work (health and a game over,
  road grid, barricades and an objective, spawner houses, XP and perks, houses and driveways,
  frame-rate independent movement; `.claude/plans/zombie-game-fixes-and-features.md`).

## Shape

- **The new-game scaffold** (playallday `new-game` skill, `--kind 2d`) goes on top of this repo:
  Vite, the engine as a submodule at its latest release, `engine-ui`'s page (top bar, title
  and result cards, pause menu, share), saves through `window.playallday.storage`, analytics
  through `track`, the leaderboard client, dev pages, tests, deploy.
- **The 2020 code moves to `legacy/`** (`legacy/game`, `legacy/server`), kept for reference
  and for the then-and-now grabs, not built or deployed. The AR Escape Room keeps its old
  code the same way.
- **One home, one game per slug.** `grid` is the home at `/grid/`: the three games as
  cabinets, your bests, the boards. Each game is its own entry in `games.json` with
  `"group": "grid"`, its own page at `/<slug>/`, card art, guide and leaderboard, deployed
  from this repo as the escape room deploys its mini-games (`prefix: grid`, `ownFolders` for
  the games' slugs).
- **A game is a module.** `src/games/<game>/`: its rules (pure, tested in node), its view, its
  content (levels, waves) as files with a dev page to edit them, and an entry in one list the
  home, the build and the deploy read. A fourth game is a new folder and one line.

## High scores

The 2020 server (Express + socket.io, initials, `high-score.json`) is retired. Each game gets
a playallday board on its own slug, so each keeps its own direction with no platform change:

| Game | Board | Direction |
|---|---|---|
| Grid | Moves to clear all rounds | low |
| Memory | Points | high |
| Zombie | Score (XP from kills, rounds survived) | high |

Signed out or offline, the best per game stays in the save and is sent on sign-in (the
platform rule). The three 2020 scores (DJF 28 on Grid, TTT 10 on Zombie, DJF 108 on Memory)
can sit on the home as a "2020 high scores" plaque.

## Face lift

One visual system for the home and all three games, so they read as one arcade, with a
palette per game. The board is the motif: every game is drawn on a grid. Each game gets:

- New art for its pieces, drawn in code (`drawTarget`-style, reviewed on the Art dev page),
  sounds (Sounds dev page), and juice: movement easing, hits, wins.
- Touch and pointer play. Grid and Memory are tap games. Zombie needs a twin-stick touch
  layout, or `needs: keyboard` until it has one.
- Rules unchanged unless noted, so the 2020 game is recognisable in the new one.

## Milestones

1. **Scaffold and home.** Scaffold on top, `legacy/` move, the home page with the three
   cabinets (placeholders behind them). Deployed unlisted.
2. **Grid.** Rules ported and tested, the new look, its board, guide, card art.
3. **Memory.** The same.
4. **Zombie.** The biggest: the 2026 rules, the new look, touch controls, its board.
5. **Launch.** Redirects (`tf plan`, the owner applies), `deploy:api` for the boards, listed
   on the hub. djayfresh.com's Grid page gets then-and-now pairs and the embed.

Later: more games in the arcade, a daily (a seeded Grid board fits the dailies), and playing
together over playallday rooms (Memory head to head).

## To settle before milestone 1

- **Slugs and titles** (permanent once deployed). Proposed: home `grid` ("The Grid"); games
  `grid-run` ("Grid Run"), `grid-memory` ("Memory Grid"), `grid-zombies` ("Zombie Grid").
- **Art direction** for the face lift: mock-ups of two or three directions to pick from first.
- **Zombie on phones:** touch controls at launch, or keyboard and mouse only at first.

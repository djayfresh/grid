// Where the arcade is published, and what is in it. The Grid is a home at
// playallday.games/grid/ and a set of games, each a game of its own on the hub
// with its own folder (playallday.games/<slug>/), card, guide and leaderboard,
// the way the escape room's mini-games are. The playallday repo's games.json
// lists each one with "group": "grid". The build's pages, the deploy's folders,
// the head tags and the home's cabinets all read GAMES, so a new game is a
// folder in src/games/ and one entry here. Plain data: vite.config.ts and
// tools/ import it, so it must stay free of browser and Node APIs alike.

/** The home's permanent slug: its URL path and its analytics game_id. */
export const SLUG = 'grid';

export const TITLE = 'The Grid';

/** One sentence, the same one as the home's entry in the hub's games.json. */
export const DESCRIPTION = 'Three arcade games on one grid: race to the flag, match the pairs or hold off the zombies.';

export const SITE_ORIGIN = 'https://playallday.games';

/** The home's public page. */
export const GAME_URL = `${SITE_ORIGIN}/${SLUG}/`;

/** The home's path on the site, for the games' way back. */
export const HOME_PATH = `/${SLUG}/`;

export interface ArcadeGame {
  /** Permanent: the URL folder, the analytics game_id, the save prefix and the board. */
  slug: string;
  /** The folder in src/games/. */
  id: 'run' | 'memory' | 'zombies';
  title: string;
  /** The cabinet's one line on the home. */
  tagline: string;
  /** The page's meta and Open Graph description; the hub card's text is in games.json. */
  description: string;
  /** How a finished game scores, as its board reads it (games.json `leaderboard`). */
  metric: string;
  /** Which way wins: fewer moves, or more points. */
  direction: 'low' | 'high';
  /** The game's colour on the home and in its page (src/arcade/theme.ts). */
  accent: string;
  /** The year the game was first made, for the home's plaque. */
  since: number;
}

export const GAMES: readonly ArcadeGame[] = [
  {
    slug: 'grid-run',
    id: 'run',
    title: 'Grid Run',
    tagline: 'Reach the flag in as few moves as you can.',
    description: 'Step across the grid to the flag in as few moves as you can. Touch a red square and the board starts over. Every flag adds another red square, 25 boards in all.',
    metric: 'Moves',
    direction: 'low',
    accent: '#3ef0b0',
    since: 2020,
  },
  {
    slug: 'grid-memory',
    id: 'memory',
    title: 'Memory Grid',
    tagline: 'Flip the tiles and match all 18 pairs.',
    description: 'Flip two tiles at a time and find all 18 matching pairs. Each pair has its own shape and fill. A match earns points, a miss costs them.',
    metric: 'Points',
    direction: 'high',
    accent: '#b69bff',
    since: 2020,
  },
  {
    slug: 'grid-zombies',
    id: 'zombies',
    title: 'Zombie Grid',
    tagline: 'Reach the safe house, then survive the next round.',
    description: 'Walk the streets of a zombie town, shoot down the zombies, their spawner houses and the barricade on the road out, and reach the safe house. Each round is harder, and every level makes you quicker on your feet and on the trigger.',
    metric: 'Score',
    direction: 'high',
    accent: '#b6f53c',
    since: 2020,
  },
];

export const gameUrl = (g: ArcadeGame): string => `${SITE_ORIGIN}/${g.slug}/`;

/** The game's page in this repo: built for /grid/, deployed to its own folder. */
export const gamePage = (g: ArcadeGame): string => `${g.slug}/index.html`;

export const gameById = (id: ArcadeGame['id']): ArcadeGame => {
  const g = GAMES.find((x) => x.id === id);
  if (!g) throw new Error(`No game ${id} in GAMES`);
  return g;
};

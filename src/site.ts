// Where the game is published. It lives at playallday.games/grid/, one path
// among the other games on that domain (the hub and the shared scripts are in
// the playallday repo). The build's base path, the deploy's S3 prefix check and
// the canonical link all read these. Plain data: vite.config.ts and tools/
// import it, so it must stay free of browser and Node APIs alike.

/** The game's permanent slug: its URL path and its analytics game_id. */
export const SLUG = 'grid';

export const TITLE = 'The Grid';

/** One sentence, the same one as this game's entry in the hub's games.json. */
export const DESCRIPTION = 'Pick a game on the grid: race to the flag, match the colours or hold off the zombies.';

export const SITE_ORIGIN = 'https://playallday.games';

/** The game's public home page. */
export const GAME_URL = `${SITE_ORIGIN}/${SLUG}/`;

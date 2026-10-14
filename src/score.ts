import { toast } from '@djayfresh/engine-ui';
import { SLUG } from './site';

// Saves, the leaderboard and analytics. Every save goes through
// window.playallday.storage(SLUG), which prefixes the key with the slug
// ("grid:best"): all the games share one origin, so a bare "best" would be
// some other game's "best" too. The shared scripts can be missing (blocked, or
// a dev server without the playallday repo's `npm run dev` behind it), so every
// call is optional-chained and the game plays on without them rather than
// breaking.

const store = window.playallday?.storage?.(SLUG);

/** Signed in, the game's saves follow the player to their other devices. */
export const saves = window.playallday?.sync?.(SLUG, {
  // Both devices set a best since they last synced: the higher one is the
  // player's best, not whichever happened to sync last.
  merge: (key, mine, theirs) => (key === store?.key('best') ? String(Math.max(Number(mine ?? 0), Number(theirs ?? 0))) : undefined),
});

export const bestScore = (): number => store?.getJSON<number>('best', 0) ?? 0;

/** Keeps the score if it's a new best, reports it, and says whether it beat the old one. */
export function recordScore(score: number): boolean {
  const beat = score > bestScore();
  if (beat) store?.setJSON('best', score);
  // Only the platform's event list: a GA4 property has a limited number of
  // custom dimensions, so every game reports the same events with the same
  // params (the playallday README, Rules every game follows).
  window.playallday?.track?.('post_score', { score, level: 1 });
  // The all-time board: this game's `leaderboard` entry in the hub's games.json
  // says how the number reads. The server keeps only the player's best, and
  // signed out it is a no-op. A daily game sends submitDaily instead; a game
  // with a board per level passes { key }. The board being down is not the
  // game's problem.
  void window.playallday?.leaderboard
    ?.submit(SLUG, score)
    .then((result) => {
      if (result.updated) toast('On the leaderboard');
    })
    .catch(() => undefined);
  return beat;
}

export const roundStarted = (): void => window.playallday?.track?.('level_start', { level_name: 'round' });

export const roundEnded = (success: boolean): void => window.playallday?.track?.('level_end', { level_name: 'round', success });

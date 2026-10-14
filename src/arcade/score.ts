import { toast } from '@djayfresh/engine-ui';
import type { ArcadeGame } from '../site';

// Saves, the leaderboard and analytics for one game of the arcade. Every save
// goes through window.playallday.storage(slug), which prefixes the key with the
// game's slug ("grid-run:best"): all the games share one origin. The shared
// scripts can be missing (blocked, or a bare dev server), so every call is
// optional-chained and the game plays on without them.
//
// A score made signed out or offline is never dropped (the platform's rule):
// the best stays in the save beside what the board last took ("sent"), and the
// difference goes to the board once the player signs in.

export interface Scores {
  /** The player's best, or null before their first finished game. */
  best(): number | null;
  /** Keeps the score if it's a new best, reports it, sends it to the board. Says whether it beat the old best. */
  record(score: number): boolean;
  /** Resolves once the first sync is in, so the title card shows this player's best. */
  ready: Promise<unknown>;
  started(level?: string): void;
  ended(success: boolean, level?: string): void;
}

/** a beats b, in the game's direction. */
export const beats = (direction: ArcadeGame['direction'], a: number, b: number | null): boolean =>
  b === null || (direction === 'low' ? a < b : a > b);

/** The board takes whole numbers from 0 up. */
export const boardScore = (score: number): number => Math.max(0, Math.round(score));

export function createScores(game: ArcadeGame): Scores {
  const pad = typeof window === 'undefined' ? undefined : window.playallday;
  const store = pad?.storage?.(game.slug);
  const better = (a: number, b: number | null): boolean => beats(game.direction, a, b);
  const read = (key: string): number | null => {
    const v = store?.getJSON<number | null>(key, null) ?? null;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  };

  // Two devices each set a best since they last synced: the better one wins.
  const saves = pad?.sync?.(game.slug, {
    merge: (key, mine, theirs) => {
      if (key !== store?.key('best')) return undefined;
      const a = mine == null ? null : Number(mine);
      const b = theirs == null ? null : Number(theirs);
      if (a === null || !Number.isFinite(a)) return theirs ?? undefined;
      if (b === null || !Number.isFinite(b)) return mine ?? undefined;
      return String(better(a, b) ? a : b);
    },
  });

  function submit(score: number, announce: boolean): void {
    void pad?.leaderboard
      ?.submit(game.slug, boardScore(score))
      .then((result) => {
        if (result.skipped) return; // signed out: it waits in the save
        store?.setJSON('sent', score);
        if (result.updated && announce) toast('On the leaderboard');
      })
      .catch(() => undefined);
  }

  // Signed in (now, or on a later visit): send the best the board hasn't had.
  pad?.account?.onChange((me) => {
    if (!me.user) return;
    const best = read('best');
    if (best !== null && better(best, read('sent'))) submit(best, false);
  });

  return {
    best: () => read('best'),
    record(score: number): boolean {
      const beat = better(score, read('best'));
      if (beat) store?.setJSON('best', score);
      pad?.track?.('post_score', { score: boardScore(score), level: 1 });
      if (beat || read('sent') === null) submit(beat ? score : (read('best') ?? score), true);
      return beat;
    },
    ready: saves?.ready ?? Promise.resolve(),
    started: (level = 'game') => pad?.track?.('level_start', { level_name: level }),
    ended: (success, level = 'game') => pad?.track?.('level_end', { level_name: level, success }),
  };
}

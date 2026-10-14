import { DEFAULT_ROUND, type Round } from './roundFields';

// Every round in content/rounds/, bundled into the game at build time. The dev
// editor writes these files; the game reads them here and nowhere else.
const files = import.meta.glob<Round>('../content/rounds/*.json', { eager: true, import: 'default' });

export const ROUNDS: readonly Round[] = Object.values(files).sort((a, b) => a.id.localeCompare(b.id));

/** The round `?round=<id>` names, or the default one. */
export function roundFor(id: string | null): Round {
  const round = ROUNDS.find((r) => r.id === id) ?? ROUNDS.find((r) => r.id === DEFAULT_ROUND) ?? ROUNDS[0];
  if (!round) throw new Error('content/rounds/ has no rounds.');
  return round;
}

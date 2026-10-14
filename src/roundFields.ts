import type { Field } from '@djayfresh/engine-dev';

// What a round is, and the form that edits one. Plain data, so the game, its
// tests and the dev editor (dev/rounds.ts) all read the same list; the import is
// a type only, so none of the dev kit reaches the published game.
//
// A round is the placeholder's content: one file per round in content/rounds/,
// written by the editor on the dev server (`npm run dev`, then /dev/). When the
// real game has levels, waves or a word list instead, this is where its shape
// goes, and the editor, the content test and the game follow.

export interface Round {
  /** The file's name in content/rounds/, and `?round=` in the game's address. */
  id: string;
  name: string;
  /** How long a round lasts. */
  seconds: number;
  /** How long a target lives before it fades out. */
  targetLife: number;
  /** Seconds between targets appearing. */
  spawnEvery: number;
  /** Targets on screen at once, at most. */
  maxTargets: number;
  /** Seconds a tap on nothing costs. */
  missPenalty: number;
}

export const ROUND_FIELDS: Field[] = [
  { key: 'id', type: 'text', required: true, pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, patternHint: 'should be lower-case words joined by hyphens.' },
  { key: 'name', type: 'text', required: true },
  { key: 'seconds', type: 'number', min: 5, max: 600, integer: true, required: true },
  { key: 'targetLife', type: 'number', min: 0.3, max: 10, step: 0.1, required: true, help: 'Seconds a target stays before it fades.' },
  { key: 'spawnEvery', type: 'number', min: 0.1, max: 10, step: 0.1, required: true, help: 'Seconds between targets.' },
  { key: 'maxTargets', type: 'number', min: 1, max: 20, integer: true, required: true },
  { key: 'missPenalty', type: 'number', min: 0, max: 10, step: 0.1, required: true, help: 'Seconds a tap on nothing costs.' },
];

/** The round the game plays when the address names none. */
export const DEFAULT_ROUND = 'classic';

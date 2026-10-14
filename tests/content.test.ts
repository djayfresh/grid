// @vitest-environment happy-dom
import { fieldProblems } from '@djayfresh/engine-dev';
import { describe, expect, it } from 'vitest';
import { DEFAULT_ROUND, ROUND_FIELDS } from '../src/roundFields';
import { roundFor, ROUNDS } from '../src/rounds';

// Every file in content/ against the same fields the dev editor's form is made
// of, so a file edited by hand is held to what the editor would let through.
describe('the rounds in content/rounds/', () => {
  it('has the default round', () => {
    expect(ROUNDS.some((r) => r.id === DEFAULT_ROUND)).toBe(true);
    expect(roundFor(null).id).toBe(DEFAULT_ROUND);
    expect(roundFor('no-such-round').id).toBe(DEFAULT_ROUND);
  });

  it('are each what the editor would save', () => {
    for (const round of ROUNDS) expect(fieldProblems(ROUND_FIELDS, { ...round }), round.id).toEqual([]);
  });

  it('are each named for their file', () => {
    const files = Object.keys(import.meta.glob('../content/rounds/*.json')).map((f) => f.replace(/^.*\/(.+)\.json$/, '$1'));
    expect([...files].sort()).toEqual(ROUNDS.map((r) => r.id).sort());
  });
});

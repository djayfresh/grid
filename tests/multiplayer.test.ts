import { FollowerLink, HostLink } from '@djayfresh/engine-platform';
import { flush, installFakeRooms } from '@djayfresh/engine-platform/testing';
import { describe, expect, it } from 'vitest';
import { RACE, type RaceState, standings } from '../src/multiplayer';

// The race's rules, alone and then over the engine's in-memory rooms: the same
// HostLink and FollowerLink the page uses, with no network.

const started = (): RaceState => RACE.apply(RACE.initial(), { type: 'start', seed: 42 }, 0);

describe('the race rules', () => {
  it('starts each race from nothing, and counts the races', () => {
    let s = started();
    s = RACE.apply(s, { type: 'score', seat: 'a', score: 3, done: false }, 0);
    s = RACE.apply(s, { type: 'start', seed: 7 }, 0);
    expect(s).toEqual({ race: { seed: 7, number: 2 }, runners: {} });
  });

  it('never takes a score back, and keeps a finished run finished', () => {
    let s = started();
    s = RACE.apply(s, { type: 'score', seat: 'a', score: 5, done: false }, 0);
    expect(RACE.apply(s, { type: 'score', seat: 'a', score: 4, done: false }, 0)).toBe(s);
    s = RACE.apply(s, { type: 'score', seat: 'a', score: 6, done: true }, 0);
    expect(RACE.apply(s, { type: 'score', seat: 'a', score: 9, done: false }, 0)).toBe(s);
  });

  it('believes nothing that arrives in the wrong shape', () => {
    expect(RACE.readEvent({ type: 'score', seat: 'a', score: -1, done: false })).toBe(null);
    expect(RACE.readEvent({ type: 'start', seed: 1.5 })).toBe(null);
    expect(RACE.readIntent?.({ type: 'score', score: 2 })).toBe(null);
    expect(RACE.readSettings({ round: '../x' })).toBe(null);
    expect(RACE.readState({ race: null, runners: { a: { score: 'lots', done: false } } })).toBe(null);
    expect(RACE.readState(started())).toEqual(started());
  });

  it('ranks the board best first, with "You" for this player', () => {
    let s = started();
    s = RACE.apply(s, { type: 'score', seat: 'a', score: 2, done: true }, 0);
    s = RACE.apply(s, { type: 'score', seat: 'b', score: 5, done: false }, 0);
    expect(standings(s, 'a', new Map([['b', 'Sam']]))).toEqual([
      { name: 'Sam', score: 5, done: false, me: false },
      { name: 'You', score: 2, done: true, me: true },
    ]);
  });
});

describe('a race over the rooms', () => {
  it("puts a follower's score on everyone's board under the follower's own seat", async () => {
    const fake = installFakeRooms();
    const host = await HostLink.host(RACE, { settings: { round: 'classic' }, state: RACE.initial(), maxPlayers: 8, name: 'Host' });
    host.onIntent((intent, from) => host.send({ type: 'score', seat: from, score: intent.score, done: intent.done }));
    const follower = await FollowerLink.join(RACE, host.code, { name: 'Sam' });
    await flush();
    expect(follower.settings).toEqual({ round: 'classic' });

    host.send({ type: 'start', seed: 99 });
    await flush();
    expect(follower.state.race).toEqual({ seed: 99, number: 1 });

    follower.sendIntent({ type: 'score', score: 4, done: false });
    await flush();
    expect(host.state.runners[follower.me]).toEqual({ score: 4, done: false });
    expect(follower.state.runners[follower.me]).toEqual({ score: 4, done: false });
    expect(fake.hubs.size).toBe(1);
  });
});

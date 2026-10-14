import type { LiveRules } from '@djayfresh/engine-platform';
import { SLUG } from './site';

// Playing together, as the placeholder does it: a race. The host starts a
// round from one seed, so every player gets the same targets in the same
// places on their own device, and each player's score is shown to everyone as
// it changes. Swap the race for the real game's own together-mode when it has
// one; the shape stays the same.
//
// These are the rules, and nothing else: pure, the same on every device, and
// tested without a network (tests/multiplayer.test.ts). The room itself is the
// engine's (HostLink and FollowerLink from @djayfresh/engine-platform), on the
// platform's relay rooms, wired to the page in src/together.ts.
//
// One writer: the host's page holds the state and sends each change as an
// event. A follower never changes it; it asks (an intent: "my score is 7") and
// the host decides and sends the event. Anyone in a room can send anything, so
// every read below checks what arrived before it is believed.

/** What the room is made with: which round everyone races. */
export interface RaceSettings {
  round: string;
}

/** One player's race so far. */
export interface Runner {
  score: number;
  /** Their round has run out. */
  done: boolean;
}

export interface RaceState {
  /** The race under way: its seed, and a number that goes up each time the host starts one. */
  race: { seed: number; number: number } | null;
  /** Each player's score in this race, by seat. */
  runners: Record<string, Runner>;
}

export type RaceEvent = { type: 'start'; seed: number } | { type: 'score'; seat: string; score: number; done: boolean };

/** What a follower asks the host for: to have their score put on the board. */
export interface RaceIntent {
  type: 'score';
  score: number;
  done: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1_000_000;
const isSeed = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 0xffffffff;
const isSeat = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64;

function readRunner(v: unknown): Runner | null {
  return isRecord(v) && isCount(v.score) && typeof v.done === 'boolean' ? { score: v.score, done: v.done } : null;
}

export const RACE: LiveRules<RaceState, RaceEvent, RaceSettings, RaceIntent> = {
  game: SLUG,

  initial: () => ({ race: null, runners: {} }),

  apply(state, event) {
    if (event.type === 'start') {
      // A new race: everyone starts again from nothing.
      return { race: { seed: event.seed, number: (state.race?.number ?? 0) + 1 }, runners: {} };
    }
    if (!state.race) return state;
    const was = state.runners[event.seat];
    // A finished run stays finished, and a score never goes back (a late, out-of-order report).
    if (was?.done || (was && event.score < was.score)) return state;
    return { ...state, runners: { ...state.runners, [event.seat]: { score: event.score, done: event.done } } };
  },

  readEvent(data) {
    if (!isRecord(data)) return null;
    if (data.type === 'start' && isSeed(data.seed)) return { type: 'start', seed: data.seed };
    if (data.type === 'score' && isSeat(data.seat) && isCount(data.score) && typeof data.done === 'boolean') {
      return { type: 'score', seat: data.seat, score: data.score, done: data.done };
    }
    return null;
  },

  readState(data) {
    if (!isRecord(data) || !isRecord(data.runners)) return null;
    const race = data.race;
    if (race !== null && !(isRecord(race) && isSeed(race.seed) && isCount(race.number))) return null;
    const runners: Record<string, Runner> = {};
    for (const [seat, v] of Object.entries(data.runners)) {
      const runner = readRunner(v);
      if (!isSeat(seat) || !runner) return null;
      runners[seat] = runner;
    }
    return { race: race === null ? null : { seed: race.seed as number, number: race.number as number }, runners };
  },

  readSettings(settings) {
    return isRecord(settings) && typeof settings.round === 'string' && /^[a-z0-9-]{1,80}$/.test(settings.round) ? { round: settings.round } : null;
  },

  readIntent(data) {
    return isRecord(data) && data.type === 'score' && isCount(data.score) && typeof data.done === 'boolean' ? { type: 'score', score: data.score, done: data.done } : null;
  },
};

/** The board, best first: who, how many, and whether they have finished. `me` is shown as "You". */
export function standings(state: RaceState, me: string, names: ReadonlyMap<string, string>): { name: string; score: number; done: boolean; me: boolean }[] {
  return Object.entries(state.runners)
    .map(([seat, r]) => ({ name: seat === me ? 'You' : (names.get(seat) ?? 'Someone who left'), score: r.score, done: r.done, me: seat === me }))
    .sort((a, b) => b.score - a.score || Number(b.me) - Number(a.me));
}

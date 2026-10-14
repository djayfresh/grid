import { randomSeed } from '@djayfresh/engine-kit';
import { FollowerLink, HostLink, ROOM_CODE, roomsAvailable } from '@djayfresh/engine-platform';
import { type DialogHandle, el, openDialog, shareButton, toast } from '@djayfresh/engine-ui';
import { RACE, type RaceEvent, type RaceIntent, type RaceSettings, type RaceState, standings } from './multiplayer';
import { GAME_URL, SLUG, TITLE } from './site';

// "Play together" on the page: host a room or join one by its code (or by a
// share link, `?room=<code>`), wait in the lobby, race, see everyone's score.
// The rules are src/multiplayer.ts; the rooms are the platform's, so this only
// appears on playallday.games itself (`roomsAvailable()`): a bare dev server
// has no rooms script, and the game is the same game without it.

type Host = HostLink<RaceState, RaceEvent, RaceSettings, RaceIntent>;
type Follower = FollowerLink<RaceState, RaceEvent, RaceSettings, RaceIntent>;

/** Seats in a room, the host's included. */
const MAX_PLAYERS = 8;
/** The name a signed-out player races under when this device has no guest name yet. */
const GUEST = 'Player';

export interface TogetherOptions {
  /** The round this page races when it hosts. */
  round(): string;
  /** A race has begun: play `round` from `seed`, now. */
  onStart(seed: number, round: string): void;
  /** Where the board goes while in a room. */
  board: HTMLElement;
}

export interface Together {
  /** The title card's button, or null where there are no rooms. */
  readonly button: HTMLButtonElement | null;
  readonly inRoom: boolean;
  readonly hosting: boolean;
  /** This player's score changed, or their round ended. */
  report(score: number, done: boolean): void;
  /** The host starts a race, the first or another. */
  startRace(): void;
}

const linkTo = (code: string): string => window.playallday?.rooms?.link(SLUG, code) ?? `${GAME_URL}?room=${code}`;

function roomInAddress(): string | null {
  const url = new URL(location.href);
  const code = url.searchParams.get('room');
  if (!code) return null;
  // Used once: a reload should not rejoin a room that may be gone.
  url.searchParams.delete('room');
  history.replaceState(history.state, '', url);
  return code.trim().toUpperCase();
}

export function createTogether(options: TogetherOptions): Together {
  let host: Host | null = null;
  let follower: Follower | null = null;
  let lobby: DialogHandle | null = null;
  let raceSeen = 0;
  let sent = '';
  const who = el('p');

  const link = () => host ?? follower;
  const state = (): RaceState => link()?.state ?? RACE.initial();

  function draw(): void {
    const l = link();
    options.board.hidden = !l;
    if (!l) return;
    const names = new Map(l.others.map((o) => [o.id, o.name]));
    const rows = standings(state(), l.me, names);
    options.board.textContent = rows.length ? rows.map((r) => `${r.name} ${r.score}${r.done ? ' ✓' : ''}`).join(' · ') : `Room ${l.code}`;
    const here = l.others.map((o) => o.name);
    who.textContent = here.length ? `Here: you, ${here.join(', ')}.` : 'Nobody else is here yet.';
  }

  function leave(): void {
    link()?.leave();
    host = null;
    follower = null;
    raceSeen = 0;
    lobby?.close();
    draw();
  }

  function openLobby(): void {
    const l = link()!;
    lobby?.close();
    draw();
    lobby = openDialog({
      title: `Room ${l.code}`,
      body: [
        host ? 'Send the room to whoever you are racing. Everyone plays the same round, and sees everyone else score.' : 'You are in. The race starts when the host starts it.',
        shareButton({ url: linkTo(l.code), title: `${TITLE}: race me`, text: `Room ${l.code}`, note: 'Anyone who opens the link joins this room.' }, 'Share the room'),
        who,
      ],
      actions: [...(host ? [{ label: 'Start the race', primary: true, onPress: () => startRace() }] : []), { label: 'Leave the room', danger: true, onPress: leave }],
      onClose: () => (lobby = null),
    });
  }

  async function hostRoom(): Promise<void> {
    try {
      host = await HostLink.host(RACE, { settings: { round: options.round() }, state: RACE.initial(), maxPlayers: MAX_PLAYERS, name: GUEST });
    } catch (e) {
      toast((e as Error).message);
      return;
    }
    const h = host;
    h.onFollowers(() => draw());
    // A follower's score goes on the board under the seat it came from, whatever it says about itself.
    h.onIntent((intent, from) => {
      h.send({ type: 'score', seat: from, score: intent.score, done: intent.done });
      draw();
    });
    openLobby();
  }

  async function joinRoom(code: string): Promise<boolean> {
    try {
      follower = await FollowerLink.join(RACE, code, { name: GUEST });
    } catch (e) {
      toast((e as Error).message);
      return false;
    }
    const f = follower;
    f.onChange((s) => {
      if (s.race && s.race.number !== raceSeen) {
        raceSeen = s.race.number;
        sent = '';
        lobby?.close();
        options.onStart(s.race.seed, f.settings.round);
      }
      draw();
    });
    f.onStatus(() => draw());
    f.onClosed((message) => {
      toast(message);
      follower = null;
      lobby?.close();
      draw();
    });
    openLobby();
    return true;
  }

  function choose(): void {
    const code = el('input', { class: 'room-code', type: 'text', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', maxlength: 5, 'aria-label': 'Room code', placeholder: 'CODE' });
    const card = openDialog({
      title: 'Play together',
      body: ['Race the same round as your friends, each on your own phone. Host a room, or join one with its code.', code],
      actions: [
        { label: 'Host a room', primary: true, onPress: () => void hostRoom() },
        {
          label: 'Join',
          keepOpen: true,
          onPress: () => {
            const wanted = code.value.trim().toUpperCase();
            if (!ROOM_CODE.test(wanted)) return toast('A room code is 5 letters and numbers.');
            card.close();
            void joinRoom(wanted);
          },
        },
      ],
    });
  }

  function startRace(): void {
    if (!host) return;
    const seed = randomSeed();
    sent = '';
    lobby?.close();
    host.send({ type: 'start', seed });
    raceSeen = host.state.race?.number ?? 0;
    options.onStart(seed, host.settings.round);
    draw();
  }

  const button = roomsAvailable() ? el('button', { type: 'button', class: 'link', text: 'Play together' }) : null;
  button?.addEventListener('click', choose);

  const code = roomsAvailable() ? roomInAddress() : null;
  if (code && ROOM_CODE.test(code)) void joinRoom(code);

  return {
    button,
    get inRoom() {
      return !!link();
    },
    get hosting() {
      return !!host;
    },
    report(score, done) {
      const l = link();
      if (!l || !l.state.race) return;
      const key = `${score}:${done}`;
      if (key === sent) return;
      sent = key;
      if (host) host.send({ type: 'score', seat: host.me, score, done });
      else follower?.sendIntent({ type: 'score', score, done });
      draw();
    },
    startRace,
  };
}

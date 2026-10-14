import { formatTime } from '@djayfresh/engine-kit';
import { type DialogHandle, openDialog, pauseMenu, shareButton, toast, topBar } from '@djayfresh/engine-ui';
import { createGame } from './game';
import { createLoop } from './loop';
import { roundFor } from './rounds';
import { createTogether } from './together';
import { bestScore, recordScore, roundEnded, roundStarted, saves } from './score';
import { DESCRIPTION, GAME_URL, TITLE } from './site';
import { miss, pop, roundOver } from './sound';
import './style.css';

// Boot. Builds the page's chrome from the engine's kit (@djayfresh/engine-ui:
// the top bar, the cards, the pause menu, toasts), then moves between the two
// states this skeleton has: a card (the title, or the last round's result) and
// a round in play. Nothing is read from storage until the first sync is in, so
// a signed-in player opening the game on a new phone sees their own best rather
// than that device's empty one.

// The dev server's ?tune: a panel of sliders over the game's numbers
// (src/tune.ts). Behind import.meta.env.DEV, so the published game has none of it.
if (import.meta.env.DEV) {
  const tune = new URLSearchParams(location.search).get('tune');
  if (tune !== null) void import('./tune').then((m) => m.startTuning(tune));
}

const canvas = document.getElementById('stage') as HTMLCanvasElement | null;
if (!canvas) throw new Error('index.html has no #stage');

// The score and the clock: the game's own elements, slotted into the kit's bar.
const scoreOut = Object.assign(document.createElement('span'), { textContent: '0' });
const clockOut = document.createElement('span');
const hud = document.createElement('span');
hud.className = 'hud';
hud.append(scoreOut, ' · ', clockOut);

// The round to play: content/rounds/classic.json, or the one ?round= names (the
// dev server's Rounds page links each round that way).
let round = roundFor(new URLSearchParams(location.search).get('round'));
const game = createGame(canvas, round);
clockOut.textContent = formatTime(round.seconds);
const loop = createLoop(
  (step) => game.update(step),
  () => {
    game.render();
    scoreOut.textContent = String(game.score);
    clockOut.textContent = formatTime(game.timeLeft);
    together.report(game.score, false);
    if (game.over) finish();
  },
);

// Escape or P, a Pause button in the bar, and the tab going away: the loop
// stops, the card says where the round is, and Share is on it (the kit's
// share: the phone's own panel, or a sheet with a QR code and Copy link). The
// menu shows and hides its button only as it opens and closes, so a round
// starting and ending shows and hides it here.
const pause = pauseMenu({
  note: () => `${game.score} so far, ${formatTime(game.timeLeft)} left.`,
  canPause: () => loop.running,
  onPause: () => loop.stop(),
  onResume: () => loop.start(),
  share: { url: GAME_URL, title: TITLE, text: DESCRIPTION },
  items: [{ label: 'All games', onPress: () => location.assign('/') }],
});
const pauseButton = pause.button('Pause');
pauseButton.classList.add('pause');

// The bar across the top: back to the hub, the title, the score and clock, Pause.
// Then, under it, everyone's score while playing together.
const bar = topBar({ title: TITLE, right: [hud, pauseButton] });
const board = document.createElement('p');
board.className = 'board';
board.hidden = true;
bar.element.after(board);

// The card's lines: the game's own elements, so a sync or a room can change them while it is up.
const cardText = document.createElement('p');
const cardBest = document.createElement('p');
cardBest.className = 'best';
const links = document.createElement('p');
links.className = 'links';
let card: DialogHandle | null = null;

function showBest(): void {
  const best = bestScore();
  cardBest.textContent = best > 0 ? `Best: ${best}` : '';
}

/** The title card or the result: a heading, a line, the best, one button, and the links. */
function showCard(heading: string, text: string, button: string): void {
  cardText.textContent = text;
  showBest();
  card?.close();
  // In someone else's room, the next race is theirs to start.
  const waiting = together.inRoom && !together.hosting;
  card = openDialog({
    title: heading,
    body: [cardText, cardBest, links],
    actions: [
      waiting
        ? { label: 'Waiting for the host', keepOpen: true, onPress: () => toast('The host starts the next race.') }
        : { label: button, primary: true, keepOpen: true, onPress: start },
    ],
    // The card is the way into a round: Escape or a tap beside it does not close it.
    onDismiss: 'none',
    onClose: () => (card = null),
  });
}

// Playing together (src/together.ts): on playallday.games, a Play together
// button hosts or joins a room, and a race the host starts plays here from the
// host's seed, so everyone gets the same targets. The board under the bar shows
// everyone's score as it changes.
const together = createTogether({
  round: () => round.id,
  onStart: (seed, id) => {
    round = roundFor(id);
    play(seed);
  },
  board,
});

/** Play, from the title card or the result: a race for everyone when hosting, else a round alone. */
function start(): void {
  if (together.hosting) together.startRace();
  else if (!together.inRoom) play();
}

function play(seed?: number): void {
  card?.close();
  pause.resume();
  game.reset(seed, round);
  scoreOut.textContent = '0';
  clockOut.textContent = formatTime(round.seconds);
  roundStarted();
  loop.start();
  pauseButton.hidden = false;
}

function finish(): void {
  loop.stop();
  pauseButton.hidden = true;
  const score = game.score;
  together.report(score, true);
  const beat = recordScore(score);
  roundOver(beat);
  // A timed round always runs to its end, so it always "succeeded". A game that
  // can be lost passes that here instead.
  roundEnded(true);
  showCard(beat ? 'New best!' : 'Time!', `You popped ${score} ${score === 1 ? 'target' : 'targets'}.`, 'Play again');
}

// pointerdown covers mouse, touch and pen at once, and fires without the click
// delay a tap has. The canvas is sized in CSS pixels, which is what the game
// thinks in, so the bounding rect is the whole conversion.
canvas.addEventListener('pointerdown', (e) => {
  if (!loop.running) return;
  const rect = canvas.getBoundingClientRect();
  const before = game.score;
  game.pointer(e.clientX - rect.left, e.clientY - rect.top);
  if (game.score > before) pop();
  else miss();
});

// The canvas fills its box in CSS, so its pixel buffer has to be re-made
// whenever that box changes: a rotated phone, a resized window, a keyboard
// opening. ResizeObserver catches all of them. Re-making the buffer blanks it,
// so a frame is drawn straight after: the game shows behind a card too.
new ResizeObserver(() => {
  game.fit();
  game.render();
}).observe(canvas);

// Another device's save just landed: the best on show may be out of date.
window.addEventListener('playallday:sync', showBest);

// The links under the card: Share (the phone's own panel, or the kit's sheet
// with a QR code and the rest), and, once account.js has actually loaded, Sign
// in and Feedback. Accounts are optional and the game must work signed out,
// offline or with the script blocked, so those two only appear when it is there.
// A link to the game. A result, a room code or a level is shared the same way:
// its url (or a code as text) and a line about it.
if (together.button) links.append(together.button);
links.append(shareButton({ url: GAME_URL, title: TITLE, text: DESCRIPTION }, 'Share', 'link'));
const account = window.playallday?.account;
if (account) {
  const add = (label: string, run: () => void): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'link';
    button.textContent = label;
    button.addEventListener('click', run);
    links.append(button);
    return button;
  };
  add('Sign in', () => void account.open()).dataset.signIn = '';
  add('Feedback', () => void account.feedback());
  account.onChange((me) => {
    const signIn = links.querySelector<HTMLButtonElement>('button[data-sign-in]');
    if (signIn) signIn.textContent = me.user ? me.user.name : 'Sign in';
  });
}

// The first sync resolves at once when signed out, and after a couple of seconds
// at worst when signed in, so the title card is never held up for long.
void (saves?.ready ?? Promise.resolve()).then(() => {
  game.fit();
  game.render();
  showCard(TITLE, DESCRIPTION, 'Play');
});

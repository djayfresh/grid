import { type DialogHandle, openDialog, pauseMenu, shareButton, topBar } from '@djayfresh/engine-ui';
import { createLoop } from '../loop';
import { type ArcadeGame, GAMES, gameUrl, HOME_PATH, TITLE } from '../site';
import { createStick, type Stick } from './joystick';
import { createScores, type Scores } from './score';
import { backdrop } from './theme';
import '../style.css';

// One game's page: the engine's kit around a canvas (the top bar with the way
// back to the Grid's home, the title and result cards, the pause menu, Share),
// the fixed-step loop, input, and the game's scores. Every game in the arcade
// runs inside this, so they behave the same; the game itself only knows how to
// play a round on a canvas (Round, below).

export interface Input {
  /** Keys held, by KeyboardEvent.code ("KeyW", "ArrowUp", "Space"). */
  readonly keys: ReadonlySet<string>;
  /** The mouse or the last touch outside the stick, in canvas CSS pixels. */
  readonly pointer: { x: number; y: number; down: boolean; touch: boolean };
  /** The touch stick, on games that ask for one. */
  readonly stick: Stick | null;
}

export interface Result {
  heading: string;
  text: string;
  /** Finished (true) or lost (false), for level_end. */
  success: boolean;
  /** The number the board takes; omitted when a lost game doesn't score. */
  score?: number;
}

export interface Round {
  /** A fresh game. */
  reset(seed?: number): void;
  /** One fixed step, in seconds. */
  update(step: number): void;
  render(): void;
  /** The canvas changed size. */
  fit(width: number, height: number): void;
  /** A tap or click, in canvas CSS pixels. */
  pointer?(x: number, y: number): void;
  /** The bar's line while playing ("12 moves · board 3/25"). */
  hud(): string;
  /** Set once the game has ended. */
  readonly result: Result | null;
}

export interface PageSpec {
  game: ArcadeGame;
  /** Builds the round on the page's canvas. `ctx` draws in CSS pixels. */
  create(ctx: CanvasRenderingContext2D, input: Input): Round;
  /** The title card's line under the title: how to play, in a sentence. */
  intro: string;
  /** Show the touch stick on touch devices. */
  stick?: boolean;
}

export interface Page {
  scores: Scores;
}

export function arcadePage(spec: PageSpec): Page {
  const { game } = spec;
  document.documentElement.style.setProperty('--accent', game.accent);
  const scores = createScores(game);

  const main = document.createElement('main');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', game.title);
  main.append(canvas);
  document.body.prepend(main);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser has no 2D canvas.');

  // Input: held keys, the pointer, and on touch devices the stick.
  const keys = new Set<string>();
  const pointer = { x: 0, y: 0, down: false, touch: false };
  const touchDevice = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const stick = spec.stick && touchDevice ? createStick(canvas) : null;
  window.addEventListener('keydown', (e) => {
    if (loop.running && /^(Arrow|Space)/.test(e.code)) e.preventDefault();
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  const at = (e: PointerEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = at(e);
    if (stick && e.pointerType === 'touch' && stick.owns(x, canvas.clientWidth)) return;
    pointer.x = x;
    pointer.y = y;
    pointer.touch = e.pointerType === 'touch';
  });
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = at(e);
    if (stick && e.pointerType === 'touch' && stick.owns(x, canvas.clientWidth)) return;
    pointer.x = x;
    pointer.y = y;
    pointer.down = true;
    pointer.touch = e.pointerType === 'touch';
    if (loop.running) round.pointer?.(x, y);
  });
  const lift = (): void => {
    pointer.down = false;
  };
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);

  const input: Input = { keys, pointer, stick };
  const round = spec.create(ctx, input);

  let width = 1;
  let height = 1;
  function fit(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    round.fit(width, height);
  }
  function draw(): void {
    round.render();
    stick?.draw(ctx!, game.accent);
  }

  const hud = document.createElement('span');
  hud.className = 'hud';
  const loop = createLoop(
    (step) => round.update(step),
    () => {
      draw();
      hud.textContent = round.hud();
      if (round.result) finish();
    },
  );

  const pause = pauseMenu({
    note: () => round.hud(),
    canPause: () => loop.running,
    onPause: () => loop.stop(),
    onResume: () => loop.start(),
    share: { url: gameUrl(game), title: game.title, text: game.description },
    items: [
      { label: `All ${TITLE} games`, onPress: () => location.assign(HOME_PATH) },
      { label: 'All games', onPress: () => location.assign('/') },
    ],
  });
  const pauseButton = pause.button('Pause');
  pauseButton.classList.add('pause');
  pauseButton.hidden = true;
  topBar({ back: { href: HOME_PATH, label: TITLE }, title: game.title, right: [hud, pauseButton] });

  const cardText = document.createElement('p');
  const cardBest = document.createElement('p');
  cardBest.className = 'best';
  const links = document.createElement('p');
  links.className = 'links';
  let card: DialogHandle | null = null;

  // "Best: 28 moves", "Best: 136 points", but a score is just its number.
  const unit = game.metric === 'Score' ? '' : ` ${game.metric.toLowerCase()}`;
  function showBest(): void {
    const best = scores.best();
    cardBest.textContent = best === null ? '' : `Best: ${best}${unit}`;
  }

  function showCard(heading: string, text: string, button: string): void {
    cardText.textContent = text;
    showBest();
    card?.close();
    card = openDialog({
      title: heading,
      body: [cardText, cardBest, links],
      actions: [{ label: button, primary: true, keepOpen: true, onPress: play }],
      onDismiss: 'none',
      onClose: () => (card = null),
    });
  }

  function play(): void {
    card?.close();
    pause.resume();
    round.reset();
    fit();
    scores.started();
    loop.start();
    pauseButton.hidden = false;
  }

  function finish(): void {
    loop.stop();
    pauseButton.hidden = true;
    const result = round.result!;
    scores.ended(result.success);
    const beat = result.score === undefined ? false : scores.record(result.score);
    draw();
    // A first game of nothing (Zombie's 0) is the best so far, but no feat.
    const cheer = beat && (game.direction === 'low' || (result.score ?? 0) > 0);
    showCard(cheer ? 'New best!' : result.heading, result.text, 'Play again');
  }

  new ResizeObserver(() => {
    fit();
    if (!loop.running) draw();
  }).observe(canvas);
  window.addEventListener('playallday:sync', showBest);

  // The links under the card: the other games, Share, and Sign in and Feedback
  // once account.js has loaded (accounts are optional; the game plays without).
  for (const other of GAMES.filter((g) => g.slug !== game.slug)) {
    const a = document.createElement('a');
    a.className = 'link';
    a.href = `/${other.slug}/`;
    a.textContent = other.title;
    links.append(a);
  }
  links.append(shareButton({ url: gameUrl(game), title: game.title, text: game.description }, 'Share', 'link'));
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

  // Behind the title card: the board, empty, on the game's backdrop.
  void scores.ready.then(() => {
    fit();
    round.reset();
    backdrop(ctx, width, height, game.accent);
    draw();
    showCard(game.title, spec.intro, 'Play');
  });

  return { scores };
}

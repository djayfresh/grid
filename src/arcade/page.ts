import { type DialogAction, type DialogHandle, openDialog, pauseMenu, shareButton, topBar } from '@djayfresh/engine-ui';
import { createLoop } from '../loop';
import { type ArcadeGame, GAMES, gameUrl, HOME_PATH, MENU } from '../site';
import { createStick, type Stick } from './joystick';
import { initMode, modeButton, toggleMode } from './mode';
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
  /** A fresh game, or with `saved` (from save()) the one that was left. */
  reset(seed?: number, saved?: unknown): void;
  /** The game in progress as plain data, kept when it's paused or left. */
  save?(): unknown;
  /** The saved game in a line, for the Continue card: "Round 3, 120 points". */
  progress?(): string;
  /** What a game in progress scores if the player starts over instead; none if it only counts at the end. */
  forfeit?(): number | undefined;
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
  initMode();
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

  // A game in progress is kept in the save whenever it's paused or left (the
  // pause menu pauses on its own when the tab goes away), the way Space Pirates
  // keeps a run: the title card then offers Continue. Each game says what it is
  // (Round.save); a finished game or a new one takes it out.
  const runStore = window.playallday?.storage?.(game.slug);
  const RUN_KEY = 'run';
  const RUN_VERSION = 1;
  function keepRun(): void {
    if (!round.save || round.result || !(loop.running || pause.paused)) return;
    try {
      const data = round.save();
      if (data) runStore?.setJSON(RUN_KEY, { v: RUN_VERSION, data });
    } catch {
      // No room or no storage: the game just doesn't carry over.
    }
  }
  function dropRun(): void {
    runStore?.remove(RUN_KEY);
  }
  function savedRun(): unknown {
    const run = runStore?.getJSON<{ v?: number; data?: unknown } | null>(RUN_KEY, null);
    return run && run.v === RUN_VERSION && run.data ? run.data : null;
  }
  window.addEventListener('pagehide', keepRun);
  // A phone can drop a page in the background without a pagehide; the pause
  // menu pauses (and so saves) on the way out, and this catches a game that
  // can't pause just then.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') keepRun();
  });

  const pause = pauseMenu({
    note: () => round.hud(),
    canPause: () => loop.running,
    onPause: () => {
      // Saved first: keepRun only keeps a game that's running or paused, and
      // the menu counts as paused only once this returns.
      keepRun();
      loop.stop();
    },
    onResume: () => loop.start(),
    share: { url: gameUrl(game), title: game.title, text: game.description },
    items: [
      { label: 'Main menu', onPress: () => location.assign(HOME_PATH) },
      { label: 'Light or dark mode', keepOpen: true, onPress: toggleMode },
      { label: 'All games', onPress: () => location.assign('/') },
    ],
  });
  const pauseButton = pause.button('Pause');
  pauseButton.classList.add('pause');
  pauseButton.hidden = true;
  topBar({ back: { href: HOME_PATH, label: MENU }, title: game.title, right: [hud, pauseButton] });

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

  function showCard(heading: string, text: string, button: string, onPress = play, more: DialogAction[] = []): void {
    cardText.textContent = text;
    showBest();
    card?.close();
    card = openDialog({
      title: heading,
      body: [cardText, cardBest, links],
      actions: [
        { label: button, primary: true, keepOpen: true, onPress },
        ...more,
        { label: 'Main menu', onPress: () => location.assign(HOME_PATH) },
      ],
      onDismiss: 'none',
      onClose: () => (card = null),
    });
  }

  function play(): void {
    dropRun();
    card?.close();
    pause.resume();
    round.reset();
    fit();
    scores.started();
    loop.start();
    pauseButton.hidden = false;
  }

  /** Back into the saved game, already set up behind the card. */
  function carryOn(): void {
    card?.close();
    fit();
    loop.start();
    pauseButton.hidden = false;
  }

  /** Starting over on a saved game: one that scores as it goes counts what it had. */
  function startOver(): void {
    const score = round.forfeit?.();
    if (score !== undefined) {
      scores.ended(false);
      scores.record(score);
    }
    play();
  }

  function finish(): void {
    loop.stop();
    pauseButton.hidden = true;
    const result = round.result!;
    dropRun();
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
  const mode = modeButton(true);
  mode.classList.add('link');
  links.append(mode);
  // The board behind a card or the pause menu redraws in the new colours.
  window.addEventListener('grid:theme', () => {
    if (loop.running) return;
    backdrop(ctx, width, height, game.accent);
    draw();
  });
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
    const saved = savedRun();
    if (saved) {
      try {
        round.reset(undefined, saved);
        fit();
        draw();
        showCard(game.title, `Game in progress: ${round.progress?.() ?? 'pick up where you left off'}.`, 'Continue', carryOn, [{ label: 'New game', keepOpen: true, onPress: startOver }]);
        return;
      } catch {
        // A save this version can't read: start fresh.
        dropRun();
        round.reset();
        fit();
      }
    }
    draw();
    showCard(game.title, spec.intro, 'Play');
  });

  return { scores };
}

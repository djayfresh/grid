// Dark or light, the player's pick. The arcade is drawn for the night first,
// so dark is the default unless the device says light; the toggle in every
// top bar overrides that and is kept in the arcade's save (storage('grid'),
// one choice for the home and all three games). It sets data-theme on <html>
// for the page's CSS, data-pad-theme for the engine's kit, and swaps the canvas
// palette (INK) in place, then says so with a `grid:theme` event so a canvas
// that isn't animating can redraw.

import { SLUG } from '../site';
import { DARK, INK, LIGHT } from './theme';

export type Mode = 'dark' | 'light';

const store = () => window.playallday?.storage?.(SLUG);

function saved(): Mode | null {
  try {
    const v = store()?.getJSON<string | null>('theme', null);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

const system = (): Mode => (matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

let mode: Mode = 'dark';

export const currentMode = (): Mode => mode;

function apply(next: Mode): void {
  mode = next;
  const root = document.documentElement;
  root.dataset.theme = next;
  root.setAttribute('data-pad-theme', next);
  Object.assign(INK, next === 'light' ? LIGHT : DARK);
  for (const b of buttons) label(b);
  window.dispatchEvent(new CustomEvent('grid:theme', { detail: next }));
}

const buttons = new Set<HTMLButtonElement>();

function label(b: HTMLButtonElement): void {
  // Says where a press takes you, like a light switch.
  const to = mode === 'dark' ? 'light' : 'dark';
  b.textContent = b.dataset.words !== undefined ? `${to === 'light' ? 'Light' : 'Dark'} mode` : to === 'light' ? '☀' : '☾';
  b.title = `Switch to ${to} mode`;
  b.setAttribute('aria-label', `Switch to ${to} mode`);
}

/** Applies the saved or the device's mode; call before anything is drawn. */
export function initMode(): void {
  apply(saved() ?? system());
  // A sync from another device can bring a different pick.
  window.addEventListener('playallday:sync', () => {
    const s = saved();
    if (s && s !== mode) apply(s);
  });
}

/** Switches and keeps the pick. */
export function toggleMode(): void {
  const next: Mode = mode === 'dark' ? 'light' : 'dark';
  try {
    store()?.setJSON('theme', next);
  } catch {
    // No save: the switch still works for this page.
  }
  apply(next);
}

/** A switch: a sun or moon for a top bar, or `words` ("Light mode") for a card's links. */
export function modeButton(words = false): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mode';
  if (words) b.dataset.words = '';
  label(b);
  buttons.add(b);
  b.addEventListener('click', toggleMode);
  return b;
}

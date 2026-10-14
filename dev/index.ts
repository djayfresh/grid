import { devIndex, devNav, devNotes, phoneLink } from '@djayfresh/engine-dev';
import { PAGES } from '../src/pages';

// The dev index: every dev page with a line each (from src/pages.ts), a note box
// for the game as a whole (kept in dev/notes/dev.json, so it is in the repo for
// whoever acts on it), and a QR code that opens this server on a phone on the
// same network.
devNav(PAGES);
const main = document.querySelector('main')!;
devIndex(PAGES, main);
const notes = await devNotes('dev');
main.append(notes.box('all', 'Notes on the game'));
main.append(Object.assign(document.createElement('h2'), { textContent: 'On a phone' }), phoneLink('/'));

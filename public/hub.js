// Loaded by the playallday.games hub, as a module, last (hubScript in the hub's
// games.json). It adds this game's progress to the slots the hub leaves for it —
// each card's .extras, and .hub-extras above the cards for anything bigger —
// using the hub's own classes (.pill, .pill.done, .meta), so it follows the
// hub's look and its light and dark themes. It brings no CSS of its own, and its
// file name must not change between deploys: the hub's HTML names it.
//
// The hub doesn't serve /shared/storage.js, so the save is read straight out of
// localStorage, under the same "<slug>:" prefix storage.js writes in the game.

const SLUG = 'grid';

function best() {
  try {
    const raw = localStorage.getItem(`${SLUG}:best`);
    const value = raw === null ? 0 : Number(JSON.parse(raw));
    return Number.isFinite(value) ? value : 0;
  } catch {
    // Storage blocked, or a save from an older version: no progress to show.
    return 0;
  }
}

function draw() {
  const extras = document.querySelector(`li[data-slug="${SLUG}"] .extras`);
  if (!extras) return;
  extras.textContent = '';
  const score = best();
  if (score <= 0) return;
  const pill = document.createElement('span');
  pill.className = 'pill';
  pill.textContent = `Best: ${score}`;
  extras.append(pill);
}

draw();
// The hub brings down every game's saves from the account after the page is up.
window.addEventListener('playallday:sync', draw);

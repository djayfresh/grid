// Shared by the three games' hub scripts (public/<slug>/hub.js): the player's
// best on that game's hub card. Loaded by the playallday.games hub as a module
// (hubScript in its games.json), from /grid/hub-best.js. It uses the hub's own
// .pill class so it follows the hub's look, brings no CSS of its own, and its
// file name must not change between deploys: the games' hub.js name it.
//
// The hub doesn't serve /shared/storage.js, so the save is read straight out of
// localStorage, under the same "<slug>:" prefix storage.js writes in the game.

function best(slug) {
  try {
    const raw = localStorage.getItem(`${slug}:best`);
    const value = raw === null ? null : Number(JSON.parse(raw));
    return Number.isFinite(value) ? value : null;
  } catch {
    // Storage blocked, or a save from an older version: no progress to show.
    return null;
  }
}

/** Keeps `slug`'s card showing its best, in `unit` ('' for a plain score). */
export function showBest(slug, unit) {
  const draw = () => {
    const extras = document.querySelector(`li[data-slug="${slug}"] .extras`);
    if (!extras) return;
    extras.textContent = '';
    const score = best(slug);
    if (score === null) return;
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = `Best: ${score}${unit ? ` ${unit}` : ''}`;
    extras.append(pill);
  };
  draw();
  // The hub brings down every game's saves from the account after the page is up.
  window.addEventListener('playallday:sync', draw);
}

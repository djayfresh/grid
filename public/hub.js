// Loaded by the playallday.games hub, as a module, last (hubScript in the hub's
// games.json). It adds this game's progress to the slots the hub leaves for it —
// each card's .extras, and .hub-extras above the cards for anything bigger —
// using the hub's own classes (.pill, .pill.done, .meta), so it follows the
// hub's look and its light and dark themes. It brings no CSS of its own, and its
// file name must not change between deploys: the hub's HTML names it.
//
// The hub doesn't serve /shared/storage.js, so the save is read straight out of
// localStorage, under the same "<slug>:" prefix storage.js writes in the game.

// The Grid's home and its three games each have a card. Each game's card gets
// its own best; the home's card gets the three together. The units match each
// game's leaderboard (src/site.ts GAMES, the hub's games.json).
const GAMES = [
  { slug: 'grid-run', title: 'Grid Run', unit: 'moves' },
  { slug: 'grid-memory', title: 'Memory', unit: 'points' },
  { slug: 'grid-zombies', title: 'Zombie', unit: 'score' },
];

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

function pill(text) {
  const el = document.createElement('span');
  el.className = 'pill';
  el.textContent = text;
  return el;
}

function fill(slug, pills) {
  const extras = document.querySelector(`li[data-slug="${slug}"] .extras`);
  if (!extras) return;
  extras.textContent = '';
  extras.append(...pills);
}

function draw() {
  const home = [];
  for (const g of GAMES) {
    const score = best(g.slug);
    if (score === null) {
      fill(g.slug, []);
      continue;
    }
    const text = g.unit === 'score' ? `${score}` : `${score} ${g.unit}`;
    fill(g.slug, [pill(`Best: ${text}`)]);
    home.push(pill(`${g.title}: ${text}`));
  }
  fill('grid', home);
}

draw();
// The hub brings down every game's saves from the account after the page is up.
window.addEventListener('playallday:sync', draw);

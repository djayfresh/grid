import { devNav, jsonEditor, jsonStore } from '@djayfresh/engine-dev';
import { PAGES } from '../src/pages';
import { ROUND_FIELDS, type Round } from '../src/roundFields';

// The rounds editor: the files in content/rounds/ on the left, a form for the
// one open on the right, saved into the repo through the dev server's store
// (devPages in vite.config.ts). The game reads the same files (src/rounds.ts).
devNav(PAGES);
jsonEditor<Round>({
  store: jsonStore<Round>('/__dev/rounds', 'id'),
  fields: ROUND_FIELDS,
  title: 'Rounds',
  blank: () => ({ id: '', name: '', seconds: 30, targetLife: 2.2, spawnEvery: 0.9, maxTargets: 3, missPenalty: 0.5 }),
  // A link to play the round open, as last saved (the game reads the files, not the form).
  preview: (round, into) => {
    if (!round.id) return;
    into.append(Object.assign(document.createElement('a'), { href: `/?round=${encodeURIComponent(round.id)}`, textContent: `Play ${round.id} as saved →` }));
  },
});

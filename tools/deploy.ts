import { deploySite, runCommand, type GameSite } from '@djayfresh/engine-site';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLUG, TITLE } from '../src/site';

// Pushes the built game (dist/) to its own folder of the playallday.games
// bucket, then clears Cloudflare's cache. The engine's deploy does the work
// (@djayfresh/engine-site): it only ever syncs into an empty folder or one
// holding this game's owner marker, skips files whose MD5 already matches,
// deletes what the build dropped, and sends HTML as no-cache so a deploy shows
// up at once.
//
//   npm run deploy               # build, then sync and purge
//   npm run deploy:dry           # build, then show what would change
//   npm run purge-cache          # just the Cloudflare purge
//
// Settings: .env (example.env documents every key). AWS credentials come from
// aws-vault, never from .env.

export const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

export const SITE: GameSite = {
  name: TITLE,
  app: 'grid',
  root: ROOT,
  distDir: resolve(ROOT, 'dist'),
  // Proof the folder is this game's. Never rename it: without it, the next
  // deploy sees a folder of someone else's files and stops.
  ownerMarker: 'grid.deploy.json',
  // The build's asset URLs start /grid/ (vite.config.ts base), so a deploy
  // to any other prefix would ship a game whose assets all 404.
  prefix: SLUG,
};

// Only as the command: importing this file must never deploy.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) runCommand('Deploy', () => deploySite(SITE));

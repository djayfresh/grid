import { purgeSite, runCommand } from '@djayfresh/engine-site';
import { SITE } from './deploy';

// Clears Cloudflare's edge cache for this game's folder. The deploy runs it at
// the end; this is it on its own. By URL, so the other games on the zone keep
// their cache.
//
//   npm run purge-cache                 # purge the game's cacheable URLs
//   npm run purge-cache -- --dry-run    # list them, call nothing

runCommand('Purge', () => purgeSite(SITE));

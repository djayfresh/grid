# Zombie game: fix core bugs + build out road/building/progression systems

## Context

The Zombie game (`game/src/zombie/`) is the least finished of the three games sharing this
engine. The owner played it and flagged it as feeling broken. Direct code reading (verified
line-by-line, not guesswork) confirmed real defects nobody had previously written down:

1. **Player isn't reliably kept on the road.** In `zombie/world.ts` `generateMap()`, only the
   vertical `leftStreet` gets `GameObjectAttributes.Holding`; the horizontal `centerStreet` —
   where the player actually spawns — never does. `World.noCollisions`'s holding logic only
   engages once an entity is detected *inside* a `Holding` rect at the start of a move, so since
   the player never starts inside the one rect that holds, the constraint never engages.
   (Confirmed against the owner's own play experience: the left road blocks top/left/right except
   at the one junction, while the starting road never blocks at all.)
2. **No round ever ends.** `Enemy.update` fires `EnemyHitPlayerEvent` on contact with the player,
   but nothing anywhere subscribes to it (confirmed via repo-wide grep). No player health, no
   loss condition, no win condition, no call to `GameOver()`/`setHighScorePicker()` the way
   `grid.ts` and `memory.ts` both do — even though `HighScoreManager.HighScoreGames` already
   lists Zombie, so the plumbing expects this and it's simply never wired up.
3. **`CanvasBounds` is a permanent no-op**, not a working world boundary. Its `update()` resets
   `pos = -world.pos` every frame; hand-tracing `noCollisions`'s math shows the containment check
   always cancels to "player is inside" regardless of how far the camera has panned (verified by
   hand: `s.pos.x + origin.x` reduces to 0 every frame, and the player's screen rect is constant
   since it's screen-centered). So today there's no real world boundary at all — the reason the
   world feels "limited" is sparse content (one house, one spawner, no goal, no road network to
   speak of once you're off the one working street segment), not an over-tight cage.
4. **Spawner is disproportionately tanky.** 100 health vs. bullet damage of 0.5–10 (10–200 hits)
   vs. Enemy's 1–5 health pool — confirmed by the owner as feeling wrong ("too tanky").

On top of fixing these, the owner asked for real feature work (their words, lightly organized):
- Barricades on the road that must be destroyed to open additional routes.
- An actual goal/win condition for a round.
- More spawners, reskinned as small "spawner houses" that can be destroyed *or* deliberately
  skipped (skipping is valid play but risks zombies piling up from the ones left standing).
- A player leveling/XP system off existing score (already accrued as enemy-kill XP in
  `zombie.ts`) granting perks at thresholds — explicitly requested: faster shooting, faster
  movement.
- Blue player color (new constant — `Colors.Player` is shared with Grid/Memory, must not mutate).
- Multiple brown "home" buildings with gray path/driveway boxes connecting each to the road,
  rendered above grass (layering already works correctly by `id`/`layer` — this is a placement
  problem, not a render-order bug).

A Plan sub-agent was used to work out the mechanical design given the engine's constraints; its
output was reviewed and one factual correction was made (item 3 above — original hypothesis was
"CanvasBounds cages you to one screen," corrected after hand-tracing the math to "CanvasBounds is
a no-op"). The concrete pixel coordinates below are a first-pass layout, not exact — verify by
actually walking the map in-browser during implementation and adjust as needed.

## Landing order

Items 1–5 are foundational and must land in order (each depends on the previous). Items 6–9 are
independent of each other and can be done in any order after 1–5.

## WI-1 — Engine primitives (no visible behavior change; regression-check Grid/Memory/Zombie after)

- **`game/src/shared/world.ts` `reset()`**: after `Renderer.clearScreen(...)`, add
  `this.$ctx.setTransform(1, 0, 0, 1, 0, 0);`. Without this, once Zombie starts calling
  `reset()` + `generateMap()` for round transitions (WI-4/5), the canvas's accumulated translate
  desyncs from `world.pos` (which gets reset to 0) and every round after the first renders
  offset by the previous round's camera position. No-op for Grid/Memory (they never translate).
- **`game/src/shared/world.ts` `noCollisions()`**: inside the `rectLeavingHolding.length > 0`
  branch, before the `Exiting` lookup, add a "still inside some other holder" escape:
  ```
  const stillHeld = holders.some(s => Physics.insideBounds(rect.x, rect.y, rect.w, rect.h,
      s.pos.x + newPos.x, s.pos.y + newPos.y, s.width, s.height));
  if (stillHeld) { return true; }
  ```
  Today, leaving one `Holding` rect is legal only by landing inside an `Exiting` rect — which
  means a real road *grid* would need a hand-placed `Exiting` box at every one of a dozen-plus
  junctions. This 3-line addition makes "moving from one overlapping road segment directly into
  an adjacent one" work generically, which is exactly the "two joint roads should allow passing
  through" requirement. Confirmed safe: grep shows only Zombie and the unused
  `test-worlds/prefab-word.ts` touch `Holding`/`validateMove` at all.
- **`game/src/shared/objects.ts` `Prefab.noCollisions()`**: same 3-line addition (offset by
  `this.pos`), for consistency if a prefab interior ever needs multiple holders. Optional.
- **`game/src/shared/weapons.ts` `Weapon`**: add `rateMultiplier: number = 1;`; change the fire
  gate in `update()` to `this._lastShot >= (this.rate * this.rateMultiplier)`. Default 1 = no
  behavior change; this is what WI-7's "faster shooting" perk will drive.
- **`game/src/shared/utility.ts` `ID_CONST`**: add (additive only) `Path = -90`, `House = -50`,
  `Objective = -40`, `Barricade = 12`, `Hud = 300`. Since `RenderObject.layer = id` and the
  renderer sorts ascending, resulting draw order is:
  Ground(-100) → Path(-90) → Street(-80) → House(-50) → Objective(-40) → Enemy(2) → Spawner(10)
  → Barricade(12) → Player(100) → Bullet(101) → Hud(300). This is what makes "buildings render
  on top of grass" correct once they're actually placed in the reachable area.
- **`game/src/shared/colors.ts`**: add new constants, do not touch existing ones (`Colors.Player`
  is shared with Grid/Memory):
  `ZombiePlayer = '#1e90ff'` (blue, reads clearly on `Ground '#043511'`), `Path = '#8a8a8a'`
  (gray driveway), `Barricade = '#7a5c2e'` (distinct from `Wall '#441d00'`), `SpawnerRoof =
  '#002b3f'` (darker than `Environment '#00405e'`, used for the spawner-house body).

## WI-2 — dt-scaled movement (must land before the layout, so it's tuned against final movement)

Current movement is `KeyboardManager.moves()` → exactly ±1 per **frame**, not scaled by `dt` —
frame-rate dependent. Baseline conversion used below: 1px @ 60fps ≈ 0.06 px/ms.

- **`game/src/zombie/objects.ts` `Player`**: add `baseMoveSpeed = 0.06` and (once WI-7 lands)
  `stats: PlayerStats`; add getter `moveSpeed = baseMoveSpeed * stats.moveSpeedMultiplier`; add
  `moveDelta(dt, reversed = false)` — reads `KeyboardManager.moves(reversed)`, scales both axes
  by `moveSpeed * dt`, and multiplies by `Math.SQRT1_2` when both axes are non-zero (today's
  diagonal movement is ~41% faster than cardinal — fix while touching this). Move the free-move
  (`j` key) branch out of `Player.draw` (no `dt` available there — why it was never dt-scaled)
  and into `Player.update`, using `moveDelta(dt, false)`.
- **`game/src/zombie/zombie.ts` `RunRound(dt)`**: take `dt` (was untyped/ignored), clamp
  `const step = Math.min(dt, 32)` (guards a long frame from teleporting through a barricade),
  and get the move vector from `this.world.player.moveDelta(step)` instead of
  `KeyboardManager.moves()` directly; pass it into the existing `validateMove` call unchanged.
- **`game/src/zombie/objects.ts` `Enemy`**: `speed` becomes px/ms, `update()` multiplies by
  `dt`; bump default `siteRange` to 300 (was 200 — short on a larger map).
- **`game/src/zombie/objects.ts` `Spawner.spawn()`**: replace
  `(this.enemySpeed / enemyHealth) + 0.5` with
  `this.enemySpeed + ((this.maxEnemyHealth - enemyHealth) * 0.002)` (weaker zombies faster);
  default `enemySpeed = 0.026` px/ms (~2× slower than the player's 0.06, matching today's feel).
- **`game/src/shared/world.ts` `validateMove`**: minor pre-existing bug hit while touching this —
  the two fallback branches *test* `{origin.x - move.x, worldMove.y}` /
  `{worldMove.x, origin.y - move.y}` but *apply* `{origin.x, worldMove.y}` /
  `{worldMove.x, origin.y}` (tested ≠ applied). Harmless at 1px/frame; wrong once moves are
  several px. Fix the tested positions to match what's applied.

**Verify**: movement feels the same as before, diagonals no longer faster, speed no longer
changes with framerate.

## WI-3 — New map: real boundary, road grid, blue player, camera start

- **`game/src/zombie/objects.ts`**: add two thin wrapper classes so `Holding` can't be forgotten
  again — `Road extends TiledImage` (ctor pushes `Holding`) and `Path extends Rectangle` (same,
  for gray driveways). Change `Player`'s color to `Colors.ZombiePlayer`. Change `Player`'s
  constructor to accept `weapons: Weapon[]` as a parameter instead of calling `GenerateGuns()`
  internally (needed once rounds loop — see WI-9's `Mouse`-leak note; convenient to do now while
  the constructor is already being touched).
- **`game/src/zombie/world.ts` `generateMap()` — rewrite**:
  - Delete `CanvasBounds` entirely (including its import) — replace with a plain `Box` (world-
    space, not a `RenderObject`, no per-frame position override) sized to the new level, with
    `Holding` + `NoExit`, as the real backstop boundary.
  - Delete the old `centerStreet`/`leftStreet`/`overlap` objects.
  - Build a small road grid using `Road`/`Path` from above: several full-width horizontal and
    vertical segments overlapping at junctions by the full street width (required — the strict
    `insideBounds` check in `Physics` means merely-touching segments are never traversable; the
    WI-1 `stillHeld` fix handles the junction crossing once segments genuinely overlap).
  - Resize `ground` (`TiledImage`) to match the new level's real extent (currently an
    arbitrary 2000×2000 unrelated to anything reachable).
  - Set the player's start position, then anchor the camera: `this.setPos(player.pos.x -
    START.x, player.pos.y - START.y)` so the fixed layout doesn't depend on canvas size.
  - First-draft concrete numbers (streetWidth 40): a 3-row × 4-column road grid spanning roughly
    1000×680, plus a short dead-end "objective spur" off one corner for WI-5. Treat these as a
    sketch to tune visually, not gospel.

**Verify**: drive the whole grid, turn at every junction, confirm you cannot step onto bare
grass anywhere. This closes bugs #1 and #3 by itself, independent of everything below.

## WI-4 — Round lifecycle: player health, loss, HUD

- **`game/src/zombie/objects.ts` `Player`**: add `health = 100`, `maxHealth = 100` — **do not**
  name it `totalHealth` (verified: `World.doDestroyableCheck` treats anything with a truthy
  `totalHealth` as a destroyable target, and bullets spawn at the player's own center — naming
  it `totalHealth` would make the player instantly self-damage on their own gunfire). Add a
  `hudBar: StatusBar` and `takeDamage(amount): number` (clamps at 0, updates the bar, returns
  new health).
- **New `ZombieHud extends RenderObject`** (`zombie/objects.ts`), layer `ID_CONST.Hud` (drawn
  last): draws the health bar plus round/level/XP/spawner-progress text, wrapped in
  `drawSticky` so it stays screen-fixed regardless of camera position. Added to the map at the
  end of `generateMap()`.
- **`game/src/zombie/zombie.ts`**:
  - `_init()`: set `roundDelay = 1500` (was 0 — restores the "Round Starting" beat), reset
    `round = 1`, `score = 0`.
  - Simplify the `ImagesLoadedEvent` handler to just flip a `imagesLoaded` flag — move
    `world.reset(); world.generateMap();` into a new `StartRound()` override (mirroring
    `grid.ts`), guarded on `imagesLoaded` so the very first round waits for images without a
    separate code path.
  - New subscription: `EnemyHitPlayerEvent` → `player.takeDamage(...)`; if health hits 0, call a
    new `GameOver()` that mirrors `grid.ts`/`memory.ts` exactly: `roundStartDisabled = true`,
    `world.setHighScorePicker(LevelConst.Zombie, score, () => { roundStartDisabled = false;
    GameEventQueue.notify(new MenuLoadMainEvent(null)); })`, then `world.reset();
    world.setGameOver(score)`. `HighScoreManager` already lists Zombie, so no high-score-side
    change needed.
  - Guard `RunRound` with an early return when `roundStartDisabled`, so input doesn't drive a
    torn-down world while the picker overlay is up.

**Verify**: let zombies hit you enough times, confirm the high-score picker appears and returns
to the main menu correctly.

## WI-5 — Win condition: objective + barricades

- **`game/src/zombie/objects.ts`**: `Barricade extends Wall` (reuses `Wall`'s existing
  `health`/`totalHealth`/`statusBar`/destroy-on-bullet-damage machinery for free; adds
  `Blocking`; shows its status bar as soon as damaged rather than `Wall`'s 75% threshold, since
  a barricade should read as "responsive" immediately). `Objective extends Rectangle` — checks
  overlap with the player each frame (translating world-space objective coords by `world.pos`
  to compare against the player's screen-space `pos`, matching `Enemy.update`'s existing
  convention) and fires a new event once reached.
- **`game/src/zombie/events.ts`**: add `ObjectiveReachedEvent`, `BarricadeDestroyedEvent`,
  `SpawnerDestroyedEvent` (same `@GameEvent(...)` pattern as existing events).
- **`game/src/zombie/world.ts`**: extend the existing `ObjectDestroyedEvent` subscription in
  `subscribe()` to also fire `BarricadeDestroyedEvent`/`SpawnerDestroyedEvent` for those types
  (mirrors the existing `Enemy` → `EnemyKilledEvent` handling right above it). Place several
  barricades gating shortcuts through the road grid, and exactly one mandatory barricade gating
  the route to the objective — the whole point of "destroying barricades opens more routes" is
  that most are optional shortcuts, but there should be at least one unavoidable one.
- **`game/src/zombie/zombie.ts`**: subscribe `ObjectiveReachedEvent` → new `NextRound()`
  (increments `round`, awards a round-clear bonus + a bigger bonus if every spawner-house was
  destroyed, resets and regenerates the map at the new round number, shows the round-start
  screen) — mirrors `grid.ts`'s round-advance pattern.

**Verify**: destroy the mandatory barricade, touch the objective, confirm "Round Starting - 2"
appears and round 2 generates cleanly (this is where WI-1's `setTransform` fix matters).

## WI-6 — Spawner rebalance + spawner-houses + more of them

- **`game/src/zombie/objects.ts` `Spawner`**: drop default `totalHealth` from 100 to **30**
  (sniper 10dmg → 3 shots; pistol 1dmg → 30 shots; roughly "worth ten zombies," matching the
  requested feel vs. today's 10–200 hits). Fix the status-bar threshold to match `Enemy`'s
  convention (show any time `health < totalHealth`, not `< 90%`). Guard: after
  `Object.assign(this, options)`, if the caller passed `totalHealth` without also passing
  `health`, set `health = totalHealth` explicitly (otherwise a rebalanced `totalHealth` leaves
  the inherited `health` default stale and the bar starts wrong).
- **New `SpawnerHouse extends Spawner`**: small building look (body + roof band + door + windows
  via the new `Colors.SpawnerRoof`/`Colors.Environment`), spawn point moved to the door instead
  of dead-center. Inherits `Blocking` + `IDestroyable` + the existing world-level destroy
  handling unchanged — "destroy or skip" falls out for free: shoot it to stop the flow, or walk
  past and let it keep producing zombies.
- **`game/src/zombie/world.ts`**: place several `SpawnerHouse` spots around the grid (not
  overlapping roads/houses); scale spawner count per round (e.g. `min(2 + round, 6)`).
- **Per-round scaling table** (in `generateMap`, driven by `this.round`): spawner-house health,
  barricade health, spawner count, enemy speed, and enemy site-range all step up gradually per
  round (concrete starter formulas + numbers in the full agent design; tune by feel).

**Verify**: a spawner-house dies in a few sniper shots; ignoring one visibly floods the map with
zombies over time.

## WI-7 — XP / leveling / perks

- **New file `game/src/zombie/leveling.ts`**: a small ordered table of level thresholds, each
  with a `moveSpeed` and `fireRate` multiplier (e.g. 7 levels from 0 XP to 600 XP, move speed
  climbing from 1.00× to ~1.55×, fire rate from 1.00× down to ~0.50× i.e. twice as fast) and a
  `PlayerStats` class (`xp`, `level`, `addXp()`, `moveSpeedMultiplier`, `fireRateMultiplier`).
  Persisted on `ZombieGame` (not on the per-round `Player` object) and handed to
  `ZombieWorld.stats` before each `generateMap()`, so perks survive round transitions.
- **Application**: `Player.update()` sets `activeWeapon.rateMultiplier = stats.fireRateMultiplier`
  each frame (uses WI-1's new field); `Player.moveSpeed` getter already multiplies by
  `stats.moveSpeedMultiplier` (WI-2) — this is why dt-scaled movement had to land first, since
  there was previously no numeric "speed" to modify.
- **XP sources**: a single `award(amount)` helper on `ZombieGame` that both adds to `score` and
  calls `stats.addXp(amount)` — replaces the existing raw `this.score += enemyKilledEvent.data
  .totalHealth`, and is also called for barricade destruction, spawner-house destruction, and
  round-clear bonuses.

**Verify**: kill enough zombies to level up, confirm the player visibly moves faster and the
active weapon fires faster.

## WI-8 — Brown houses + gray driveways

- **`game/src/zombie/prefabs.ts` `House`**: widen the door gap on the west wall slightly so a
  40px-wide driveway `Path` can align with it flush (currently the gap is narrower than a
  driveway would need).
- **`game/src/zombie/world.ts`**: place several `House` prefabs near (not on) the road grid;
  for each, add a `Path` (gray) connecting the road edge to the house's door, sized to overlap
  both the road and the house's doorway by the full street/door width (same overlap rule as
  WI-3's road junctions, needed for the `Holding`/`stillHeld` logic to let the player walk the
  full road → driveway → doorway chain without a gap).

**Verify**: visually confirm houses render above the grass (already correct by `layer` once
placed inside the reachable area) and the driveways are walkable end to end.

## WI-9 — Cleanups made necessary by round looping

- **`Mouse`/`Weapon` leak**: build the gun list once per game (on `ZombieGame` or
  `ZombieWorld`, reused across rounds) instead of inside `Player`'s constructor — otherwise every
  round-regenerated `Player` creates 3 new `Weapon`s, each with its own `Mouse` and canvas event
  listeners, that are never cleaned up.
- **Deleted-object accumulation**: `world.map` never drops deleted entries, and with dozens of
  zombies per round across multiple rounds, `noCollisions`/`doDestroyableCheck` iterate more and
  more garbage each round. Add a cheap prune (filter out `isDeleted()` entries) at the start of
  each `generateMap()`.

## Verification (end to end, after all items land)

1. `cd game && npm run build` — must compile clean (non-strict TS, but should still be
   error-free).
2. Run the server (`cd server && node dist/index.js`) and open `game/index.html` directly
   (`file://...` — CORS whitelist already allows `null` origin for this).
3. Play a full round of Zombie: confirm the player stays on roads/driveways everywhere, zombies
   spawn from spawner-houses and can be destroyed or skipped, a barricade blocks the only path to
   the objective until destroyed, reaching the objective advances to round 2 with a harder
   spawner setup, taking enough hits triggers the high-score picker and returns to the main menu,
   and leveling up visibly changes move speed and fire rate.
4. Spot-check Grid and Memory still play normally (WI-1's `world.ts`/`objects.ts` changes are
   shared engine code).

### Critical files
- `game/src/zombie/world.ts`, `game/src/zombie/objects.ts`, `game/src/zombie/zombie.ts`,
  `game/src/zombie/prefabs.ts`, `game/src/zombie/events.ts`
- `game/src/shared/world.ts`, `game/src/shared/objects.ts`, `game/src/shared/weapons.ts`,
  `game/src/shared/utility.ts`, `game/src/shared/colors.ts`
- New: `game/src/zombie/leveling.ts`

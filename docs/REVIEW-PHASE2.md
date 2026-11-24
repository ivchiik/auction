# Independent integration review (in progress)

Codex reviews while the UI implementation is underway. Only treat a finding as open after comparing with the final source.

## Clock and persistence
Engine clock fix complete and independently verified by Codex: the original 10,000 → 9,000 reproduction now accepts the bid, keeps `updatedAt=10000`, and reloads successfully. All 8 new clock regressions pass independently. The worker's full engine run passed 62/62. Existing malformed pre-release saves remain rejected; this is a new pitch with no customer saves to migrate. Preserve the fix and tests.

- Resolved P2: the engine previously accepted an action with a wall clock earlier than `createdAt`, wrote that value to `updatedAt`, then rejected the resulting save. Successful transitions now keep a finite nondecreasing timestamp; non-finite inputs fail through the existing typed channel without mutation. No device/system clocks were changed to test this.
- P2, reproduced: the day-rollover hook schedules its only active-app refresh using the current fixed UTC offset. In an isolated process with `TZ=America/New_York`, local midnight on March 8, 2026 is 23 hours from the next midnight, but `msUntilNextLocalMidnight(now, now.getTimezoneOffset())` returns 24 hours. The open Daily tab can therefore stay on yesterday until 1am after the spring transition. Use a DST-aware local-calendar boundary or cap the refresh interval (e.g. recheck at least every minute) while retaining foreground refresh and cleanup. Add an isolated/injected regression; do not change system/device time zones.

## Save-and-leave navigation
- P2, reproduced at the installed router level: `useAuction` sets `isLeaving=true`, then its explicit Save/leave path calls `navigation.navigate(MAIN)`. In React Navigation 7 this pushes a new Main instead of popping the earlier one. A pure run of the installed `StackRouter` produces `[MAIN, AUCTION, MAIN]`; hardware Back returns to the old Auction instance, whose `isLeaving` remains true and therefore keeps its scheduler disabled. Use `popTo(MAIN)` or an appropriate reset for this path; keep the captured native back action path working. Audit other end/home navigation for the same stack accumulation. Current official behavior: https://reactnavigation.org/docs/upgrading-from-6.x/ (navigate no longer goes back). Verify Save/leave → Android Back and Resume on device once the screens are assembled.

## First native UI review (iPhone 17 Pro, Expo Go)
- High-priority visual fix, observed: the current bid and leader row is clipped by the fixed action dock on the normal iPhone even before scrolling (see `.work/ios-auction-first.png`). In the first NBA draft, the bottom of `$0` and the opening guidance are below the scroll viewport; the roster strip is entirely below it. Current bid/leader is essential information at every decision. Make a compact current-bid/leader row part of the reachable fixed dock, or otherwise guarantee it remains visible on 360dp Android and iPhone SE as well. Card artwork/content can scroll; essential bid context must not require a separate scroll during a timed turn. Keep the overall visual hierarchy and the 48pt actions.
- Observed copy contradiction in that same state: Shark opened by passing, so the live banner correctly says `Your move, You` and only $1 is legal, but the status row still says `The Shark opens` and `Open at $1, $2 or $3`. Derive opening context/guidance from the current turn and its actual legal amounts, or simply say `No bids yet` alongside the existing correct bid hint. Do not display an old opener as the active actor.
- Visual refinement: on the normal iPhone Home, Cars initially falls partly under the tab bar and needs a short scroll (`.work/ios-home-simctl.png`). The Brilliant target fits all five topic tiles. Tighten Home's vertical spacing/hero height enough to show all five at default type size on a normal-height phone, while keeping scrolling on small phones and at large accessibility sizes. This is refinement, not a navigation failure.
- Setup visually matches the direction and has reachable Start action (`.work/ios-setup-first.png`). Expo Go's blue gear is its own overlay, not an app defect; standalone builds will remove it. Argent's first screenshot was a stale white frame, but direct `xcrun simctl io ... screenshot` captures the actual UI correctly.
- Native roster check: names/prices/empty slots are correct and ratings remain hidden, but the iOS accessibility tree still exposes the underlying `auction-leave`, `auction-rules` and `auction-roster` buttons while the roster modal is open. Ensure the screen behind an app sheet is explicitly hidden from accessibility (and restore it on dismiss); relying only on the sheet's `accessibilityViewIsModal` did not remove those controls from the observed tree. Recheck on both native platforms. Expo Go's own tools button is now disabled, so this observation is from the app's roster sheet.

## Integration acceptance to verify
- One serialized game snapshot covers active session, reveal, daily attempts and history.
- Storage read failures preserve disk data; corrupt JSON yields a useful notice; hydrate before accepting actions.
- Scheduled bot/timer actions check current session and turn key immediately before mutation, and pause with modals/background/navigation.
- Before reveal, card/roster content and accessibility labels contain no ratings or basis values.
- History remains readable if the catalog grows; already attempted daily rows use their recorded pack, not a newly recomputed pack choice.
- Unknown/malformed history topic IDs must be rejected or render a safe fallback rather than indexing an undefined icon/theme entry.

## Parallel content work
The second Opus5.5/max worker has finished and released its files. Catalog registration is complete: 20 packs, 664 cards, four packs per topic. It updated `catalog.ts`, existing catalog tests and both content docs; its final pure suite passed 121/121 while the UI was still being finalized. Preserve the registration and generated expansion files. The main implementation owner may now edit the catalog for the public-shape cleanup below. Also fix the stale comment at the top of `expandedCatalog.ts`, which still says registration is deferred.

The UI/integration owner should remove `sourceIndex` from the `PublicCard` type/projection and placeholder after catalog registration completes. Provenance retains it. Although no screen currently shows this field, several source pools use rating order, so it does not belong in the pre-reveal view model. Contextual notes/statistics remain faithful to the published game; actual rating and full basis stay hidden.

## Final disposition (Codex)

All reproduced application findings above are resolved. Independent native checks verified the pinned bid/leader, corrected opening guidance, normal-iPhone Home fit, hidden sheet background, Android leave/back/resume, monotonic paused timer, single expiry, offline restart and idempotent history. DST/backward wall-clock fixes pass injected regressions. Twenty packs and the rating-free public card projection are integrated. Subsequent copy review corrected name grammar and the remote-photo privacy wording (final artifact rebuild recorded in QA.md).

Remaining environment limitation: local iOS standalone compilation needs Xcode 26.4+; installed 26.2 fails in ExpoModulesJSI. Expo Go device validation and the Android standalone build are separate evidence, not a claim that iOS native compilation passed.

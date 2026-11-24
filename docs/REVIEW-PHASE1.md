# Independent review notes (in progress)

Reviewed while phase 1 implementation is ongoing; re-check final code before treating these as unresolved defects.

Phase1 resolution: Claude fixed opening choices, exhausted-deck failure, corrupt-save distinction, numeric/catalog validation, monotonic clock and the stale callback generation guard. It also added `dispatchForTurn`/`applyActionForTurn` against fresh state. Codex independently verified the original stale-callback reproduction is fixed. Full phase1 gate reports 77 passing tests. The app-level persistence transaction, hydration gating and screen/scheduler integration remain phase2 responsibilities. Historical observations below are kept as review evidence, not a list of still-open bugs.

## Behavior to align before UI handoff
- P1: `src/engine/selectors.ts` currently permits only `openingBid` when no one has bid. Live website shows three valid opening amounts ($1 OPEN, $2 OPEN, $3 OPEN). Native auction should support all three openings and reserve-limited disabled states. Update selector/reducer validation and add a focused test.
- UI requirement: every scheduled bot/timer action must carry and re-check `getTurnKey` against fresh store state immediately before dispatch, including resume and sheet close. Do not rely only on component closure state.
- Review invariant checked: restore validation now rejects insufficient remaining slot supply and completion with empty spots. Keep the exhausted-deck regression in the final suite.

## Good foundations observed
- Pure engine, injected clock and seeded RNG.
- Explicit outcomes and structured errors; UI can explain restrictions.
- Slot-based reserve and supply checks support future mixed lineups.
- Turn key gives timer/bot scheduling a stable duplicate-action guard.

Further reducer/bot/save validation review follows completed implementation and automated tests.

Scoring review: score totals and ties use ratings alone, with money only reported. Current native grade thresholds and value formula are an independent interpretation; the website observed B/B+ for 404/432 in one game. Do not promise exact grade parity without confirming the source formula. This does not change the observed winner rule.

## Storage integration requirements for phase 2
- `readJson` currently maps invalid JSON and storage errors to the same null result as a missing key. The UI needs to distinguish a corrupt save from no save to show the promised recovery notice. Keep this distinction in the app-level persistence envelope.
- Repository helpers currently write independent keys. The final daily-start/completion flow needs a serialized, consistent snapshot (draft, daily attempt, reveal flag and history) so a crash cannot create a retry or lose the result.
- Validate numeric daily result fields as finite and within sensible ranges before displaying them, and cross-check catalog/topic identity. Local malformed data should not produce NaN scores or an inaccessible resume button.

## Shot clock review
- P1: `createShotClock` currently schedules the shared `fire` closure, which reads the mutable current `turnKey`. A stale callback from turn A delivered after `start(B)` can therefore expire B early and pass B's fresh key to the store. Codex reproduced this with an injected scheduler: start A for 10,000ms, start B at t=100ms, deliver A's cancelled callback -> expired=[turn-B], remainingMs=0. Capture the armed key/generation and reject stale callbacks before mutating timer state. Add a scheduler regression that deliberately delivers a cancelled callback after starting another turn, and after pause/resume.
- Use a monotonic reading (`performance.now`) for remaining shot-clock time; wall-clock Date.now is fine for saved timestamps/daily dates. Keep both injectable. A clock change must not give extra time or expire a turn early.

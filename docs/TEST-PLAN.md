# Native acceptance checks

Record actual results in QA.md. A passing bundle or simulator screenshot alone is not proof of a completed game.

## Engine (automated)
- At every transition: unique awarded card IDs, each balance >= empty slots, no overfilled roster, no action from a passed/full/ineligible seat.
- Two through four seats, every bot personality, seeded deck repeatability and varied seeds. Complete thousands of games if inexpensive; no pathological stalled loops.
- Two opening skips exactly; free pass after a bid; pass locked after skips/when supply forces play. Last seat forced fills for $1.
- Maximum spend reserves $1 for the remaining slots, including a multi-position fixture. Illegal amounts/actors fail without state changes.
- Correct ties, scores, grades and best-value calculations; no score influence from leftover money.
- Persistence rejects impossible/corrupt snapshots and accepts valid resumable states without extra transactions.

## Native smoke (iPhone and 360dp Android)
1. Cold start and font readiness, safe areas, home topic/daily navigation; no red screen or console errors.
2. Setup 2 and 4 seats; edit names; select each bot type; long name and keyboard scrolling; empty name validation/default.
3. Start a draft, raise/pass, inspect budget and skip changes, open/close roster sheet, inspect one image fallback and hidden ratings.
4. Finish a whole draft versus bot; pre-verdict state hides ratings; reveal changes to real results; roster basis and replay work.
5. Native share opens a sheet; cancel without sending anything.
6. Resume after background/foreground and app restart; no duplicate bot turns; quit confirm works.
7. Shot clock expiry occurs once; background, rules/roster modal and transition teardown do not produce surprise bids.
8. Daily completion and prevention of second attempt; resume abandoned attempt; date change behavior with injected tests rather than changing the computer clock.
9. Local collection/history and settings. No-data empty states are useful. Reset local data only through deliberate confirmation.
10. Small iPhone and Android screenshots: no clipped text or controls; long card names and four seats; reduced motion/haptics state.

## Review
- No rating/basis leaks in accessibility labels before reveal.
- Domain rejects duplicate/stale dispatch; rapid double press cannot buy twice.
- Timer uses monotonic elapsed time with AppState pausing; cancellation guards survive navigation.
- Async persistence doesn't replace newer state with older writes; idempotent completion history/daily bookkeeping.
- No hardcoded secret, unexpected network service, fake online counts or unsupported pack buttons.

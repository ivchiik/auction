# Phase 2 implementation — the playable native pitch

Date: 2026-11-24. Implementer: Claude Code, `claude-opus-5-5` at max effort (UI, integration, persistence, scheduler). A parallel Opus 5.5/max worker added 15 content packs and an engine clock fix (see QA.md and CONTENT-EXPANSION.md). Codex owns review and device testing.

Status: every flow below is built and passes the automated gate. I did not run simulators or emulators myself (by instruction); on-device behavior is unverified until Codex's pass on iPhone 17 Pro, iPhone SE and the 360dp Android emulator.

## What was built
| Area | Delivered |
|---|---|
| Home (Play tab) | Wordmark and settings button, editorial headline, startup notices (save cleared / data reset / storage unreadable), resume card (resume, see verdict, or confirmed discard), forest daily hero with today's local progress, five topic tiles. Tightened after the first iPhone review so all five tiles fit on a normal-height phone. |
| Pack chooser | `FlatList` over `getPacksForTopic`, so any number of packs works (four per topic now). Each pack shows its card count, $20 · five picks and a one-line rating basis; "About this pack" sheet with source, snapshot, selection, rating method and photo hosts, plus a link to the original site. |
| Setup | 2/3/4 segmented control; per seat a person or the Accountant, Shark or Gambler, with at least one person enforced and explained; inline name editing that never dead-ends (empty → default, duplicates numbered); shot-clock switch defaulting from settings; pinned Start; rules sheet; confirmed replacement of an unfinished draft. iOS lifts the footer with KeyboardAvoidingView; Android uses `softwareKeyboardLayoutMode: "resize"`. |
| Auction | Card on the block (topic surface, wrapped name, public note, photo or drawn monogram card, "Rating hidden" pill, Sold/$1/Gone stamp); card x of y and topic/pack context; seat strip with every seat's money, open spots, skips and state in words. The pinned dock holds the current bid and leader (moved there after the iPhone review), the active-seat banner (seat number, name, money, spots, skips, optional countdown), +$1/+$2/+$3 buttons labelled with their resulting amounts, a hint with the exact legal bids and limit or the reserve reason, and Pass with the skip cost or block reason. Resolved cards show the outcome with "Next card" and auto-advance after 1.8 s. Roster sheet, rules sheet and save-and-leave confirmation. |
| Verdict | Pre-verdict rosters with ratings hidden, then a deliberate reveal into the forest composition: winner or tie pill, score count-up (skipped with Reduce Motion), grade line, all seats' points, grades and spend, steal of the draft and biggest overpay, every pick with rating and published basis, "How grades work", native Share, Play again (setup prefilled with the same table) or Today's tables, and Home. |
| Daily | Today's date, "N of 5 drafted", local streak, five rows (Ready / In progress / Attempt used / Won, Played or Tied with points), and a preview sheet with the fixed pack and opponent. One attempt per topic. Unfinished drafts are replaced only after confirmation, shown inside the same sheet so iOS never stacks two modals. Started or finished dailies show the opponent from their own draft or record. |
| Collection | Empty state with an action; result list with mode, date and winner line; detail screen with seat results, highlights, rated rosters and Share. |
| Settings & about | Haptics, reduce motion (shows when the system setting already applies), shot-clock default, rules, how grades work, credit and links to the original (native `Linking`, errors shown inline), content snapshot, play-money and local-data notes, and a confirmed erase. |
| Icons and splash | `design/exports/app-icon.png` is the app icon; `adaptive-foreground.png` is the Android adaptive foreground and splash image on forest `#193D31`. Expo template icon files and their config references were removed. |

## Architecture added in phase 2
- `src/game` (pure, Node-tested): one persisted document `{ session, daily, history }` with parse, validation and repair; session transitions (start with atomic daily reservation, update, reveal → history exactly once plus daily finish, close, abandon); daily board and status; history records with names and ratings copied in; share text; the table view model built only from rating-free public cards; and `createTableScheduler`.
- Storage: one key `paddle.game.v1`, written by a serialised latest-wins queue, so an older snapshot can never land after a newer one. Settings use their own queue. Read failures disable writes for that session, so data that could not be read is never overwritten.
- Stores: `useGameStore` (all game data; nothing is written before hydration), `useSettingsStore`, `useClockStore` (today, refreshed on foreground, at the DST-aware local midnight and at least every 15 minutes), `useUIStore` (active tab).
- Engine: `getStepKey` and `applyActionForStep`. Every tap, bot move, shot-clock expiry and auto-advance carries the step it was created for and is refused if the table has moved on. This is the dispatch-layer guard against double taps and stale renders; the 600 ms press guard is the second layer.
- Scheduler wiring (`useTableScheduler`): reads the freshest store state, re-syncs on every draft change, and runs only while the auction is focused, the app is active and no sheet is open. Bots think for 600–900 ms (deterministic per step). The shot clock uses `performance.now`, pauses with the scheduler and resumes with the time that was left.
- Navigation: native stack with Main (hand-rolled tabs), Topic, Setup, Auction and Verdict (gestures off; Android back asks to leave), History detail and Settings. Paths that go back home use `popTo`, because React Navigation 7's `navigate` pushes a new copy.

## Review findings addressed
| Finding | Resolution |
|---|---|
| REVIEW-PHASE1: scheduled actions must re-check the turn against fresh state | `applyActionForStep` plus scheduler `getDraft()` re-read; tests cover late cancelled callbacks, fresh-state re-checks and pauses |
| REVIEW-PHASE1: one consistent snapshot (draft, attempt, reveal, history) | One document under one key, written atomically by one queue; parse repairs missing attempts and missing history |
| REVIEW-PHASE1: corrupt save vs no save; storage failure | Notices: session discarded / data reset / storage unavailable (writes disabled, nothing lost) |
| REVIEW-PHASE1: finite, sensible daily numbers; catalog identity | Range-checked results; attempts must name a known pack of the same topic; unknown history topics fall back safely |
| REVIEW-PHASE2 P2: DST rollover | `msUntilNextLocalMidnightAt` with an injected offset function plus a 15-minute cap; regression test for New York's 23- and 25-hour days, with no system timezone changes |
| REVIEW-PHASE2 P2: save-and-leave pushed a second Main | `popTo(MAIN)` for leave, missing-session guards and the pre-verdict back |
| REVIEW-PHASE2: bid and leader clipped by the dock | Compact current-bid/leader row moved into the pinned dock |
| REVIEW-PHASE2: "The Shark opens" after the Shark passed | Status shows "No bids yet" before an opening; legal amounts come only from the live turn |
| REVIEW-PHASE2: Home needed a scroll to reach Cars | Smaller tagline, slimmer hero, 60pt tiles, no footnote, less bottom padding |
| REVIEW-PHASE2: attempted dailies must use their recorded pack | Status uses `attempt.packId`; opponent comes from the live draft or history record |
| REVIEW-PHASE2: remove `sourceIndex` from `PublicCard` | Removed from the type, projection and placeholder; privacy tests assert it |
| REVIEW-PHASE2: stale comment in `expandedCatalog.ts` | Fixed |
| REVIEW-PHASE2 native roster check: the iOS accessibility tree kept `auction-leave`, `auction-rules` and `auction-roster` behind the roster sheet | While any sheet is open, the app behind it is hidden with the native accessibility properties on both platforms, and restored when it closes (details below) |
| Native review copy: "You is leading", and a doubled full stop in the turn banner's spoken label ("Your move, You.. $20 left…") | Leader line is now "Leading: {{name}}", on screen and in the spoken status. The other copy that put a verb after a seat name now reads right for any name: forced fill "Goes to {{name}}" / "{{card}} goes to {{name}} for $1.", verdict and history title "Winner: {{name}}", Home resume "Next move: {{name}}". The banner and status-row spoken labels come from whole-sentence i18n templates (`auction.yourMoveLabel`, `thinkingLabel`, `statusLabel`; resolved cards reuse their sold, forced or gone sentence), and the dock amount uses `common.dollars`. "Your move, {{name}}." stays as the visible banner title |

### Sheet accessibility fix
- Cause: every sheet is a transparent React Native `Modal`, and the screen that presented it stays in the view hierarchy. `accessibilityViewIsModal` only makes VoiceOver ignore the sheet's own siblings inside the Modal (the backdrop), not the screen behind it.
- Fix (`src/hooks/useSheetAccessibility.ts`): `AppSheet` calls `useRegisterOpenSheet(visible)`, which increments `openSheetCount` in `useUIStore` while the sheet is visible. The effect cleanup decrements it on close or unmount. `AppScreen`'s root view and `TabBar` spread `useHiddenBehindSheet()`. The tab bar needs it because it sits outside the tab's AppScreen. While the count is above zero, those views get `accessibilityElementsHidden` (iOS) and `importantForAccessibility="no-hide-descendants"` (Android). When the last sheet closes they go back to `false` and `"auto"`. `ConfirmSheet` and `RulesSheet` are built on AppSheet, so every host is covered without per-screen flags.
- The sheet stays accessible: every host renders the sheet beside `AppScreen`, never inside a hidden view, and its content lives in the Modal's own native window or view controller. The sheet keeps `accessibilityViewIsModal`, its title header and its close button.
- Hosts checked: Auction (roster, rules, save and leave), Home (discard, plus the tab bar), Daily (preview with the replace confirmation inside it, plus the tab bar), the pack chooser (About this pack), Setup (rules, replace draft), Verdict (how grades work) and Settings (rules, grades, erase). Each renders only `AppScreen` and its sheets, so nothing else is left exposed. Collection and History detail have no sheets.
- Unchanged: Android back (`onRequestClose`), closing from the backdrop, and the auction scheduler pause (still `overlay === null` in `useAuction`). Every host closes its sheet before navigating, so no screen stays hidden after a navigation.
- No new automated test: the only logic is a counter that React's effect cleanup keeps balanced. The result that matters is the native accessibility tree, which a Node test cannot observe.
- For the Android check: TalkBack honours `no-hide-descendants`. A raw UI Automator dump that includes "not important" views (`FLAG_INCLUDE_NOT_IMPORTANT_VIEWS`, used by uncompressed dumps) can still list those nodes.

## Tests and checks (final run)
After the sheet accessibility fix, I reran `npm run check` (including the tests) and both exports. After the later copy fix, I reran typecheck, ESLint, the Prettier check and the tests, all passing; I did not rerun the exports for that change, which touched only copy and labels. The dependency checks below come from the earlier run; no dependency or native config has changed since.

| Command | Result |
|---|---|
| `npm run check` | pass: app and test typecheck, ESLint 0 problems, Prettier, tests |
| `npm test` | 124 tests in 28 suites, 0 failures, about 2 s |
| `npx expo install --check` | Dependencies are up to date |
| `npx expo-doctor@latest` | 20/20 checks passed |
| `npx expo export --platform ios / android` | bundled, 1251 / 1247 modules after the sheet fix (1250 / 1246 before; one new hook file), about 2.9 MB Hermes bytecode each (per-icon Lucide imports) |
| `npm audit` | unchanged: 3 moderate in Expo's own CLI tooling; the only offered fix downgrades the SDK |

New phase-2 tests: game data round trip, corruption and repair; sessions (no silent replacement, atomic daily reservation, no retry after abandonment, replacing a daily uses it up, reveal recorded once, resume after midnight with the original date and seed); daily board and streak; history parsing; write-queue ordering and failure recovery; scheduler (pacing, a full bot game, the resolved-card pause, pause and resume, late cancelled timers, fresh-state re-check, the shot clock firing once and keeping its remaining time, dispose); table-view privacy across all 20 packs; card-text privacy across all 664 cards; engine step keys (double tap, "Next card" twice); DST-aware midnight.

## Known gaps and things to verify on device
- No simulator or emulator run by me. Please verify especially:
  - Android keyboard behavior for setup names (edge-to-edge plus `resize`).
  - Sheet animations and Android back on sheets.
  - VoiceOver and TalkBack with each sheet open: the screen behind it and the tab bar are unreachable, and they come back after closing with ✕, the backdrop or Android back.
  - The dock height on iPhone SE and the 360dp emulator.
  - Share sheet cancel.
  - Haptics on hardware.
  - Remote photo loading and offline fallback.
  - Leave, then Android back, then Resume.
  - Resuming a pending bot turn after a restart.
- Visual details were matched to the exports by eye, not measured; there is no pixel-diff tooling.
- No React component tests. The pure layers (engine, game, storage, data) carry the automated coverage. Hooks and screens are verified on device.
- Share text is plain text (no image card).
- testIDs for native testing: `home-*`, `tab-play|daily|collection`, `pack-<id>-choose`, `setup-*` (including `setup-start`, `setup-seat-N-*`), `auction-bid-1|2|3`, `auction-pass`, `auction-next`, `auction-roster`, `auction-rules`, `auction-leave`, `leave-sheet-confirm|cancel`, `verdict-reveal`, `verdict-share`, `verdict-play-again`, `verdict-home`, `daily-row-<topic>`, `daily-start`, `daily-resume`, `collection-item-<id>`, `settings-*`.

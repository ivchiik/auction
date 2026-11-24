# Verification log

Current state (Auction 0.2.0, 2026-11-24): every gate passes and native gameplay is verified on iOS through Expo Go and on Android with the standalone APK and Expo Go; see "Phase 3" at the end. The sections below are a dated record, oldest first.

Interim native shell launch: the phase1 boot screen rendered its custom fonts and five-pack summary (148 cards) in both Expo Go clients via Metro8087. No launch error was observed. Developer onboarding overlays were dismissed. The playable UI is not implemented at this point, so this is startup evidence only.

Discovery: public Home, How to play, About, Daily, Ratings, Call Out, Contact and Privacy inspected. Full original soccer-attacker game versus The Accountant completed in simulator Safari, including pre-verdict and explicit reveal; details in SITE-AUDIT.md. This is website coverage, not coverage of our app.

Environment: iPhone 17 Pro / iOS 26.2 and Galaxy_S23_360dp Android emulator are booted. Argent 0.31.1 performs native interaction. Matching official Expo Go clients installed successfully: iOS 58.0.7 and Android 58.0.5, resolved from Expo's SDK 58 metadata. Installation alone is not app validation.

Implementation provenance: Claude Code 2.1.330, explicitly requested `claude-opus-5-5` with `--effort max` and `CLAUDE_CODE_EFFORT_LEVEL=max`; model identity confirmed in successful API output. Codex owns designs, specifications and review. Five Brilliant canvases plus icon exported successfully; final composition has no reported overflow.

## Independent interim engine check

2026-11-24, Codex: `npm test` passed 52/52 tests in 13 suites (1.78s), including 450 randomized single-position tables, 80 mixed-position drafts, bot behavior, ties, reserves, forced fills and malformed-save fuzzing. `npx tsc --noEmit -p tsconfig.test.json` passed. The initial sandbox run could not open tsx's IPC pipe; rerunning with the required local process permission passed. These are interim results before the opening-bid fix and remaining app implementation, not the final release gate.

Later interim gate: `npm run check` passed TypeScript (app + tests), ESLint, formatting and 71 tests in 18 suites. `npx expo install --check` reported dependencies up to date. Subsequent review corrections are being applied by Claude, so the final gate must be rerun after implementation.

Timer regression independently reproduced and verified by Codex: deliver cancelled turn-A callback after starting turn B. Before the fix, B expired immediately. After the generation guard, no expiration occurred and B retained 10,000ms. This is an injected scheduler test; AppState and modal integration still require device checks.

## Phase 1 final gate (Claude Code, 2026-11-24, after review fixes)

Run from the project root with Node 22.14.0 / npm 10.9.2. Details and rule interpretations: IMPLEMENTATION-PHASE1.md.
- `npm run check`: passed (app and test typecheck, ESLint with 0 problems, Prettier check, tests).
- `npm test`: 77 tests in 18 suites, 0 failures (~1.4 s). New since the 71-test run: $1/$2/$3 openings (with reserve and last-contender limits), exhausted-deck refusal, stale-turn guard, two late-cancelled-callback shot-clock regressions (confirmed to fail with the guard temporarily disabled), storage-unavailable status, daily result range and catalog checks.
- ESLint rule probe: a temporary file with `console.log`, an unused import and a literal inline style produced three errors (`console.warn` allowed); the file was deleted.
- `npx expo install --check`: dependencies up to date. `npx expo-doctor@latest`: 20/20 checks passed.
- `npx expo export --platform ios` and `--platform android`: bundled (963 and 958 modules) into git-ignored `.work/`. Bundling is not a device test.
- `npm audit`: 3 moderate findings (`minimatch` inside Expo's `@expo/fingerprint` tooling); the only fix offered downgrades to SDK 52, so it was not applied.
- Device gap: I ran no simulator or emulator in this session (`xcrun simctl` needed approval that was not granted). The only native evidence is Codex's Expo Go boot-screen launch above. No gameplay exists to test on device yet.

## Independent integration checks while phase 2 is being built

2026-11-24, Codex: `npx tsx --test --test-reporter=spec src/game/__tests__/*.test.ts src/storage/__tests__/*.test.ts` passed 42/42 tests in 10 suites. Coverage includes one-document save round trips, daily reservation and abandonment, midnight resume, idempotent reveal, invalid saved data, serialized writes, bot pacing and fresh-step guards, modal/background scheduling pauses, and hidden-rating projections. Expected injected storage errors were reported by the never-throw helpers. This is an interim logic check, not completed native acceptance.

Additional native target prepared: iPhone SE (3rd generation), iOS 18.5, for 375×667 layout checks. All three targets run matching Expo Go; full UI checks await the completed screen implementation.

Codex independently ran `npx tsx --test --test-reporter=spec src/data/__tests__/expandedCatalog.test.ts`: 9/9 passed, 0 skipped. This includes an exact comparison against the captured public data file, deterministic replays, 2/3/4-seat drafts for all fifteen expansion packs, and forced-fill coverage. The expansion is not yet registered in the running app; native pack navigation is still pending.

Clock persistence regression fixed by Opus and independently rechecked by Codex: create at 10,000ms, bid at 9,000ms now retains `updatedAt=10000` and survives save validation. `npx tsx --test --test-reporter=spec src/engine/__tests__/clockPersistence.test.ts` passed 8/8, including full games with backward/jittery clocks and rejected non-finite readings. System and device clocks were not changed.

## Phase 2 implementation gate (Claude Code, 2026-11-24)

Full UI and integration build; details in IMPLEMENTATION-PHASE2.md. Run from the project root with Node 22.14.0. REVIEW-PHASE2 findings (DST rollover, popTo leave path, bid context in the dock, "No bids yet" copy, Home fit, recorded daily pack and opponent, `sourceIndex` removal, stale comment) were addressed before this run.
- `npm run check`: passed (app and test typecheck, ESLint 0 problems, Prettier, tests).
- `npm test`: 124 tests in 28 suites, 0 failures (~2 s), including the parallel worker's expanded-catalog and clock suites.
- `npx expo install --check`: dependencies up to date (`expo-image` 58.0.18 added via `expo install`). `npx expo-doctor@latest`: 20/20.
- `npx expo export --platform ios` and `--platform android`: bundled, 1250 and 1246 modules, into git-ignored `.work/`. Bundling is not a device test.
- `npm audit`: unchanged, 3 moderate (`minimatch` inside Expo's `@expo/fingerprint`).
- Device gap: I ran no simulator or emulator (by instruction). All on-device behavior from TEST-PLAN.md is pending Codex's pass on iPhone 17 Pro, iPhone SE and Galaxy_S23_360dp.

## Sheet accessibility fix (Claude Code, 2026-11-24)

Fix for the REVIEW-PHASE2 native roster check: while any sheet is open, `AppScreen` and `TabBar` set `accessibilityElementsHidden` (iOS) and `importantForAccessibility="no-hide-descendants"` (Android). Both are restored when the last sheet closes. Details are in IMPLEMENTATION-PHASE2.md.
- `npm run check`: passed (app and test typecheck, ESLint 0 problems, Prettier, 124 tests in 28 suites, 0 failures).
- `npx expo export --platform ios` and `--platform android`: bundled, 1251 and 1247 modules, into git-ignored `.work/`. No dependency or native config changed.
- Device gap: I did not check this on a device (by instruction). Pending for Codex, on iOS and Android:
  - With the roster, rules and leave sheets open, the accessibility tree must not show `auction-leave`, `auction-rules`, `auction-roster` or the dock.
  - The same check for the Home discard, Daily preview, pack details, Setup, Verdict and Settings sheets, including the tab bar.
  - Everything comes back after closing with ✕, the backdrop and Android back.

## Independent native acceptance — 2026-11-24 (Codex, Expo Go)

Targets: iPhone 17 Pro / iOS 26.2, iPhone SE 3 / iOS 18.5, Galaxy_S23_360dp Android emulator. Native actions used Argent 0.31.1, reading fresh accessibility trees before each action; iOS screenshots used simctl because Argent's screenshot returned a stale white frame. No real accounts, messages, payments or system-clock changes.

- iPhone 17 Pro: completed a full NBA Point guards draft against The Shark. Verified opening bid payment, an opening skip decrement, free pass after an existing bid, hidden ratings in live/roster/pre-verdict views, explicit reveal, full result and native Share sheet (cancelled without sending). Result: Shark 439, You 423; spent $9/$8, remaining $11/$12. Full Expo Go process restart restored the exact revealed result; Collection contained one entry, with no duplicate.
- iPhone 17 Pro: completed Movies daily / Action all-time against Shark. Human spent $10, bot $7; final totals 482/489. Returning to Daily showed Played · 482 and a See the result action, with no second start. Animated intermediate score values were not treated as final scores.
- Android: four-seat setup with two people plus Accountant/Gambler; edited a long name and verified the configured name-length cap. The native keyboard kept the edited field visible and scrolling reached lower seats and clock control. Began a timed draft and observed both humans' turns.
- Android: roster left open well beyond ten seconds preserved the same Baby Driver lot and Player 2 turn; on close, the clock still had six seconds. Hardware Home / reopening Expo Go and its recent project retained the lot and remaining time. This confirms pause/resume, not yet an isolated single-expiry assertion.
- Android: save-and-leave returned to Home with Card 3 of 30; hardware Back exited to Expo Go rather than re-entering the disabled auction. Reopened project and Resume restored the same draft and enabled scheduling.
- Accessibility fix independently verified: iPhone daily preview hides underlying tabs; iPhone and Android roster sheets expose their content and close control while removing auction toolbar/dock from the accessibility tree. Android hardware Back dismisses the roster and restores controls.
- Visual review: revised iPhone auction keeps the current amount and leader visible in the pinned dock. Long movie titles and photo/fallback art render. A grammatical "You is leading" finding was sent to Opus for copy correction. Small-screen final screenshot checks remain below.

Standalone previews are being built separately. Expo Go observations above are not claimed as standalone release validation.

## Name-neutral copy fix (Claude Code, 2026-11-24)

This fixes the "You is leading" finding above, plus the doubled full stop in the turn banner's spoken label. Details are in IMPLEMENTATION-PHASE2.md. Only copy and labels changed.
- Rendered through i18next with the app's settings for "You", "The Shark" and "Ana". Examples:
  - "Leading: You"
  - "On the table: $4. Leading: You."
  - "Your move, You. $20 left · 5 spots to fill · 2 skips."
  - "Steph Curry goes to You for $1. Nobody else has room."
  - "Winner: You"
  - "Next move: You"
- `npm run typecheck`, `npm run lint` and `npm run format:check` all passed. `npm test` passed 124 tests in 28 suites with 0 failures.
- Device gap: I did not check this on a device (by instruction). The dock status, banner labels, forced-fill banner, verdict pill and Home resume line need checking on device.

## Final independent checks and standalone Android — 2026-11-24

- `npm run check`: passed independently by Codex after native review fixes (124 tests / 28 suites; 0 failures, skips or cancellations). App/test TypeScript, ESLint and Prettier all pass. `npx expo install --check`: dependencies up to date; `npx expo-doctor@latest`: 20/20 checks pass.
- Android Release ARM64 build: passed with Gradle 9.4.1 / JDK 21.0.7, 430 tasks, 9m33s. Initial Expo build failed on missing generated headers; explicit `generateCodegenArtifactsFromSchema` followed by `assembleRelease --no-configure-on-demand` resolved it without changing dependencies or native source. Commands in BUILD.md. APK installed and launched as `com.paddle.pitch`, independent of Metro.
- Standalone Android, 360dp: played a full Quarterbacks draft against Accountant with emulator Wi-Fi and mobile data disabled before starting. Designed initials artwork appeared for uncached photos. Restarted the app at card 6: Home restored the same card, turn, $13 balance and one remaining roster spot. Resumed and finished offline. Pre-verdict remained hidden; reveal gave Accountant 456 (spent $10) and You 406 (spent $8). Native share text contained these exact scores; cancelled without sending. Networking restored afterward.
- Android replay returned to the same Quarterbacks / Accountant setup. Back returned Home. Collection contained exactly one record. Haptics off and reduced motion on survived the mid-game process restart. Rules and reset sheets hid the background accessibility controls; Android Back dismissed rules. Cancelling reset preserved the record.
- iPhone SE, current bundle: completed a four-seat Quarterbacks game with all three bot types. Final scores: Shark 467 (spent $16), Accountant 445 ($14), You 404 ($10), Gambler 401 ($13). Pinned bid context, raises and pass remained reachable; card and roster content scroll on this 375×667 screen. Old pre-fix bundle screenshots were excluded from delivery. Confirmed reset on this disposable test installation produced the Collection empty state; no personal data was involved.
- Controlled iPhone 17 Pro two-human clock test: Player 2 started with two skips. After one ten-second expiry, Player 2 had one skip and was out of the card; You still had two skips and a fresh clock, on the same Drake Maye card. Rules open for eleven seconds preserved that state and nine seconds remained after closing. Backgrounding beyond a turn duration preserved the same turn with eight seconds on returning. Save-and-leave then returned Home.
- iPhone daily completion persisted after bundle reload: Collection showed two drafts (the earlier quick game and daily), with daily streak 1, and the daily row offered only See the result.
- iOS standalone: prebuild/CocoaPods succeeded; Release compilation failed in ExpoModulesJSI under installed Xcode 26.2 / Swift 6.2.3. Expo SDK 58 officially requires Xcode 26.4+. No standalone iOS artifact or TestFlight result is claimed. iOS gameplay validation above used Expo Go SDK 58.

Practical limits: no physical phone/haptic sensation check, full VoiceOver/TalkBack navigation, store signing/review, backend sync or online multiplayer validation. DST, malformed saves and races were exercised through isolated/injected tests rather than changing the host/device clock or corrupting personal storage. Public source coverage limits remain in SITE-AUDIT.md.

### Delivery verification

The final two copy-only corrections clarify remote-photo loading and name reset "Erase your saved games?". The final APK was rebuilt successfully (12 seconds, 13 executed / 417 up-to-date tasks), installed over the tested app, and launched. Codex verified both revised paragraphs/title in the native Android UI, cancelled reset, and left Home ready. Existing history/preferences were preserved. The new copy did not change gameplay behavior. Final `npm run check` was rerun after those edits: 124/124 tests, app/test typecheck, ESLint and formatting pass.

The iPhone SE reset empty state persisted after the subsequent bundle reload. Android history detail reproduced the exact 456/406 result and its original steal/overpay. Final screenshots in `artifacts/screenshots` are direct native captures; build archives are locally available and gitignored. No store publish, account creation, company contact or code push occurred.

## Phase 3 — Auction 0.2.0 (Claude Code, 2026-11-24, after Codex's usage limit)

Codex reached its usage limit at 17:27 while starting the native review. The main implementation worker stopped at 17:34 on a network error, after its own gate had passed (152 tests). Claude Code (Opus 5.5, maximum effort) finished the remaining work and ran the checks below with Node 22.14.0 / npm 10.9.2.

### Gate

- `npm run check`: passed. App and test typecheck, ESLint with 0 problems, Prettier, `check:neutral` ("no source name or link in the repository, no retired brand in the app") and 153 tests in 37 suites with 0 failures. New since phase 2: lineup engine and grade-reference tests, averages and share text, sports grouping and dailies, font metrics read from the bundled TTFs, the pinned card-privacy list, and the sport behind a saved pack id.

### Android release APK

- Built per BUILD.md with JDK 21.0.7: `npx expo prebuild --platform android --no-install`, the codegen pass, then `./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a`. BUILD SUCCESSFUL in 4 min 3 s.
- `aapt2 dump badging`: package `com.paddle.pitch`, versionCode 2, versionName 0.2.0, label "Auction", arm64-v8a. Checksum in `artifacts/builds/SHA256SUMS.txt` (local, git-ignored).
- The unpacked APK was searched for the source name and address in every spelling the guard knows: 0 hits in any file. "paddle" appears only in the native identifier and the internal `paddle.*.v1` storage keys.
- `adb install -r` over the 0.1.0 preview succeeded with the first-install time kept. Both 0.1.0 Collection records (Dragon Ball, Quarterbacks) are still there and now show "avg 91.2" (456 / 5). Home shows the Auction wordmark, and Sports → Soccer opens without Metro.

### Native checks

- **Android, 360 dp emulator (Expo Go):** Sports chooser, Soccer modes, Starting XI setup with three seats. A complete three-seat Starting XI draft (You, The Shark, The Accountant; 134 s, 32 human actions, forced $1 fills at the end) reached "Argue now." with the "g" intact, then the verdict: 942, 928 and 884 pts with averages 85.6, 84.4 and 80.4, grades, steal and overpay, and rated rosters tagged by position.
- **iPhone SE, 375 × 667 (Expo Go):** Sports and Soccer pages. A complete four-seat NFL full-lineup draft (42 cards, $30 each, a $24 limit at the start; 132 s, 22 human actions) reached "Argue now." and the verdict: 597 and 580 pts at the top, averages 85.3 and 82.9. Collection lists it with "avg 85.3" and the NFL glyph.
- **iPhone 17 Pro (Expo Go):** Sports chooser, all four sport pages, the current / all-time switch relabelling every mode, and the About sheet from the Starting XI card.
- **Accessibility:** each sport card, lineup card and mode row is one labelled button, with a separate "About the … pack" button. Labels read the era, positions, budget and picks, and spell a formation out ("1 goalkeeper, 2 centre-backs, …").

### Found on device and fixed

- Formation lines broke inside a slot ("ST" then "×1" on the next line). Slot tokens now use a no-break space, and each "·" stays at the end of its line.
- On screens without a header (Home, Daily, Collection, the revealed verdict), scrolled text ran under the status bar into the clock. AppScreen now starts the scroll view below the status bar.
- Soccer, NFL and F1 packs showed the generic Sports basketball in setup, the resume card, Collection and history. Those now use the sport's own glyph.

### Gaps

- The iOS standalone build still needs Xcode 26.4+ (unchanged).
- Not repeated this session: offline photo fallback, the shot clock, backgrounding and daily completion. Codex verified them before phase 3, and the phase 3 changes do not touch them.
- Simulators and an emulator only; no physical phones.

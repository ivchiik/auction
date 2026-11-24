# Phase 1 implementation — scaffold, engine, content, architecture

Date: 2026-11-24. Implementer: Claude Code running `claude-opus-5-5` (Opus 5.5) at max effort, as assigned by Codex. Status: phase 1 complete and green on automated checks; no screens beyond a minimal boot screen (by instruction). Codex's own Expo Go launch of the boot screen is recorded in QA.md; I ran no simulator or emulator myself.

## Delivered
- Expo SDK 58 TypeScript app with React Navigation, i18next, Zustand, AsyncStorage persistence, safe areas, Expo fonts/haptics/splash, Lucide icons available; bare `src` aliases; ESLint/Prettier/TypeScript/test scripts.
- Pure auction engine in `src/engine` (no React Native, storage, timers, `Math.random` or `Date.now`).
- Five curated content packs, one per topic, generated with provenance from the public data file (`docs/CONTENT.md`).
- Persistence layer for resume, daily attempts and settings, with corrupt or unreadable data handled safely.
- Shared theme/typography/i18n, `AppText`/`AppButton`/`AppScreen` primitives, typed routes, two stores, container-hook convention and a boot screen.
- 77 automated tests (engine, content, persistence, shot clock).

## Stack (versions verified with npm on 2026-11-24)
- Scaffold: `create-expo-app` cannot target this non-empty folder, so the official `blank-typescript@sdk-58` template was generated into `.work/template-sdk58` (no install) and its pins, app config shape and icon assets were copied. The template's own `AGENTS.md` and `.claude/settings.json` were not copied: the project AGENTS.md is authoritative (the template recommends Expo Router; this project mandates React Navigation).
- Runtime: expo ~58.0.26 (SDK 58, latest stable; 58.0.0 shipped 2026-09-29), react 19.3.0, react-native 0.88.1, @react-navigation/native ^7.5.2, @react-navigation/native-stack ^7.21.1, react-native-screens ~4.30.1, react-native-safe-area-context ~5.11.1, @react-native-async-storage/async-storage 2.2.0, expo-font ~58.0.12, expo-haptics ~58.0.8, expo-splash-screen ~58.0.14, expo-status-bar ~58.0.5, @expo-google-fonts/fraunces ^0.4.1, @expo-google-fonts/dm-sans ^0.4.2, i18next ^27.2.6, react-i18next ^18.0.3, zustand ^5.1.0, react-native-svg 15.16.0, lucide-react-native ^1.79.0. Native modules were installed with `npx expo install` (SDK-compatible pins).
- Dev: typescript ~6.0.3, eslint ^9.39.5 (ESLint 10 is out, but eslint-plugin-react-native 5.0.0 declares support up to 9), eslint-config-expo ~58.0.4, eslint-plugin-react-native ^5.0.0, eslint-plugin-unused-imports ^4.4.1, eslint-config-prettier ^10.1.8, prettier ^3.10.1, tsx ^4.23.15, @types/node ^22 (Node 22.14.0 via asdf), globals ^16.5.0.
- One lockfile: `package-lock.json` (npm 10.9.2).
- Icons: the design exports use Lucide glyphs, so `lucide-react-native` replaced `@expo/vector-icons` (single icon library; not used on screen yet).
- Tests run on Node's built-in runner through `tsx` (no Jest/Vitest: Vitest 5 requires Vite as a mandatory peer, which is heavy for a pure engine).

## Scripts
`npm run typecheck` (app config, then test config with Node types) · `npm run lint` · `npm run format` / `format:check` · `npm test` · `npm run check` (all four) · `npm run content:extract -- <players.js> <date>` · `npm start` / `ios` / `android`.

## Architecture
| Folder (alias) | Role |
|---|---|
| `engine` | Pure rules: types, seeded RNG, rules/reserve, deck, reducer, selectors, bots, scoring, validation, daily seeds/streaks, simulation driver. Imports nothing outside itself. |
| `data` | Catalog boundary: content types, generated packs, lookups, `rulesForPack`, `toEngineCards`, `toPublicCard` (rating-free allowlist). |
| `storage` | Never-throw key-value helpers, AsyncStorage adapter, active-draft envelope, daily records, settings. |
| `stores` | `useSettingsStore` (write-through), `useDraftStore` (engine transitions with ordered autosave). |
| `theme` | Palette and purpose tokens, Fraunces/DM Sans type scale with capped accessible scaling, radii/spacing, `ThemeProvider` with live window size, `useTheme(_styles)`. |
| `i18n` | i18next instance, English resources, compile-time `TranslationKey`. |
| `components` | `AppText`, `AppButton`, `AppScreen`, topic surface map. |
| `navigation` | `RootRoute` enum (all planned routes), typed param list, `navigationRef`; `RootNavigator` registers BOOT only. |
| `screens` | `boot/BootScreen.tsx` + `BootScreen.styles.ts` + `container/useBoot.ts`. |
| `utils` | `appClock` (the only ambient time reader; wall and monotonic), `createShotClock`, `playHaptic`. |

Conventions: named const-arrow components; `ComponentName.styles.ts` exporting `_styles(theme, dimensions)`; `ComponentName.types.ts`; flat named-export barrels with a trailing `// types` section; screen logic in `container/use<Feature>.ts`. Aliases come from tsconfig `paths` only (no `baseUrl`, deprecated in TypeScript 6); Metro resolves them natively (Expo's `tsconfigPaths` defaults on) and so does tsx, so no Babel resolver plugin. Inside one layer, files import siblings with a single-level relative path to avoid barrel import cycles; the navigation barrel leaves out `RootNavigator` for the same reason (App.tsx imports it directly). `AppText` takes app copy through `i18nKey` and data as children, so content is never treated as a translation key. The brand name lives only in `src/i18n/locales/en.ts` and `app.json`.

## Engine rules as implemented
1. 2–4 seats; $20 budget; five spots. `RuleSet.slots` lists roster slot kinds with `accepts` positions (validated non-overlapping) for future mixed lineups; flex slots are not supported yet.
2. Deck per slot kind: required spots plus 50% spare (capped by the pack), a seeded random subset; the lowest-rated ~15% of what was dealt is bench and comes last. Our own formula for the published "about 85% starters and 15% bench, bench shows up late, the deck grows with the player count"; the website's exact draw sizes were not copied.
3. First opener is seeded-random; the opening seat then rotates to the next seat with room.
4. Openings: $1, $2 or $3 (Codex verified the live site shows three opening amounts). Raises: +$1/+$2/+$3 over the current bid. Both are capped by the reserve. Guard of ours: when every other eligible seat has already passed, the last contender wins on the spot, so only the $1 opening is offered.
5. A pass after a bid is free and puts the seat out for that card. A pass before any bid spends one of two skips per draft; with no skips the seat must open.
6. If every eligible seat passes before an opening bid, the card is discarded for good. Otherwise the last bidder standing wins at the current price.
7. Budget reserve: maximum bid = money minus $1 for each other open spot; the invariant "money ≥ open spots" holds after every action.
8. Full rosters get no turns. When exactly one seat still has open spots, every following card that fits is awarded to it at $1 automatically (no decision needed).
9. Supply lock: when cards left for a slot kind (counting the card on the block) are no more than the open spots for it, the opening pass is blocked for everyone. Passing after an opening bid stays free; otherwise no auction could end.
10. Termination: every outcome preserves "cards left ≥ open spots" per slot kind, so all rosters fill before the deck ends. An exhausted deck with open spots returns `DeckExhausted` instead of a "complete" draft (defensive; validated states cannot reach it).
- API: `createDraft(input)` validates seats, rules, pool, seed and supply. `applyAction(state, action, now)` returns `{ ok, value | error }`, never throws and never mutates; error codes explain the refusal (not your turn, over the reserve, illegal amount, pass locked, stale turn…). `getTurnOptions` gives legal amounts, the reserve-limited maximum, whether a pass costs a skip and why a pass or raise is blocked. `getTimeoutAction` returns the shot-clock default (pass if allowed, else the smallest bid). `getTurnKey` identifies one decision; `applyActionForTurn` refuses actions scheduled for an earlier decision.
- Bots: Accountant (fair value, minimum steps, skips clearly weak cards), Shark (stars ≥ 80th percentile of the pack: pays ~1.5× plus $1 and may jump the price; lets ordinary cards go and skips them while spare cards remain), Gambler (misreads each card by up to ±12 points, fixed per card and seat; whim factor 0.75–1.35; random legal step). Valuation uses only what a fan knows: pack ratings, cards already shown, each seat's money and open spots, and how many cards are left; a test proves reordering the unseen deck never changes a bot decision. Decisions are deterministic per decision point (seeded by draft seed, lot, bids, passes and seat), so replays and resumes repeat exactly.
- Verdict: score = sum of hidden ratings (money left never counts); competition ranking with shared places (1, 1, 3); every top-ranked seat wins and `isTie` marks co-winners; grade from the roster's share between the worst and best possible five among the cards shown (A+ ≥ 0.90, A ≥ 0.75, B ≥ 0.60, C ≥ 0.45, D ≥ 0.30, else F); best buy and biggest overpay compare each price with the table's spend split by rating weight. Grade thresholds and the value formula are our interpretation, not website parity (Codex observed B/B+ for 404/432 on the site).
- Daily: `toDateKey(now, timezoneOffset)` uses the device's local day; `dailySeed(date, topic)`; `createDailyPlan` picks the pack and one opponent personality from the seed (You against one bot); `computeStreak` keeps yesterday's streak alive until today ends. Not linked to the website's dailies.

Bot economics, measured on the real packs with all-bot tables (1,500 drafts; throwaway script `.work/tools/bot-economics.ts`):
| Table | Accountant win % | Shark win % | Gambler win % | Money left (A / S / G) |
|---|---|---|---|---|
| 2 seats | 54.5 | 45.5 | — | $8.84 / $6.29 / — |
| 3 seats | 55.5 | 32.3 | 12.2 | $7.83 / $3.91 / $3.87 |
| 4 seats | 46.2 | 33.0 | 10.4 | $6.61 / $2.28 / $2.71 |
The Shark pays about $6.2–6.4 for stars and $1.00 for everything else. Leftover money is mostly structural: with passive opponents, lots clear at the price the second-keenest bidder gives up at, often $1. A rejected alternative (pricing each card as a share of the money on the table) let the Shark win 64–72% without reducing leftover money. Human playtesting should drive phase-2 tuning.

## Persistence
- Active draft: `{ saveVersion, savedAt, packVersion, draft }` in `paddle.activeDraft.v1`. Loading returns `none`, `restored`, `discarded` (unreadable JSON, unknown format, engine-invalid state, missing or changed pack, card/rating mismatch: removed and reported) or `unavailable` (device storage failed: nothing removed). Saves are chained in transition order, so an older write can never land after a newer one.
- Daily records: one attempt per topic per day; starting uses the attempt even if abandoned; the first finish wins. Parsing drops malformed attempts, non-finite or out-of-range results and attempts whose pack/topic do not match the catalog.
- Settings: haptics (on), shot clock default (off), reduced motion override (off); each field falls back independently.

## Validation results (final run, 2026-11-24)
| Command | Result |
|---|---|
| `npm run check` | pass: typecheck (app + tests), lint, format check and tests |
| `npm test` | 77 tests, 18 suites, 0 failures, about 1.4 s. Covers ~450 randomized 2–4 seat drafts (mixed humans and bots) with invariants checked and illegal actions probed after every action, 80 mixed-slot drafts, repeat-seed determinism, ties, reserve, skips, pass elimination, supply lock, forced fills, exhausted deck, turn guard, bot fairness, content provenance and privacy, resume and corrupt-save handling, daily records, shot clock including late cancelled callbacks |
| `npm run lint` | 0 problems. A temporary probe file confirmed `no-console` (warn/error allowed), unused imports and `react-native/no-inline-styles` all fail; the probe was deleted |
| `npx expo install --check` | Dependencies are up to date |
| `npx expo-doctor@latest` | 20/20 checks passed |
| `npx expo export --platform ios` / `android` | bundled (963 / 958 modules); only the six font weights in use are included. Output in git-ignored `.work/`. Bundling is not a device test |
| `npm audit` | 3 moderate: `minimatch` ReDoS inside `@expo/fingerprint` (Expo CLI tooling). The only offered fix downgrades to SDK 52, so it was not applied |

Problems found and fixed during the work:
- Two test-script mistakes (a forced-fill test read its "before" values after the first automatic fill; a scripted bidding war could run out of legal raises). The engine was correct.
- A test caught that unreadable JSON in the save slot was treated as "nothing saved" and left behind; it is now reported as discarded and deleted.
- Codex review P1: openings were limited to $1; now $1/$2/$3 with reserve limits and tests.
- Codex review P1: the shot clock could expire a newer turn when a cancelled callback arrived late. Timers now carry a generation number; two regression tests deliver stale callbacks (after a new turn and after pause/resume) and fail if the guard is removed (checked by temporarily disabling it).
- Codex review: storage failures and corrupt data now produce different results; daily results are range-checked and catalog-checked; a stale-turn guard exists at engine and store level; monotonic time source added (`appClock.monotonicNow`) for the shot clock.

## Not done, and device gaps
- I did not run any simulator or emulator: `xcrun simctl list` needed approval that this session did not have. Codex launched the boot screen in Expo Go on iOS 26.2 and on the 360dp Android emulator (QA.md), but that is startup evidence only.
- No product screens (by instruction). The boot screen has no buttons, so nothing claims an unbuilt feature.
- App icon and splash are still Expo template assets; `design/exports/app-icon.png` is ready for phase 2.
- `app.json` bundle identifiers `com.paddle.pitch` are provisional placeholders for local builds.
- Not yet wired: bot scheduling, shot clock hook, haptics on actions, reduced-motion detection, image loading and fallback art, share, daily/history flows.

## Open questions for Codex
1. Last contender at an opening: only $1 is offered because any opening wins immediately. Keep that guard, or offer $2/$3 for parity?
2. The supply lock blocks only the opening pass (my reading of "passing locks for everyone"). Confirm.
3. Forced fills are automatic; phase 2 should show each award ("Yours at $1, nobody else has room"). Confirm the UX.
4. Deck formula (required + 50% spare, bottom 15% last) and seeded-random first opener are our choices. Acceptable?
5. Bot strength: Accountant strongest, Gambler weakest. Acceptable as personality flavour, or tune after playtesting?
6. Daily table is You against one seeded bot. Confirm (versus a larger bot table).
7. Image rights for ESPN, IMDb/Amazon and English Wikipedia files (see CONTENT.md).
8. The four-letter grade scale differs from the site's (it shows B+). Add plus/minus grades?

## What phase 2 needs
- The validated design exports (home, setup, auction, verdict and daily PNGs exist) plus specs for the missing states: pack chooser, roster drawer, pre-verdict, quit/resume, rules, settings, history, corrupt-save, empty and loading.
- Register the routes already typed in `RootRoute`; build screens on container hooks over `useDraftStore`/`useSettingsStore`.
- Auction container: bot turns via `botRngFor`/`chooseBotAction` after a think delay, dispatched through `dispatchForTurn(getTurnKey(...))`; shot clock through `createShotClock` with `appClock.monotonicNow`, paused on AppState background; haptics via `playHaptic`; reveal choreography respecting reduced motion; ratings only from the verdict.
- Daily/verdict persistence protocol (Codex review): treat the active save as the source of truth and reconcile on load. A daily draft carries `mode`/`dailyKey`, so an attempt can be recorded idempotently on resume; a completed draft records its result (finishing is idempotent) before the save is cleared. Store a "revealed" flag with the save so a restart after the reveal shows the verdict.
- `npx expo install expo-image` (SVG and caching for card art) with designed fallbacks; React Native `Share` for results; local history list.
- Device QA on the iPhone simulator and the 360dp Android emulator with screenshots (TEST-PLAN.md).

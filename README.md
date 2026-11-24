# Auction

A native mobile auction game: everyone at the table gets the same play budget and an empty roster, cards come up one at a time, and hidden ratings settle the argument at the end.

**Status:** playable hiring pitch, version 0.2.0, with a standalone Android preview and iPhone validation through Expo Go. Local data only. See [build and install notes](docs/BUILD.md) and [native evidence](artifacts/README.md).

## Run it

Requirements: Node 22.13 or newer (the project was built on 22.14.0), npm, and Expo Go for SDK 58 on a simulator, emulator or phone.

```bash
npm ci
npm start            # Metro; press i (iOS simulator) or a (Android emulator), or scan with Expo Go
npm run ios          # compile a native iOS app (Xcode 26.4+ required)
npm run android      # compile and open a native Android app
```

Every native module is part of Expo Go for SDK 58, so no development build is needed for that path. Native builds keep the preview identifier `com.paddle.pitch` from the first build, so an installed preview updates in place and keeps its saved games; it is never shown to players. This Mac needs a newer Xcode before it can compile the iOS standalone app. Android build commands and the codegen prerequisite are in [BUILD.md](docs/BUILD.md).

| Script                            | What it does                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run check`                   | typecheck + lint + format check + neutrality guard + tests (the gate)                |
| `npm test`                        | Node test runner via `tsx`: engine, content, lineups, persistence, scheduler, layout |
| `npm run typecheck`               | `tsc` for the app, then for the tests (Node types only there)                        |
| `npm run lint` / `lint:fix`       | ESLint (Expo config, no `console.log`, unused imports, no inline styles)             |
| `npm run format` / `format:check` | Prettier (100 columns, double quotes)                                                |
| `npm run check:neutral`           | fails if any file names the card-data source, or app copy shows a retired name       |
| `npm run content:extract`         | rebuilds the five original packs from a saved copy of the public data file           |

## What you can play

- **Play:** pick a topic (Sports, Movies, Characters, Songs, Cars). Sports asks for a sport first (Soccer, NFL, NBA, Formula 1), then a mode: the whole-team lineup leads, then single-position modes, with current players or all-time greats where both exist. Other topics list their packs. 35 packs, 2,409 cards.
- **Lineups:** the soccer Starting XI is $40 for 11 picks (GK ×1, CB ×2, FB ×2, MID ×3, W ×2, ST ×1); the NFL full lineup and the Formula 1 fantasy team are $30 for 7. Each card fills a spot for its position, seats with no open spot for that position sit the card out, and setup, the auction, the roster sheet and the verdict all show spots by position. Single-position modes are $20 for five.
- **The table:** 2–4 seats, each a person (pass the phone) or a computer: The Accountant, The Shark or The Gambler. Optional ten-second shot clock.
- **The auction:** openings at $1/$2/$3 and raises of +$1/+$2/+$3, two opening skips each, a $1 reserve for every other open spot, passing out of a card, rotating openers, forced $1 fills for the last seat with room, and a lock on skipping when the cards left only just cover the open spots. Buttons show the resulting amount and why anything is unavailable. Ratings never appear before the verdict.
- **The verdict:** rosters first with ratings hidden, then a deliberate reveal: winner or tie, scores, each roster's average rating to one decimal, grades against the best and worst legal lineup from the cards shown, the steal of the draft and the biggest overpay, every pick's rating with its basis, native share, play again.
- **Daily:** five date-seeded tables (one per topic) with a fixed pack and computer opponent, one attempt each, local streaks, and a new board at local midnight without restarting. Dailies stay quick: always a $20, five-pick pack.
- **Collection:** every finished draft with full detail and averages. **Settings:** haptics, reduced motion, shot-clock default, rules, how grades work, content, play-money and local-data notes, and a confirmed erase.
- Drafts save after every move and resume after a restart. Corrupt or outdated saves are cleared with a notice. Gameplay works offline; remote photos use designed fallbacks when unavailable.

## Architecture

```
src/
  engine/      pure auction rules: seeded RNG, reducer, reserve, position slots, bots, scoring, validation, daily seeds
  data/        content catalog (generated packs with provenance), sports grouping, rating-free public card view
  game/        app logic on top of the engine: saved-game document, sessions, daily board,
               history records, averages and share text, table scheduler, table view
  storage/     AsyncStorage adapter, never-throw helpers, serialised latest-wins write queue, settings
  stores/      Zustand: game data (one persisted document), settings, today's date, active tab
  hooks/       bootstrap (hydrate once), day rollover, reduced motion, app state, haptics, sheet accessibility
  i18n/        i18next with English copy and label helpers; the app name lives here and in app.json only
  theme/       palette and purpose tokens, Fraunces + DM Sans type scale with clip-free line heights, live window size
  components/  AppText/AppButton/AppScreen primitives, sheets, card art, icons, roster and result widgets
  navigation/  typed routes; RootNavigator (Main tabs, Topic, Sport, Setup, Auction, Verdict, History, Settings)
  screens/     each screen = JSX presenter + container/use<Feature>.ts hook
scripts/       pack generators and the neutrality guard (developer tools, never bundled)
```

- Bare aliases (`engine`, `game`, `components`, …) come from `tsconfig.json` paths, resolved natively by Expo's Metro and by `tsx` in tests.
- `engine` and `game` have no React Native imports, so the rules, persistence and scheduler are unit-tested in Node.
- Every action carries the step it was made for (`applyActionForStep`): double taps, stale renders and late timers are refused at the dispatch layer.
- Game data (active draft, reveal state, daily attempts, history) is one document written by one serialised queue, so a crash cannot leave a daily attempt and its result out of step.
- Fraunces line heights come from the font's own metrics (`src/theme/fontMetrics.ts`, checked against the bundled TTFs by a test), so descenders such as the "g" in "Argue now." are never clipped on Android.

## Content and attribution

Cards, notes, ratings and rating bases come from a 2026-11-24 snapshot of the original game's public data file, used with permission. Neither the app nor this repository names that source: `npm run check:neutral` fails the gate if its name or address appears in any file. The library is a curated selection, not the full catalog or a live feed. Photos are linked from third-party hosts and credited in each pack's details; drawn cards stand in for them offline or when absent. See `docs/CONTENT.md`, `docs/CONTENT-EXPANSION.md` and `docs/SPORTS-CATALOG.md`.

## Verification

Automated checks and device results are logged in `docs/QA.md`; implementation notes are in `docs/IMPLEMENTATION-PHASE1.md`, `docs/IMPLEMENTATION-PHASE2.md` and `docs/PHASE3.md`. A passing build is not treated as a device test.

## Before any release

- Store listing, privacy policy and support contact. The name Auction is approved; trademark clearance has not been assessed.
- Image rights for third-party hosted photos (ESPN, IMDb/Amazon, Wikipedia, TheSportsDB, PokeAPI sprites).
- A content export and refresh contract with the owner. Daily drafts here are seeded locally and do not match the original game's dailies.
- Developer accounts, signing, final bundle identifiers, release builds and store review.
- Not built: online multiplayer, tournaments, Call Out, accounts, analytics.

# Delivery board

Codex is lead and reviewer. Claude Code Opus 5.5 / max is implementation owner.

| ID | Work | Acceptance | Status |
|---|---|---|---|
| DISC-01 | Inspect public site/pages and play flows | Rules, content map, UX findings and discrepancies written | Done — public pages, full core game and verdict, extra-mode setup/rules; coverage limits documented |
| BRAND-01 | Naming and visual direction | Editable Brilliant screens and tokens, reviewed for overflow | Done — five screens and original app icon; name Auction approved 2026-11-24 |
| APP-01 | Expo scaffold and primitives | Compatible deps, i18n/theme/nav, scripts and lint | Done — native shell booted on iOS/Android |
| GAME-01 | Pure auction engine and catalog | Rule tests, seeded bots, full valid drafts | Done — 20 packs, deterministic engine and review regressions included |
| UI-01 | Discover/setup/auction/results | Complete playable native loop aligned to design | Done — complete quick/daily loops and four-seat game verified natively |
| DAILY-01 | Daily/resume/history | Stable local daily, one attempt, persistence and recovery | Done — native persistence, daily/reveal, settings and sharing verified |
| POLISH-01 | Motion, haptics, share, rules/settings | All visible actions functional and accessible | Done — native persistence, daily/reveal, settings and sharing verified |
| LIB-01 | Broaden the playable library | Twenty curated packs, source provenance and all-pack simulations; see CATALOG-EXPANSION.md | Done — 20 packs / 664 cards registered, 9/9 expansion tests independently pass; expanded sports chooser opened on iPhone |
| QA-01 | Independent review and checks | TypeScript/lint/tests/compatibility green | Done — independent 124/124 tests, types/lint/format, Expo 20/20; review findings resolved |
| QA-02 | iOS and Android device testing | Actual flows and screenshots on both targets | Done for pitch — iPhone 17 Pro/SE via Expo Go and standalone Android; iOS standalone needs Xcode 26.4+ |
| PITCH-01 | Demo instructions and handoff | README, evidence, limitations and next phase | Done — APK, native screenshots, editable designs, run/demo/build notes and QA record |
| P3-01 | Clipped text | Fraunces descenders visible on Android/iOS, small phones, scaled text; audit similar bugs | Done — metric-derived line heights; formation wrapping and status-bar overlap also fixed; checked on 360 dp Android and iPhone SE |
| P3-02 | Average points | One-decimal roster averages after the reveal, in saved results and share text | Done — verdict tiles, rated rosters, Collection, history, share, spoken labels |
| P3-03 | Sports subcategories and Starting XI | Sport → mode choice; soccer attackers/midfielders/defenders and the $40 XI in current and all-time pools | Done — 35 packs / 2,409 cards; lineups first; full XI, NFL lineup and four-seat drafts completed on devices |
| P3-04 | Rename to Auction, no source name in the app | Visible name, metadata, share text and docs; neutrality guard | Done — `npm run check:neutral` scans the whole repository; legacy native identifiers kept for saves |
| P3-05 | Verification, Android preview, public upload | Gates, native checks, fresh APK, reviewed upload to `ivchiik/auction` | See QA.md "Phase 3" |

Next phase after playable pitch: full source/catalog parity, full roster tournaments and Call Out, then online multiplayer if commissioned. No claim of complete website parity before these are verified.

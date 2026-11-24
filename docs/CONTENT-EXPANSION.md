# Content expansion — fifteen additional packs (LIB-01 data)

Status (2026-11-24): **registered.** Codex moved integration earlier so the first native gameplay tests see the whole library. `PACKS` in `src/data/catalog.ts` now lists the five phase-1 packs, with ids, versions and order unchanged, followed by these fifteen. The catalog has 5 topics, 20 packs, 664 cards, four packs per topic. The data barrel, engine, storage and UI were not changed by the registration pass. Library-wide provenance: `docs/CONTENT.md`.

Implementation: Claude Code, Opus 5.5 at maximum effort (second worker, data only). Brief: `docs/CATALOG-EXPANSION.md`. Codex independently verified the expansion tests before registration.

## Codex decisions (2026-11-24)
- The top 32 NBA, top 30 soccer and top 40 Nintendo selections, with source-order tie breaks, are accepted as specified.
- Original notes stay exactly as published, including contextual sports statistics. Actual ratings and basis lines remain hidden before the reveal.
- The curation provenance and the editorial classification (including "set by hand") are kept.
- Removing `sourceIndex` from the public card boundary is assigned to the UI/integration owner for later. The registration pass did not change it.

## Source
- Same local snapshot as phase 1: `.work/source-snapshot-2026-11-24/players.js` (git-ignored scratch), copy of the source site's public `players.js` data file, fetched 2026-11-24. 1,319,873 bytes, sha256 `253ead645a16a4c957aec9f114be433c0ea0ee5a7be8f55f2f44d5e39e8763cf`.
- Parsed as JSON text, never executed. The extractor refuses the file unless the text around the object is only `//` comments, `window.POOLS =` and `;`.
- Publisher, permission note and the website's mode/rating descriptions are the same as in `docs/CONTENT.md`. The site's mode names and rating explanations quoted here come from the saved home and ratings pages (`.work/site-home.html`, `.work/site-ratings.html`).
- Ratings and basis lines are the website's published values, copied exactly. This project has not obtained or verified any 2K, Letterboxd, Metacritic, Spotify, league or manufacturer figures. Nothing here is a live feed or the complete website catalog.

## Files
New in the expansion pass:
| File | Purpose |
|---|---|
| `scripts/extract-expanded-packs.mjs` | Generator: snapshot path + date in, the 15 modules out (formatted with the repo's Prettier config). |
| `src/data/expandedPacks/*.ts` | 15 generated `ContentPack` modules (same schema and layout as `src/data/packs/*`). Do not edit by hand. |
| `src/data/expandedCatalog.ts` | `EXPANDED_PACKS`: the 15 packs only, in topic order. Its header comment still says the packs are unregistered; that file was outside the registration pass, so the stale sentence needs a one-line fix by its next owner. |
| `src/data/__tests__/expandedCatalog.test.ts` | 9 tests in 2 suites (engine simulations, privacy, provenance, source comparison). It is written to hold both before and after registration. |
| `docs/CONTENT-EXPANSION.md` | This file. |

Changed in the registration pass: `src/data/catalog.ts` (appends `...EXPANDED_PACKS` after the original five), `src/data/__tests__/catalog.test.ts` (see Registration below) and `docs/CONTENT.md`.

Rebuild (no npm script was added because `package.json` was out of scope):
```
node scripts/extract-expanded-packs.mjs .work/source-snapshot-2026-11-24/players.js 2026-11-24
```
Both arguments are required. Every pack gets `version` `<date>.<revision>`, where `revision` is an optional per-pack field in the extractor (default 1). Saved sessions whose pack version no longer matches are discarded safely (`matchesShippedPack` in `src/game/gameData.ts`). Now that these packs are live, raise `revision` on any spec whose change alters that pack's cards.

## Packs
Every pack is $20 for five picks, with one slot accepting one position. Cards stay in source order and keep their `sourceIndex`. Card IDs are `<pack-id>--<slug of the name>`, the same scheme as phase 1.

| Topic | Pack id | Title / subtitle | Source pool | Website mode | Selection | Cards | Ratings | Editorial | Images |
|---|---|---|---|---|---|---|---|---|---|
| Sports | `nba-point-guards` | Point guards / NBA · Current players | `nba.pg.current` | No PG-only mode. Closest: NBA › Guards & wings › Current players ($20 · PG, SG, SF) | Curated top 32 by rating | 32 of 76 | 79–97 | 0 | 32 ESPN |
| Sports | `soccer-strikers` | Strikers / Soccer · Current players | `soccer.st.current` | No striker-only mode. Closest: Soccer › Attackers › Current players ($20 · strikers and wingers) | Curated top 30 by rating | 30 of 43 | 70–99 | 4 | 30 TheSportsDB |
| Sports | `f1-drivers` | Drivers / Formula 1 · Current grid | `f1.drv.current` | Formula 1 › Drivers › Current grid | Complete pool | 22 of 22 | 55–99 | 2 | 22 ESPN |
| Movies | `action-all-time` | Action: all-time | `action.best.all` | Movies › Action › All-time | Complete pool | 40 of 40 | 90–99 | 0 | 40 IMDb |
| Movies | `comedy-all-time` | Comedy: all-time | `comedy.best.all` | Movies › Comedy › All-time | Complete pool | 40 of 40 | 91–99 | 0 | 40 IMDb |
| Movies | `horror-all-time` | Horror: all-time | `horror.best.all` | Movies › Horror › All-time | Complete pool | 40 of 40 | 90–99 | 0 | 40 IMDb |
| Characters | `dragon-ball` | Dragon Ball / Characters · Anime | `anime.dbz.all` | Characters › Anime › Dragon Ball Z | Complete pool | 35 of 35 | 42–99 | 35 | 20 Wikipedia |
| Characters | `naruto` | Naruto / Characters · Anime | `anime.naruto.all` | Characters › Anime › Naruto | Complete pool | 33 of 33 | 54–95 | 33 | 16 Wikipedia |
| Characters | `nintendo` | Nintendo / Characters · Video games | `games.nintendo.all` | Characters › Video games › Nintendo | Curated top 40 by rating | 40 of 63 | 66–99 | 40 | 25 Wikipedia + 4 PokeAPI |
| Songs | `pop-20s` | Pop: the 2020s | `pop.20s.all` | Songs › Pop › The 2020s | Complete pool | 30 of 30 | 40–99 | 0 | none |
| Songs | `rock-all-time` | Rock: all-time | `rock.best.all` | Songs › Rock › All-time | Complete pool | 40 of 40 | 40–99 | 0 | none |
| Songs | `hip-hop-10s` | Hip-hop: the 2010s | `hiphop.10s.all` | Songs › Hip-Hop/Rap › The 2010s | Complete pool | 30 of 30 | 40–99 | 0 | none |
| Cars | `hypercars-all-time` | Hypercars: all-time | `hyper.best.all` | Cars › Hypercars › All-time | Complete pool | 40 of 40 | 40–99 | 0 | none |
| Cars | `sports-cars-20s` | Sports cars: the 2020s | `sportscar.20s.all` | Cars › Sports cars › The 2020s | Complete pool | 24 of 24 | 40–99 | 0 | none |
| Cars | `off-roaders-all-time` | Off-roaders: all-time | `offroad.best.all` | Cars › Off-roaders › All-time | Complete pool | 40 of 40 | 40–99 | 40 | none |

Totals: 15 packs, 516 cards, 154 editorial ratings, 269 cards with images. Registered library: 5 topics, 20 packs, 664 cards, four packs per topic.

Each pack's `provenance` records `poolPath`, `siteMode`, `snapshotDate`, `sourceEntryCount`, a `selection` sentence ending in "N of M entries.", a `ratingMethod` taken from the site's how-to, and the permission note. `ratingLabel` is the one-line summary for pack lists.

### Curated selections (top N)
These are documented curations. They do not claim parity with any website mode. Rule: keep the N highest published ratings; at the cutoff, a tie goes to the earlier entry in source order. Pack cards are then listed in source order.
- **NBA point guards, top 32 of 76.** 31 guards rate 80 or more. Twelve share the cutoff rating of 79, and only the first in source order is kept: Darryn Peterson (index 19). The other eleven are left out: Collin Sexton, Scoot Henderson, Reed Sheppard, Kevin Porter Jr., Tre Jones, Collin Gillespie, Fred VanVleet, Brandin Podziemski, Daniss Jenkins, T.J. McConnell and Jeremiah Fears. A clean cut would be top 31 (80 and up) or top 43 (79 and up). Codex kept top 32. Since registration, any future change of N also needs `revision: 2` on that spec.
- **Soccer strikers, top 30 of 43.** 29 strikers rate 71 or more. Three share the cutoff rating of 70, and only Karim Benzema (index 30) is kept; Rasmus Højlund and Danny Welbeck are left out. A clean cut would be top 29 or top 32.
- **Nintendo, top 40 of 63.** The cutoff is 66; all three characters rated 66 are kept and the next rating is 64, so no tie crosses the cutoff. The website's "Nintendo" pool also contains guest characters, kept as published (e.g. Sonic, Shadow, Knuckles, Metal Sonic, Mega Man).

### Rating basis as published
| Pack | Example basis lines | Method recorded in `ratingMethod` |
|---|---|---|
| NBA PG | `2K27: 97 OVR · 2025-26: 31.1/4.3/6.6, 68 gm` | NBA 2K27 overall rating |
| Soccer ST | `2025-26 PL: 27 G, 8 A, 35 apps`; `… (blended)`; `editorial (703 min in 2025-26)`; `set by hand · 2025-26 Saudi: …` | 2025-26 league goals and assists per 90, discounted outside the big five; barely-played players editorial. The site's how-to and ratings pages explain neither "(blended)" nor "set by hand". |
| F1 | `2026: 390 pts`; `set by hand · 2026: 0 pts` (Bottas, Perez) | 2026 championship points |
| Movies | `Letterboxd 4.50 · Metacritic 85`; `Letterboxd 3.82 · no Metascore` | Letterboxd average and Metacritic blended, ranked within genre; audience alone without a critic score |
| Dragon Ball, Naruto | `editorial: raw power` | Editorial |
| Nintendo | `editorial: strength, with a nod to how big the games are` | Editorial |
| Pop 20s, Hip-hop 10s | `Spotify plays: 4,627,716,109 · ranked within Pop, the 20s` | Lifetime Spotify plays ranked within genre and decade |
| Rock all-time | `Spotify plays: 2,171,012,308 · ranked within Rock, the 90s` | Same, ranked within each song's own decade, so ratings compare songs to their own era rather than by raw plays |
| Hypercars all-time, Sports cars 20s | `641 hp · 0-60 in 3.0s · 224 mph · ranked within Hypercars, the 00s` | Power, 0–60 and top speed, ranked within class and decade |
| Off-roaders all-time | `editorial: off-road capability · 60 hp · 65 mph · ranked within Off-roaders, the 70s` | Editorial: how far from a road it can get, ranked within class and decade |

`ratingSource` is `editorial` when the published basis starts with "editorial" **or "set by hand"**: the site's own judgement, and the line says so. This matters for three cards: Cristiano Ronaldo, Valtteri Bottas and Sergio Perez. A hand-set 76 for a driver with 0 points is not a published metric. Phase 1 only checked for "editorial" because no phase-1 pack has a hand-set line. The catalog test now applies the same rule to all 20 packs.

## Images
- 269 of 516 cards link an image exactly as the website does. Hosts: `a.espncdn.com` (ESPN headshots; NBA 32, F1 22), `r2.thesportsdb.com` (TheSportsDB player cutouts; soccer 30, a new host), `m.media-amazon.com` (IMDb posters; movies 120), `upload.wikimedia.org/wikipedia/en/` (English Wikipedia uploads; 61 characters) and `raw.githubusercontent.com/PokeAPI/sprites/…/official-artwork/` (PokeAPI sprites repository; 4 Pokémon, a new host). All are https, and all are PNG/JPG/JPEG with no SVG.
- 247 cards have no image: all 100 songs, all 104 cars, and 15 Dragon Ball, 17 Naruto and 11 Nintendo characters. Designed fallback art is required, as in phase 1.
- `accentColor` is the site's colour field (uppercased hex). Movies, songs and cars use a few generic colours per pool, so topic surfaces remain the better fallback.
- Rights: hosts and owners are third parties. The user's permission from the website owner may not cover these files. Treat the images as pitch-only until rights are confirmed. The extractor refuses unknown image hosts, so any new host needs a credit rule and a review.

## Privacy review (pre-verdict text)
Scope: name, subtitle and note of every new card, checked against its own rating and basis (`.work/library-leaks.ts`; the test file enforces the strict part).
- **No public field contains its own rating number or its basis line.** The test asserts this for all 516 cards, through `toPublicCard` and through `buildTableView` at every step of a draft for each pack.
- **Partial basis hints. These are source notes, reported and left unchanged.** The website shows the same note on its auction card (`$("pnote").textContent = p.note` in the saved site HTML), so these are public flavour text, not hidden data. They do let a knowledgeable player infer part of the order:
  - Soccer: 13 notes repeat the league-goal count that appears in their basis: `erling-haaland` (27), `harry-kane` (36), `lautaro-martinez` (17), `serhou-guirassy` (17), `igor-thiago` (22), `donyell-malen` (14 in 18), `cristiano-ronaldo` (28), `joao-pedro` (15), `deniz-undav` (19), `patrik-schick` (16), `jonathan-burkardt` (13 in 22), `vedat-muriqi` (23), `ferran-torres` (16). Card IDs are prefixed `soccer-strikers--`.
  - F1: ratings are 2026 championship points, and 10 notes state a 2026 championship position or a points fact: Antonelli leads, Verstappen 2nd, Russell 3rd, Hamilton 4th, Leclerc 5th, Norris 6th, Piastri 7th, Hadjar 8th, Gasly 10th, and Bottas has zero points (his 76 is set by hand). This effectively orders those drivers' ratings before the reveal. **Codex decision:** keep these notes as published, as the website does; actual ratings and basis lines stay hidden.
  - False positives, no action needed: `nba-point-guards--darryn-peterson` ("Second overall pick"), `nintendo--donkey-kong` ("plays the bongos"), car names containing numbers (`C1000`, `Defender 90`, `Land Cruiser FJ60`, `Patrol 60`, `Patrol Y60`).
- **Latent leak. Assigned to the UI/integration owner; deliberately not changed in the registration pass.** `toPublicCard` (`src/data/catalog.ts`) includes `sourceIndex`, and `buildTableView` passes it on as `lot.card.sourceIndex`. Several source pools are sorted by rating. The Spearman correlation between `sourceIndex` and the hidden rating is +1.00 for rock, hypercars and off-roaders all-time, −1.00 for pop 20s and hip-hop 10s, and −0.99 for the three movie packs. The live `pop-80s` is also −1.00. No `.tsx` renders `sourceIndex` today. Recommendation: drop `sourceIndex` from the public allowlist, since it is provenance and not display data, or keep it out of every pre-verdict render and accessibility label.

## Registration pass (2026-11-24)
What changed:
- `src/data/catalog.ts`: `import { EXPANDED_PACKS } from "./expandedCatalog"`; `PACKS` is now `[NFL_QUARTERBACKS, SCIFI_80S, LOONEY_TUNES, POP_80S, SUPERCARS_80S, ...EXPANDED_PACKS]`. Nothing else in the file changed: `toPublicCard` and `sourceIndex` are untouched.
- `src/data/__tests__/catalog.test.ts`:
  - The flat host set became a host → path allowlist covering the two new hosts. `raw.githubusercontent.com` is allowed only under `/PokeAPI/sprites/`, `r2.thesportsdb.com` only under `/images/media/player/`, and the existing hosts under their observed paths. The test also checks `image.host` equals the URI's hostname and that the protocol is https.
  - The editorial rule became `/^(editorial|set by hand)/i`.
  - New assertions: exactly four packs per topic; `getCatalogSummary()` equals `{ topics: 5, packs: 20, cards: 664, snapshotDate: "2026-11-24" }`; the phase-1 ids, versions and order lead `PACKS`.
  - All other strict checks are unchanged (unique ids, ≥20 cards, valid rules, provenance, integer 40–99 ratings, privacy, four-seat bot drafts, daily plans).

| Command | Result |
|---|---|
| `npx prettier --check src/data/catalog.ts src/data/__tests__/catalog.test.ts` | Clean. |
| `npx eslint src/data/catalog.ts src/data/__tests__/catalog.test.ts` | Clean. |
| `npx tsx --test --test-reporter=spec src/data/__tests__/catalog.test.ts` | 7 tests, 7 pass. |
| `npm test` (pure suite, after registration) | 120 tests, 27 suites, 120 pass, 0 fail. A final re-run, after the UI worker had added one suite: 121 tests, 28 suites, 121 pass, 0 fail, 0 skipped. |
| `npx tsx .work/library-registered-summary.ts` | 5 topics, 20 packs, 664 cards. Sports 4 packs/115 cards, movies 4/150, characters 4/138, songs 4/130, cars 4/131. Phase-1 five first. 355 cards with images. |

Not run in this pass, by instruction: whole-app typecheck, repo-wide ESLint and Prettier (UI in flight), simulators.

## Validation (expansion pass, before registration, 2026-11-24)
| Command | Result |
|---|---|
| `node scripts/extract-expanded-packs.mjs .work/source-snapshot-2026-11-24/players.js 2026-11-24` | 15 modules written; counts exactly as in the table. No duplicate IDs, unknown hosts or malformed entries. |
| Re-run of the same command, hashing every module before and after (`.work/library-hash.mjs`) | Byte-identical. Final combined digest over the 15 modules: `568609f8…`. |
| `npx tsx --test --test-reporter=spec src/data/__tests__/expandedCatalog.test.ts` | 9 tests, 2 suites, 9 pass, 0 fail, 0 skipped (about 0.7 s). |
| Mutation check: one generated note edited by hand, then the test re-run | Failed as intended: `soccer-strikers--erling-haaland differs from soccer.st.current[0]`. Regenerating restored byte-identical files. |
| Same test file run from `src/` (snapshot path absent) | 8 pass; the source suite is skipped with "snapshot not found at …". |
| `npm test` (whole project) | 111 tests, 26 suites, 111 pass, 0 fail. |
| `npx tsc --noEmit -p tsconfig.test.json` | Clean. |
| `npx tsc --noEmit -p .work/library-tsconfig.json` (`src/data` + `src/engine` with the app compiler options) | Clean, including all 15 modules. |
| `npx tsc --noEmit` (whole app) | Fails, and the count moves as the other worker edits (12 errors earlier, 17 at the final run). All are in their in-progress UI files: `AppScreen.tsx`, `AppSheet.styles.ts`, `CardArt.styles.ts`, `RootNavigator.tsx`, `BootScreen.tsx`, `useBoot.ts`, `MainScreen.tsx`, `useSetup.ts`. None in `src/data`. Not touched. |
| `npx eslint` on the owned files (script, `expandedCatalog.ts`, `expandedPacks/*.ts`, the test) | Clean. |
| `npx prettier --check` on the same files | Clean. |
| `npx eslint .` / `npx prettier --check .` (read-only, whole repo) | 8 ESLint errors in `src/components/AppSheet/AppSheet.tsx` (7× `react-hooks/refs`) and `src/components/CardArt/CardArt.tsx` (1× `react-hooks/set-state-in-effect`). Prettier flags 9 files owned by others (`CustomIcons.tsx`, `RulesSheet.tsx`, `ScreenHeader.tsx`, `session.test.ts`, `tableScheduler.test.ts`, `game/index.ts`, `useAppBootstrap.ts`, `i18n/locales/en.ts`, `useGameStore.ts`). Not touched. |

What the 9 tests check:
1. Exactly the briefed pools, IDs, topics and counts; three packs per topic; the original five IDs still resolve in `PACKS`.
2. Pack and card IDs are unique across `PACKS` plus the expansion. This holds before and after integration because registered packs are counted once.
3. $20, one slot of five, one position, valid rules, and no deck shortfall at 2, 3 or 4 seats.
4. Provenance fields; selection text; strict source order; complete pools keep indexes 0…n−1; ratings are integers 40–99; the editorial rule; image https/host/allowlist; hero/villain tags exactly on character packs.
5. Privacy: `toPublicCard` and `buildTableView` (every step of a three-seat draft per pack) carry no rating, basis or rating source, and no public field states its own rating.
6. 270 seeded drafts (15 packs × 2/3/4 seats × 6 seeds, mixing all three bots with random-move human seats). `checkDraftInvariants` and the $1-per-open-spot reserve are checked after every action. At the end: phase complete, five cards per seat, unique awards from the pack, money plus spend equals $20, and verdict totals match the pack's ratings. Different seeds deal different decks.
7. Determinism: the same seed and seats replay to deep-equal final states and verdicts (45 pairs).
8. Every seat skips whenever it may (45 tables). Every roster still fills; discards equal min(2, spare cards). The last-cards pass lock engages exactly where it must: only F1 at four seats (22 drivers for 20 spots).
9. Where the snapshot exists, field-by-field equality for all 516 cards (name, subtitle, rating, note, basis, image URI, colour, side) against `pool[sourceIndex]`, and each top-N selection re-derived independently.

Coverage of the 270 random drafts (`.work/library-sim-stats.ts`): 19,222 invariant-checked actions, 3,406 sales, 644 forced fills, 127 discards, 1,194 skips spent, 181 seats finishing on exactly $0, and a top price of $16. Random play never reached the last-cards lock, which is why test 8 exists.

The expansion pass itself ran no simulator or emulator and did no UI work.

## Integration status
1. **Done:** packs registered in `PACKS` after the original five (see Registration pass).
2. **Done:** live catalog test updated. Before the edit, a dry run of the old assertions over all 20 packs (`.work/library-integration-dryrun.ts`) failed on exactly 37 cards for two reasons: 34 images on the two new hosts and 3 "set by hand" lines. `docs/CONTENT.md` now describes the 20-pack library.
3. **For the UI/integration owner: show attempted dailies from their recorded pack.** `createDailyPlan` chooses from the topic's sorted pack ids, so registration changed the computed pack for 103 of 140 date/topic plans from 2026-11-24 to 2026-12-21; seeds and opponents never change. For 2026-11-24 itself: movies `scifi-80s` → `action-all-time`, characters `looney-tunes` → `dragon-ball`, cars `supercars-80s` → `hypercars-all-time`; sports and songs keep their pack. I re-checked this against the registered catalog. The game layer already pins started and finished attempts to their recorded pack (`src/game/daily.ts` resolves `attempt?.packId` before `plan?.packId`), and `parseDailyRecords` validates the attempt's `packId` through `getPack`. Screens must title, resume and score a daily from `status.pack`/`attempt.packId`, never from `plan.packId`. A useful regression: start a daily with the 5-pack list, read its status with the 20-pack list, expect the same pack.
4. **For the UI owner: pack list and labels.** Four packs per topic need the scalable pack list from the brief:
   - Use `title`, `subtitle`, `noun` and `ratingLabel` from data, and show `provenance.selection` / `siteMode` / `ratingMethod` in the pack details.
   - NBA, soccer and Nintendo must read as curated subsets, not website modes.
   - New position ids: `pg`, `st`, `driver` (alongside `film`, `character`, `song`, `car`); add labels if the UI maps positions or slot ids to copy.
   - Fallback art is needed for 309 of 664 cards library-wide.
5. **Assigned to the UI/integration owner:** remove `sourceIndex` from the public card boundary, or never render it before the verdict. The F1/soccer notes are decided: keep them.
6. **Optional:** add `"content:extract-expanded": "node scripts/extract-expanded-packs.mjs"` to `package.json`, and fix the stale "not registered" header comment in `src/data/expandedCatalog.ts`.
7. **Remaining gates:** once the UI settles, run `npm run check` and the native smoke tests on iOS and Android with all 20 packs, then record the results in `docs/QA.md`.

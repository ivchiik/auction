# Sports catalog — fifteen sports modes (phase 3 content)

Status at hand-off (2026-11-24): **generated and tested, not registered.** `SPORTS_PACKS` (`src/data/sportsCatalog.ts`) holds 15 packs and 1,745 cards. The main agent integrates them into `PACKS` and the Sports UI. Nothing outside the five owned paths below was edited.

Implementation: Claude Code, Opus 5.5 at maximum effort (content worker, data only). Brief: `docs/PHASE3.md` plus the content brief from Codex.

| Owned file | Purpose |
|---|---|
| `scripts/extract-sports-packs.mjs` | Generator: snapshot path + date in; the 15 modules and `sportsCatalog.ts` out, formatted with the repo's Prettier config. |
| `src/data/sportsPacks/*.ts` | 15 generated `ContentPack` modules, one per pack. Do not edit by hand. |
| `src/data/sportsCatalog.ts` | Generated. `export const SPORTS_PACKS: readonly ContentPack[]` in catalog order. |
| `src/data/__tests__/sportsCatalog.test.ts` | 12 tests in 2 suites (see Validation). |
| `docs/SPORTS-CATALOG.md` | This file: exact provenance, mapping, rights scope, integration notes. |

Rebuild:
```
node scripts/extract-sports-packs.mjs .work/source-snapshot-2026-11-24/players.js 2026-11-24
```
The generator builds and checks everything before writing anything, and it rewrites only files whose content changed. Re-running it on the same snapshot produces byte-identical files. Combined sha256 of the 16 generated files (path + content, sorted): `83b7f96a…`.

## Source and verification
- **Data:** the same local snapshot as phases 1–2. `.work/source-snapshot-2026-11-24/players.js` (git-ignored) is a copy of the source site's public `players.js`, fetched 2026-11-24: 1,319,873 bytes, sha256 `253ead645a16a4c957aec9f114be433c0ea0ee5a7be8f55f2f44d5e39e8763cf`. Nothing was refetched.
- **Reading the file:** it is parsed as JSON text and never executed. The generator refuses the file unless the text around the object is only `//` comments, `window.POOLS =` and `;`. Entry shape, per the file's own header: `[name, team or era line, rating 40-99, note, rating basis, headshot url, team colour]`. Every sports entry used here has exactly these 7 fields.
- **Modes and formations:** taken from the source's mode table in the saved home page, `.work/site-current.html` (byte-identical to `.work/site-home.html`), lines 960–1016, `const SPORTS = {…}`. Codex checked the rules on the how-to page on 2026-11-24 (`docs/PHASE3.md`). Quoted entries:
  - Soccer: `att` "$20 · strikers and wingers", deck `["st","w"]`; `mid` "$20 · the engine room"; `bk` "$20 · centre-backs, full-backs, keepers", deck `["cb","fb","gk"]`; `xi` "$40 · GK, 2 CB, 2 FB, 3 MID, 2 W, ST", `need:{gk:1,cb:2,fb:2,mid:3,w:2,st:1}`.
  - NFL: `rb` Running backs, $20; `wr` "Receivers & tight ends", deck `["wr","te"]`; `def` Defense, $20; `lineup` "$30 budget · QB, 2 RB, 2 WR, TE, DEF", `need:{qb:1,rb:2,wr:2,te:1,def:1}`.
  - NBA: `guard` "Guards & wings", "$20 · PG, SG, SF", deck `["pg","sg","sf"]`; `big` "$20 · PF, C", deck `["pf","c"]`.
  - F1: `team` "Fantasy team", "$30 · 5 drivers + 2 constructors", `need:{drv:5,con:2}` ("current mode deals the whole grid").
  - Eras: soccer, NFL and NBA "Current players" / "All-time greats"; F1 "Current grid" / "All-time greats".
- **Complete pools:** the source deals each game from the whole era pool of each slot (`buildPool()`, lines 1548–1574, `pools[src][S.era]`). Every pack here therefore carries the complete pools of its mode, with no curation.
- **Rating methods:** quoted from the page's help section "The ratings" (line 937), which matches the how-to wording. "Current NFL players carry their Madden NFL 27 overall rating, every position including defense. Current NBA players carry their NBA 2K27 overall rating. Current F1 drivers and constructors are rated on 2026 championship points. … Current soccer strikers are rated on 2025-26 league goals and assists per 90 minutes (discounted outside the big five leagues), wingers half on that and half editorial; midfielders, defenders and keepers are editorial, because the box score doesn't measure them. … Coaches, rookies, players who barely played, NFL players Madden doesn't list, and every all-time pool are editorial calls, and say so."
- **Skips:** the source allows two opening passes per player per game in every mode (`SKIPS_PER_GAME = 2`, line 1366), the same as the engine.

## Runtime neutrality
- Every pack's provenance reads `publisher: "Licensed game catalog"`, `siteUrl: ""` and `dataUrl: ""`. The permission line says "the source", never a name. `siteMode` uses the mode path only (e.g. "Soccer › Starting XI › Current players ($40 · GK, 2 CB, 2 FB, 3 MID, 2 W, ST)"). The main agent's updated `catalog.test.ts` already expects exactly these values.
- Generated module headers name only the generator, "the saved public data snapshot of 2026-11-24" and the pool paths. The repository never names the source; its exact name and addresses are kept in the git-ignored `.work/SOURCE-PROVENANCE.md`.
- The generator stops if any generated string mentions the source's name, or any web address other than an image URI or host. The test checks the same with neutral patterns (no web addresses; no "$N Draft"-style product names). No source entry used here mentions the source or a web address.
- The source's name could still reach the UI through `topic.sourceBody` ("Cards, notes and ratings from {{publisher}}, used with permission."). With the neutral value, it reads "…from Licensed game catalog…". The wording is the main agent's call.

## The fifteen packs
Every pack: topic Sports, version `2026-11-24.1`, complete pools, cards in source order. Subtitles: "Soccer · Current players", "Soccer · All-time greats", "NFL · Current players", "NBA · Current players", "Formula 1 · Current grid".

| Pack id | Title | Budget · slots (id × count: positions) | Source pools (entries) | Cards | Ratings | Editorial | Images |
|---|---|---|---|---|---|---|---|
| `soccer-attackers-current` | Attackers | $20 · `attacker` ×5: st, w | `soccer.st.current` (43) + `soccer.w.current` (46) | 89 | 51–99 | 14 | 88 |
| `soccer-attackers-alltime` | Attackers | $20 · `attacker` ×5: st, w | `soccer.st.alltime` (24) + `soccer.w.alltime` (17) | 41 | 85–99 | 41 | 36 |
| `soccer-midfielders-current` | Midfielders | $20 · `mid` ×5: mid | `soccer.mid.current` (60) | 60 | 66–95 | 60 | 60 |
| `soccer-midfielders-alltime` | Midfielders | $20 · `mid` ×5: mid | `soccer.mid.alltime` (29) | 29 | 84–99 | 29 | 27 |
| `soccer-defenders-current` | Defenders | $20 · `defender` ×5: cb, fb, gk | `soccer.cb.current` (43) + `soccer.fb.current` (35) + `soccer.gk.current` (24) | 102 | 66–94 | 102 | 99 |
| `soccer-defenders-alltime` | Defenders | $20 · `defender` ×5: cb, fb, gk | `soccer.cb.alltime` (22) + `soccer.fb.alltime` (16) + `soccer.gk.alltime` (16) | 54 | 85–99 | 54 | 47 |
| `soccer-starting-xi-current` | Starting XI | $40 · `gk` 1, `cb` 2, `fb` 2, `mid` 3, `w` 2, `st` 1 | the six current pools, gk → st (24+43+35+60+46+43) | 251 | 51–99 | 176 | 247 |
| `soccer-starting-xi-alltime` | Starting XI | $40 · same six slots | the six all-time pools, gk → st (16+22+16+29+17+24) | 124 | 84–99 | 124 | 110 |
| `nfl-running-backs-current` | Running backs | $20 · `rb` ×5: rb | `nfl.rb.current` (63) | 63 | 70–98 | 1 | 63 |
| `nfl-receivers-current` | Receivers & tight ends | $20 · `receiver` ×5: wr, te | `nfl.wr.current` (80) + `nfl.te.current` (39) | 119 | 52–99 | 11 | 119 |
| `nfl-defense-current` | Defense | $20 · `def` ×5: def | `nfl.def.current` (84) | 84 | 60–99 | 3 | 84 |
| `nfl-full-lineup-current` | Full lineup | $30 · `qb` 1, `rb` 2, `wr` 2, `te` 1, `def` 1 | qb (63) + rb (63) + wr (80) + te (39) + def (84), all current | 329 | 52–99 | 15 | 329 |
| `nba-guards-wings-current` | Guards & wings | $20 · `guard-wing` ×5: pg, sg, sf | `nba.pg/sg/sf.current` (76 + 75 + 76) | 227 | 50–97 | 3 | 227 |
| `nba-bigs-current` | Bigs | $20 · `big` ×5: pf, c | `nba.pf.current` (68) + `nba.c.current` (72) | 140 | 58–97 | 1 | 140 |
| `f1-fantasy-team-current` | Fantasy team | $30 · `driver` 5, `constructor` 2 | `f1.drv.current` (22) + `f1.con.current` (11) | 33 | 55–99 | 2 | 22 |

Totals: 15 packs, 1,745 cards, 636 editorial ratings, 1,698 cards with images and 47 without. A player appears in every pack that draws on their pool, with a pack-scoped card id (e.g. a current striker appears in Attackers and Starting XI).

## Ids, positions, slots and source order
- **Pack ids** read `<sport>-<mode>-<era>`. The sport is the prefix (`soccer-`, `nfl-`, `nba-`, `f1-`) and the era is the suffix (`-current`, `-alltime`). No id clashes with the 20 shipped packs.
- **Card ids** are `<pack-id>--<slug of the name>`, the existing scheme.
- **Position** is the key of the source pool: `st w mid cb fb gk`, `qb rb wr te def`, `pg sg sf pf c`. The exception is Formula 1, whose pools `drv` and `con` become `driver` (as in the live `f1-drivers` pack) and `constructor`.
- **Slot ids mean one set of positions across the whole library**, so screens can label slots by id. The test enforces this over `PACKS` plus these packs.

  | Slot id | Accepts | Used by |
  |---|---|---|
  | `attacker` | st, w | soccer attackers |
  | `defender` | cb, fb, gk | soccer defenders |
  | `receiver` | wr, te | NFL receivers & tight ends |
  | `guard-wing` | pg, sg, sf | NBA guards & wings |
  | `big` | pf, c | NBA bigs |
  | `gk` `cb` `fb` `mid` `w` `st` | the same single position | XI; `mid` also midfielders; `st` also the live `soccer-strikers` |
  | `qb` `rb` `wr` `te` `def` | the same single position | NFL lineup; `rb`, `def` also their single modes; `qb` also the live `nfl-quarterbacks` |
  | `driver` `constructor` | the same single position | F1 fantasy team; `driver` also the live `f1-drivers` |

- **Slot order** follows the source: XI gk, cb, fb, mid, w, st (the source's "GK, 2 CB, 2 FB, 3 MID, 2 W, ST"; the brief listed fb before cb); lineup qb, rb, wr, te, def; F1 driver, constructor.
- **Combined pools:** `provenance.poolPath` lists the pools joined by ` + `, in card order. `sourceEntryCount` is their total. `sourceIndex` is the entry's offset in that concatenation, so every pack has `sourceIndex` 0…n−1. To reach the published entry, subtract the offsets of the pools listed before it. `selection` names the pools and sizes in words, e.g. "The complete pools for this mode: strikers (43) and wingers (46). 89 of 89 entries."

## Four-seat supply
Every slot holds at least four tables' worth of cards (generator and test enforce `available ≥ count × 4`), and `planDeck` has no shortfall at 2, 3 or 4 seats.

| Pack | Tightest slot at 4 seats (available / required) |
|---|---|
| Starting XI all-time | fb 16/8, w 17/8, gk 16/4, cb 22/8, mid 29/12, st 24/4 |
| Starting XI current | fb 35/8 (all others more) |
| NFL full lineup | rb 63/8 (all others more) |
| F1 fantasy team | driver 22/20, constructor 11/8 |
| Single modes | midfielders all-time 29/20; all others 41+/20 |

F1 at four seats has only 2 spare drivers, so the engine's last-cards pass lock keeps it fillable (seen in the tests). For reference, the source deals larger decks in lineup modes than the engine's required + 50% per slot. It draws XI `{gk:7,cb:10,fb:10,mid:14,w:10,st:8}` and lineup `{qb:8,rb:11,wr:11,te:7,def:8}` at two players, scaled ×1.4 at three and ×1.8 at four, and the current F1 team deals the whole grid. Two-seat XI tables in the engine get one spare keeper and one spare striker, so those slots lock early. Deck sizing belongs to the engine owner; nothing here depends on it.

## Ratings and basis lines
Ratings and basis lines are copied exactly. Nothing was invented, rescaled or deduplicated. Each pack's `ratingMethod` is worded from the how-to and states counts computed from its own cards. The generator stops if the counts don't add up or a claimed pattern doesn't hold. Method texts name no card and quote no rating (tested), because the pack details sheet shows them before play.

| Packs | Basis lines as published | `ratingMethod` / checks |
|---|---|---|
| Soccer current attackers (and the XI's attackers) | `2025-26 PL: 27 G, 8 A, 35 apps`; `… (blended)` (40); wingers `… · half editorial` (39); `editorial (703 min in 2025-26)` (11); one winger plain `editorial`; `set by hand · …` (2: one striker, one winger) | Per-90 method for strikers, half for wingers, barely-played editorial. "(blended)" and "set by hand" are counted; the how-to explains neither. |
| Soccer current midfielders | all 60 `editorial · 2025-26 <league>: G, A, apps` | Editorial; league line is context (checked line by line). |
| Soccer current defenders | centre-backs and full-backs plain `editorial`; all 24 keepers `editorial · 2025-26 <league>: N clean sheets, N apps` | Editorial; checked per position. |
| Soccer all-time (all four modes) | every line `editorial · career` | Editorial (checked). |
| NFL | `Madden 27: 98 OVR · 2025: 19.5 pts/g, 17 gm`; `editorial (not in Madden 27) · …` (rb 1, wr 8, te 3, def 2); `set by hand · Madden 27: 95 OVR` (one defender) | Every "Madden 27: N OVR" line equals the card's rating (generator stops otherwise; test re-checks). The hand-set defender's rating differs from his Madden overall, and his line says so. |
| NBA | `2K27: 97 OVR · 2025-26: 27.7/12.9/10.7, 65 gm`; `editorial (not in 2K27)` (sg 2, sf 1, pf 1) | Every "2K27: N OVR" line equals the rating. |
| F1 | `2026: 390 pts`; constructors `2026: 652 pts`; `set by hand · 2026: 0 pts` (2 drivers) | 2026 championship points. The 22 driver cards equal the live `f1-drivers` pack field for field (tested). |

`ratingSource` keeps the library rule: `editorial` exactly when the basis starts with "editorial" or "set by hand" (636 cards). **Decision for Codex:** 38 winger lines end in "· half editorial" but start with stats, so the rule classifies them as `publishedMetric`. Their basis line states the editorial half at the reveal. `ratingSource` is not displayed anywhere. Reclassifying them would mean changing the rule in the main agent's `catalog.test.ts`.

## Duplicates
The generator checks every pack's combined pools for the same exact entry twice, the same name twice, and two names sharing a card-id slug. It found **none in any of the 15 packs**. Names were not merged heuristically. The test also asserts unique names per pack. Seven soccer players are listed in both eras: Lionel Messi (W/W), Cristiano Ronaldo (ST current, W all-time), Luka Modrić and Kevin De Bruyne (MID/MID), Virgil van Dijk (CB/CB), Manuel Neuer and Gianluigi Donnarumma (GK/GK). No pack mixes eras, so this is not a duplicate. Each era's entry, position included, is kept as published.

## Images and rights
- 1,698 of 1,745 cards link the image URL exactly as the source publishes it:
  - `a.espncdn.com/i/headshots/` → "ESPN headshot" (all NFL and NBA cards, F1 drivers);
  - `r2.thesportsdb.com/images/media/player/cutout/` → "TheSportsDB player cutout";
  - `…/player/thumb/` → "TheSportsDB player thumbnail" (42 all-time cards);
  - **`www.thesportsdb.com/images/media/player/cutout/`** → "TheSportsDB player cutout". This host is new to the library: 5 unique players (Iliman Ndiaye, Enzo Fernández, Ayyoub Bouaddi, Exequiel Palacios, Gianluigi Donnarumma), 12 cards across packs.

  All are https PNG/JPEG. The generator refuses any other host or path.
- No image: all 11 F1 constructors, plus 36 soccer cards (current: 1 attacker, 3 defenders; all-time: 5 attackers, 2 midfielders, 7 defenders; the XI packs repeat these). Play never depends on images; fallback art applies.
- `accentColor` is the source's colour field, uppercased; every entry has a valid hex value.
- **Rights scope:**
  - The user reports permission from the website owner to reuse its data and images. That permission covers the ratings, notes and basis lines shipped here.
  - The image files are hosted and owned by third parties (ESPN, TheSportsDB), so the user's permission may not cover them. Treat them as pitch-only until rights are confirmed.
  - No source code or API was used. Player names, team names and statistics are as published by the source; this project verified no league, Madden, 2K or championship figures.

## Pre-verdict privacy
- `toPublicCard` carries none of `rating`, `ratingBasis`, `ratingSource` or `sourceIndex`. No name, subtitle or note contains the card's basis line or a rating-source term (OVR, Metacritic, Letterboxd, Spotify). The inline dry run below showed the existing table-view privacy test passes for every new pack.
- **Rating-number coincidences (5 cards, source text kept).** The library's strict check, "no visible field contains the rating as a number", flags these subtitles. The number sits inside a career span or a team name and states no rating:
  - `soccer-attackers-alltime--marco-van-basten` and `soccer-starting-xi-alltime--marco-van-basten`: "Ajax · AC Milan, 1981-95" on a 95;
  - `soccer-defenders-alltime--franco-baresi` and `soccer-starting-xi-alltime--franco-baresi`: "AC Milan, 1977-97" on a 97;
  - `nba-bigs-current--dean-wade`: "Philadelphia 76ers · PF" on a 76.

  The new test pins exactly this list and fails on any number that stands alone.
- **Partial hints in notes (kept, the class Codex already accepted for strikers and drivers):**
  - 35 current soccer notes repeat a goal or assist count from their own basis line: 29 attackers, 6 midfielders (the XI repeats both).
  - The F1 constructor notes give most of the 2026 standings: Mercedes "Leading both 2026 championships", Ferrari "Second", Red Bull "Third", McLaren "fourth this year", Racing Bulls "Best of the rest", Alpine "sixth in points", Williams "twelve points", Aston Martin "seven points", Cadillac "Zero points so far". Constructor ratings are points-based, so these order most constructors before the reveal, as the driver notes do. Codex's earlier decision covered the driver notes; the constructor notes are new and flagged here.

## Integration notes for the main agent
Integration dry run (inline, nothing written) of the existing library checks over `SPORTS_PACKS`, as if registered:
1. **`catalog.test.ts` image allowlist:** add `["www.thesportsdb.com", "/images/media/player/"]`. Otherwise 12 cards fail (listed under Images).
2. **`catalog.test.ts` four-seat bot draft** asserts `roster.length === 5`. It fails for the 4 lineup packs; use `rosterSize(rules)` (11 for the XI, 7 for NFL/F1). All 15 packs complete that draft.
3. **`catalog.test.ts` counts:** Sports grows from 4 to 19 packs, and `getCatalogSummary()` grows by 15 packs and 1,745 cards (35 packs, 2,409 cards if all are registered). The "four per topic" assertion needs the new shape.
4. **`cardPrivacy.test.ts`** flags exactly the 5 coincidences above. Strip career spans (`\b\d{4}-\d{2}\b`) and digit-letter tokens (`76ers`) before the number check, as `sportsCatalog.test.ts` does, or pin the 5 ids.
5. **No changes needed:** `tableView.test.ts` passes for all 15; the provenance assertions (publisher, empty URLs, selection "N of"), the editorial rule, unique ids and ≥ 20 cards all pass.

Other notes:
- **Daily:** only `budget === 20` packs with one slot of 5 are quick modes. `createDailyPlan` currently picks from all of a topic's pack ids.
- **Labels:** position labels needed: `st w mid cb fb gk qb rb wr te def pg sg sf pf c driver constructor`. Slot labels needed for `attacker defender receiver guard-wing big` plus the position-named slots. Card subtitles already show positions where the source does (soccer "Barcelona · W"; NFL TE and defenders; NBA "· SG").
- **Size:** the 15 modules are 1,026,910 bytes (about 1.0 MB) of TypeScript source, since cards repeat across modes. Engine cost is small: a fully invariant-checked four-seat XI draft takes about 18 ms.
- **Not generated (out of brief scope):**
  - NBA "Full team" (flex spot + head coach; not expressible as disjoint slots);
  - all-time NFL, NBA and F1 modes (the pools exist: e.g. `nfl.rb.alltime` 30, `f1.drv.alltime` 36);
  - F1 drivers all-time;
  - MLB.

  The live narrow packs (`nfl-quarterbacks` top 31 of 63, `nba-point-guards` top 32, `soccer-strikers` top 30, `f1-drivers`) are unchanged. None of this claims parity with the website's full catalog.

## Validation (2026-11-24)
| Command | Result |
|---|---|
| `node scripts/extract-sports-packs.mjs .work/source-snapshot-2026-11-24/players.js 2026-11-24` | 15 modules + catalog written. "15 packs, 1745 cards. No duplicate players or id clashes." |
| Re-run after a planted edit (one note, one XI quota) | Only the edited module rewritten; combined hash back to `83b7f96a…` (byte-identical). |
| Mutation check: note edited in `soccerStartingXiCurrent.ts` | Fails as intended: `soccer-starting-xi-current--thibaut-courtois differs from soccer.gk.current[1]`. |
| Mutation check: XI keeper quota 1 → 2 | Fails as intended in the brief and lineup tests. |
| `npx tsx --test --test-reporter=spec src/data/__tests__/sportsCatalog.test.ts` | 12 tests, 2 suites, 12 pass, 0 fail, 0 skipped, about 1.2 s. |
| Same test run from `src/` (snapshot path absent) | 11 pass; the snapshot suite is skipped with "snapshot not found at …". |
| `npm test` (whole project, with the main agent's in-progress work) | 139 tests, 31 suites, 139 pass, 0 fail. |
| `npx tsc --noEmit -p tsconfig.test.json` | Clean. |
| `npx tsc --noEmit` (app) | 4 errors, all in the main agent's in-progress `src/screens/topic/TopicScreen.tsx` and `useTopic.ts` (removed i18n keys). None in `src/data`. |
| `npx eslint` / `npx prettier --check` on the five owned paths | Clean. |

What the 12 tests check:
1. Exactly the 15 briefed ids in order. Per pack: sport/era id shape, budget, slots (ids, counts, accepted positions), pool paths and snapshot sizes, full pools, card count per position, subtitle era, version.
2. Formations exactly: XI $40 for 11 (GK 1, CB 2, FB 2, MID 3, W 2, ST 1); NFL $30 for 7 (QB 1, RB 2, WR 2, TE 1, DEF 1); F1 $30 for 7 (5 drivers, 2 constructors); single modes $20 for 5.
3. Unique pack and card ids across `PACKS` plus these packs (holds before and after registration), card id format, and each player once per pack.
4. Engine rules: `validateRuleSet` (disjoint slots, budget ≥ picks), each card fits exactly one slot, no empty position, supply ≥ 4 seats per slot, no deck shortfall at 2/3/4 seats, and slot ids consistent across the library.
5. Card fields: integer ratings 40–99, text present, the editorial rule, Madden/2K overalls equal ratings, colours, image hosts/paths/credits, `side` null, `sourceIndex` = order. Neutral provenance values, selection text, no web address or product name anywhere, and pack copy naming no card.
6. F1 drivers are field-for-field the live `f1-drivers` cards.
7. Privacy: hidden keys absent from `toPublicCard`, no basis or rating-source term in visible text, rating-number coincidences exactly the 5 known cards.
8. 270 seeded drafts (15 packs × 2/3/4 seats × 6 seeds, all three bots plus random-move humans), with `checkDraftInvariants` and the $1-per-open-spot reserve after every action. At the end: complete, every slot holds exactly its count with fitting positions, unique awards, money + spend = budget, and verdict totals match ratings. Seeds deal different decks.
9. Determinism: the same seed and seats replay identically (45 pairs).
10. Every seat skips whenever allowed (45 tables). Every lineup still fills, discards per slot never exceed its spare cards, a lock means the slot's spare cards are gone, single-slot tables discard exactly two cards, and at least one lineup table reaches the lock.
11. Resume: XI, NFL lineup and F1 team, four bots each. At sampled steps the state survives a JSON round trip through `parseDraftState` and finishes identical to the uninterrupted draft.
12. Snapshot suite (skipped where the git-ignored snapshot is absent): all 24 pool sizes, plus all 1,745 cards field by field (name, subtitle, rating, note, basis, image, colour, position) against the concatenated pools.

Coverage of the 270 random drafts: 22,808 invariant-checked actions, 4,304 sales, 610 forced fills, 132 discards, 247 lineup cards skipped because every seat had already filled that slot, 1,224 skips spent, 202 seats finishing on $0, top price $20. In the skip test, lineup locks engaged at XI current with 2 seats (gk), NFL lineup with 2 seats (qb) and F1 with 4 seats (driver).

Not done by this worker, by instruction: registration, UI, native builds and simulators, network refresh, git.

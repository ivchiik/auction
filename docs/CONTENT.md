# Content catalog — provenance

Status (2026-11-24): **20 packs and 664 cards are registered in `PACKS`, four packs per topic.** They are the five phase-1 packs (148 cards) followed by the fifteen expansion packs (516 cards). All of it is a curated local snapshot for the pitch. It is not a live feed, not the website's full catalog, and not parity with the website's modes. Expansion details: `docs/CONTENT-EXPANSION.md`.

## Source and permission
- Publisher: the source game's website, run by the company this pitch is for. This repository is public and never names it; the exact name and addresses are in the git-ignored `.work/SOURCE-PROVENANCE.md`.
- Data file: the site's public `players.js`. One public file, fetched once on 2026-11-24, parsed as JSON text and never executed. Each entry is published as `[name, team or era line, rating 40-99, note, rating basis, image url, colour, (group, side)]`.
- Permission: the user reports permission to reuse the site's data and images. No source code or API was supplied, and none of the site's implementation was used; the game rules were reimplemented from the published how-to text.
- Snapshot copy: `.work/source-snapshot-2026-11-24/players.js` (git-ignored scratch, 1,319,873 bytes, sha256 `253ead645a16a4c957aec9f114be433c0ea0ee5a7be8f55f2f44d5e39e8763cf`). Both generators read this same captured file; nothing was refetched for the expansion.
- Rebuild. Each card keeps its index in the source pool (`sourceIndex`).
  - Phase 1, into `src/data/packs/`: `npm run content:extract -- .work/source-snapshot-2026-11-24/players.js 2026-11-24` (`scripts/extract-source-packs.mjs`).
  - Expansion, into `src/data/expandedPacks/`: `node scripts/extract-expanded-packs.mjs .work/source-snapshot-2026-11-24/players.js 2026-11-24`.

## Registered library (20 packs; each $20 · five picks · one position)
| Topic | Phase-1 pack | Expansion packs | Packs | Cards |
|---|---|---|---|---|
| Sports | `nfl-quarterbacks` | `nba-point-guards`, `soccer-strikers`, `f1-drivers` | 4 | 115 |
| Movies | `scifi-80s` | `action-all-time`, `comedy-all-time`, `horror-all-time` | 4 | 150 |
| Characters | `looney-tunes` | `dragon-ball`, `naruto`, `nintendo` | 4 | 138 |
| Songs | `pop-80s` | `pop-20s`, `rock-all-time`, `hip-hop-10s` | 4 | 130 |
| Cars | `supercars-80s` | `hypercars-all-time`, `sports-cars-20s`, `off-roaders-all-time` | 4 | 131 |

Total: 5 topics, 20 packs, 664 cards (148 phase 1 + 516 expansion).
- **Order and versions:** `PACKS` lists the phase-1 five first with their ids, versions (`2026-11-24.1`) and order unchanged, so saved drafts, history and daily attempts keep resolving through `getPack`. The expansion follows in topic order (`EXPANDED_PACKS` from `src/data/expandedCatalog.ts`). `src/data/__tests__/catalog.test.ts` pins four packs per topic, these totals, and the phase-1 ids, versions and order.
- **Counts in the app:** the app's counts come from `getCatalogSummary()`, not from copy.
- **Curated, not parity:** most packs are complete website pools. NBA point guards (top 32 of 76), soccer strikers (top 30 of 43) and Nintendo (top 40 of 63) are curated top-N subsets by published rating; at the cutoff, ties go to the earlier entry in source order. The site has no point-guard-only or striker-only mode; it deals those pools inside "Guards & wings" and "Attackers". Each pack's `provenance.selection` and `provenance.siteMode` say exactly this.

## Phase-1 packs (the original five)
| Topic | Pack id | Source pool | Website mode | Selection | Cards | Ratings | Rating basis (as published) | Images |
|---|---|---|---|---|---|---|---|---|
| Sports | `nfl-quarterbacks` | `nfl.qb.current` | NFL › Quarterbacks › Current players | every QB rated 74+ | 31 of 63 | 74–99 | Madden NFL 27 overall rating plus 2025 stat line, e.g. "Madden 27: 99 OVR · 2025: 22 pts/g, 17 gm" | 31, ESPN headshots (`a.espncdn.com`) |
| Movies | `scifi-80s` | `scifi.80s.all` | Movies › Sci-fi › The 80s | complete pool | 30 of 30 | 52–98 | Letterboxd average + Metacritic score, e.g. "Letterboxd 4.40 · Metacritic 82" | 30, IMDb posters (`m.media-amazon.com`) |
| Characters | `looney-tunes` | `cartoons.looney.all` | Characters › Cartoons › Looney Tunes | complete pool | 30 of 30 | 45–99 | Site editorial: "editorial: how loved the character is" | 25, English Wikipedia uploads (`upload.wikimedia.org/wikipedia/en/…`) |
| Songs | `pop-80s` | `pop.80s.all` | Songs › Pop › The 80s | complete pool | 30 of 30 | 40–99 | Lifetime Spotify plays ranked within genre/decade, e.g. "Spotify plays: 3,241,851,628 · ranked within Pop, the 80s" | none published |
| Cars | `supercars-80s` | `super.80s.all` | Cars › Supercars › The 80s | complete pool | 27 of 27 | 40–99 | Power, 0–60 and top speed ranked within class/decade, e.g. "471 hp · 0-60 in 3.8s · 201 mph · ranked within Supercars, the 80s" | none published |

Phase-1 total: 5 packs, 148 cards. Every pack in the library seats four players (20 roster spots) with spares. The tightest is `f1-drivers`, with 22 cards for 20 spots; there the last-cards pass lock keeps every roster fillable, and a test covers it.

## Expansion packs (fifteen)
| Topic | Pack id | Source pool | Website mode | Selection | Cards |
|---|---|---|---|---|---|
| Sports | `nba-point-guards` | `nba.pg.current` | none exact (closest: NBA › Guards & wings › Current players) | curated top 32 | 32 of 76 |
| Sports | `soccer-strikers` | `soccer.st.current` | none exact (closest: Soccer › Attackers › Current players) | curated top 30 | 30 of 43 |
| Sports | `f1-drivers` | `f1.drv.current` | Formula 1 › Drivers › Current grid | complete pool | 22 of 22 |
| Movies | `action-all-time` | `action.best.all` | Movies › Action › All-time | complete pool | 40 of 40 |
| Movies | `comedy-all-time` | `comedy.best.all` | Movies › Comedy › All-time | complete pool | 40 of 40 |
| Movies | `horror-all-time` | `horror.best.all` | Movies › Horror › All-time | complete pool | 40 of 40 |
| Characters | `dragon-ball` | `anime.dbz.all` | Characters › Anime › Dragon Ball Z | complete pool | 35 of 35 |
| Characters | `naruto` | `anime.naruto.all` | Characters › Anime › Naruto | complete pool | 33 of 33 |
| Characters | `nintendo` | `games.nintendo.all` | Characters › Video games › Nintendo | curated top 40 | 40 of 63 |
| Songs | `pop-20s` | `pop.20s.all` | Songs › Pop › The 2020s | complete pool | 30 of 30 |
| Songs | `rock-all-time` | `rock.best.all` | Songs › Rock › All-time | complete pool | 40 of 40 |
| Songs | `hip-hop-10s` | `hiphop.10s.all` | Songs › Hip-Hop/Rap › The 2010s | complete pool | 30 of 30 |
| Cars | `hypercars-all-time` | `hyper.best.all` | Cars › Hypercars › All-time | complete pool | 40 of 40 |
| Cars | `sports-cars-20s` | `sportscar.20s.all` | Cars › Sports cars › The 2020s | complete pool | 24 of 24 |
| Cars | `off-roaders-all-time` | `offroad.best.all` | Cars › Off-roaders › All-time | complete pool | 40 of 40 |

Rating ranges, basis examples, tie details and the validation record are in `docs/CONTENT-EXPANSION.md`.

## What the data claims, and what it does not
- **Exact published data.** Ratings and basis lines are copied exactly as the website publishes them. They are the website's numbers and its description of their basis. This project did not obtain or verify any EA (Madden), 2K, league, championship, Letterboxd, Metacritic, Spotify or manufacturer data. The pack details state the snapshot date and each pack's rating method without naming the source (company requirement).
- **Editorial classification.** `ratingSource` is `editorial` when the published basis starts with "editorial" or "set by hand", i.e. the site's own judgement, which its basis line states. That covers 184 cards:
  - all Looney Tunes, Dragon Ball, Naruto, Nintendo and off-roader cards;
  - three soccer strikers whose basis is "editorial (… min in 2025-26)";
  - three hand-set lines: Cristiano Ronaldo, Valtteri Bottas and Sergio Perez.

  Everything else is `publishedMetric`. No editorial demo values were invented: every pack has real published entries.
- **Hidden until the verdict.** Ratings and basis lines stay hidden until the verdict. `toPublicCard` (an allowlist) is the only card shape screens should render before the reveal. Tests check that it, and the table view built from it, carry no rating, basis or rating source.
- **Notes kept faithfully.** Notes are the site's own flavour text and are kept exactly as published, including contextual sports facts: some soccer notes repeat a goal count and some F1 notes state championship positions. Codex accepted this; the actual ratings and basis lines remain hidden. `toPublicCard` still carries `sourceIndex`. Removing it from the public boundary is assigned to the UI/integration owner and is still pending.
- **Colour field.** The website's colour field is kept as `accentColor`. The phase-1 movie, song and car packs share one default (`#7A1F8E`), and the expansion's movie, song and car pools use a few generic colours each. The UI should prefer topic surfaces for fallback art.

## Images
- **Hosts.** Images are remote URLs exactly as the website links them. Hosts and owners are third parties:
  - ESPN headshots (`a.espncdn.com`);
  - IMDb posters (`m.media-amazon.com`);
  - English Wikipedia uploads (`upload.wikimedia.org/wikipedia/en/…`, usually non-free files with per-file licences);
  - TheSportsDB player cutouts (`r2.thesportsdb.com`, soccer);
  - the PokeAPI sprites repository on GitHub (`raw.githubusercontent.com/PokeAPI/sprites/…`, four Pokémon).

  The catalog test accepts each host only under its expected path.
- **Rights.** The user's permission from the website owner may not cover these files. Confirm image rights before any release; until then treat them as pitch-only.
- **Fallbacks.** Play never depends on images. 355 of 664 cards link an image and 309 have none: all 130 songs, all 131 cars, and 48 characters (5 Looney Tunes, 15 Dragon Ball, 17 Naruto, 11 Nintendo). Designed fallback art (topic surface plus initials or a topic glyph) must render whenever an image is missing, slow or fails, and when offline.
- The data layer bundles no image files; it only carries URLs.

## Daily drafts with four packs per topic
`createDailyPlan` picks each topic's daily pack from that topic's sorted pack ids with the date seed. Registering the expansion therefore changed the computed pack for days not yet started; seeds and opponents are unchanged. For 2026-11-24 the plans are now: sports `nfl-quarterbacks`, movies `action-all-time` (was `scifi-80s`), characters `dragon-ball` (was `looney-tunes`), songs `pop-80s`, cars `hypercars-all-time` (was `supercars-80s`). Started or finished attempts keep their recorded pack (`src/game/daily.ts` resolves `attempt.packId` before the plan), so screens must show and resume an attempted daily from that pack.

## Replacing the snapshot
The catalog boundary is `src/data` (`ContentPack`, `CatalogCard`, `PackProvenance`). An owner export can replace the generated packs as long as it provides id, name, subtitle, note, position, rating, basis and provenance. Bump `pack.version` whenever cards change: saved drafts whose pack version or cards differ are discarded safely instead of resuming with wrong data. In the expansion generator, the per-pack `revision` field controls that suffix.

## Known discrepancies
- The website's daily page says five daily drafts; the homepage help still says three. The app uses five topics (one daily per topic) and does not synchronise with website dailies.
- Two expansion packs have no exact website counterpart: the site mixes point guards with other guards and wings, and strikers with wingers. The packs say so in their provenance.

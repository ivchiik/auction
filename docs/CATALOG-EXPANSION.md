# Broaden the pitch library after the core UI works

The initial five packs prove the engine but skew heavily toward the 1980s. A stronger hiring demonstration should include modern sports, recognizable characters and several genres. This is an additive content phase after the complete native loop passes its first smoke test.

Keep the five existing pack IDs/data versions stable so drafts and history remain readable. Add fifteen packs from the already approved public snapshot; no new data provider or service is needed. Target twenty playable packs across five topics. The following source paths were observed in the JSON snapshot, not guessed:

| Topic | Keep | Add | Source pools and selection |
|---|---|---|---|
| Sports | NFL quarterbacks | NBA point guards, Soccer strikers, Formula 1 drivers | `nba.pg.current` top 32 published ratings of 76; `soccer.st.current` top 30 of 43; `f1.drv.current` all 22 |
| Movies | Sci-fi 80s | Action all-time, Comedy all-time, Horror all-time | `action.best.all`, `comedy.best.all`, `horror.best.all`; complete 40-entry pools |
| Characters | Looney Tunes | Dragon Ball, Naruto, Nintendo | `anime.dbz.all` all 35; `anime.naruto.all` all 33; `games.nintendo.all` top 40 of 63 |
| Songs | Pop 80s | Pop 2020s, Rock all-time, Hip-hop 2010s | `pop.20s.all` all 30; `rock.best.all` all 40; `hiphop.10s.all` all 30 |
| Cars | Supercars 80s | Hypercars all-time, Sports cars 2020s, Off-roaders all-time | `hyper.best.all` all 40; `sportscar.20s.all` all 24; `offroad.best.all` all 40 |

All these individual pools support the current five-pick, $20 format and a four-player table. Exact selected ratings, notes and source basis must be preserved; top-N choices are documented curated selections, not claims of full website parity. Use source order for stable rating ties and unique IDs scoped by pack. Do not mix different pools into a fictitious official mode.

Acceptance:
- Useful scalable pack list with clear titles, rating-method explanation and search/filter only if the actual list needs it; no grid of inert sample cards.
- Real counts derived from the catalog, no hardcoded five-pack copy.
- Every pack completes 2/3/4-seat seeded simulations; no unfillable rosters, duplicate IDs or rating leakage in public card text.
- Existing saved drafts/history still resolve their original pack. A daily already started or completed must keep its recorded pack/opponent even when the library later grows; do not relabel it from a newly computed plan.
- Expanded data retains source provenance and robust artwork fallbacks. No claim of real-time ratings, complete website catalog or exact daily synchronization.
- Re-run source checks and native smoke after the additive content change.

Implementation owner remains Claude Code Opus 5.5 at maximum effort. Codex reviews and tests.

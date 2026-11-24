# Phase 3 independent review

## Typography evidence

Codex decoded the bundled `Fraunces_700Bold.ttf` font table directly: units per em = 2000; hhea ascent 1956, descent -510, line gap 0. Natural typographic line is therefore 1.233× the font size. The old Display 44/48, Numeral 56/62 and Score 96/104 line boxes are smaller than this. OS/2 Windows extents are larger still (2340/609). Android's natural font padding should be retained. Prefer natural metrics or a verified adequate ratio over a single local “Argue now” offset. Check all per-screen overrides and four-digit result scores.

## Review queue

- Mixed-position best/worst grade reference must select a legal roster per slot.
- Full XI results divide by actual 11 picks; old five-pick saved history still works.
- Existing installed Android package and persistence keys should remain stable across the visible Auction rename.
- Set the Expo project slug to `auction`, matching the user's explicit project rename. The native identifiers and storage keys may retain their legacy values. A new Expo Go experience scope is acceptable for these simulator previews; native Android saves must remain intact.
- Public repository must exclude `.work`, personal logs, secrets, generated native folders and build files. No runtime source-company name/URL, including regenerated content.

Status: checks pending implementation.

## Independent content/engine pass

Codex ran an independent throwaway harness against the 15 generated sports packs (1,745 card offerings): 540 completed drafts across 2/3/4 seats and 12 seeds per configuration. Every final roster met each position quota, all money balanced against the pack budget, engine invariants passed, and result averages equalled totals divided by actual picks. This pass precedes the grade-reference fix and does not replace UI/native checks.

## Design delivery

Brilliant core canvas renamed to `design/canvas/Auction.bl`, sport/mode designs added in `Sports.bl`, wordmark/icon monogram changed to Auction/a., and average ratings added to the result reference. Updated icons are already in `assets/`. Exports visually inspected; final composition returned ready with no overflow warnings. See `design/HANDOFF.md`.

### Sports presentation review

Prioritize the full lineup as the first mode (especially Starting XI) so the user's requested feature is visible immediately. Use the new `design/exports/soccer.png` reference: a forest lineup card with budget/formation, followed by compact single-position choices. Rating-method detail remains reachable via About. The old large generic pack cards need not be repeated unchanged on this new mode screen. Preserve accessibility and keep other topic choosers stable.

## Content handoff decisions

- Content worker finished 15 packs / 1,745 offerings and 12 targeted tests; registered library totals will be 35 packs / 2,409 offerings. Source fields and the existing 20 pack identities remain unchanged.
- Retain source flavor notes about goals, assists and F1 standings: these are public context, not the hidden normalized rating or private rating-basis field. This follows the existing driver/striker treatment. No new privacy exception for actual score text.
- Keep the existing internal rating-source classification for mixed winger metrics; the pack's visible method explicitly says half editorial. It does not claim a purely statistical score.
- Keep the existing shorter mobile deck rule (required slots plus 50% spare cards). Formation, budget and position eligibility match the verified modes; deck length is a documented mobile adaptation, not full website parity.
- Integration tests need the www.thesportsdb.com image-host variant; roster-size expectations must use pack rules; privacy checks should distinguish exact known career-year/team-name numeric coincidences from actual ratings. The five affected card IDs are documented in SPORTS-CATALOG.md. Do not weaken the check for arbitrary numbers in notes.

## Result rendering review

`ResultSeatTiles` and `RatedRoster` currently key rows by name/rank/total. Two same-name players with a tied score produce duplicate React keys. Use stable original seat order as identity (carry the original index through sorting for the tiles). A four-player result should not lose or reuse a row because names and scores happen to match. Also visually check the longer total-plus-average roster header on small/scaled screens.

## Resolution (Claude Code follow-up, 2026-11-24)

Each item above, as resolved after Codex's session ended. Device results are in `docs/QA.md` ("Phase 3").

- **Typography:** `src/theme/fontMetrics.ts` derives every Fraunces line height from the hhea metrics (1.233 em plus 1 pt), and `fontMetrics.test.ts` checks them against the bundled TTFs. Android natural font padding is untouched. "Argue now." keeps its descender on the 360 dp emulator; four-digit lineup totals fit the result tiles.
- **Grade reference:** best and worst reference rosters are legal per-slot lineups from the cards the table saw (`computeReferenceHauls`); identical to before for single-slot packs. Covered by `lineup.test.ts`.
- **Averages:** derived from actual picks, so an XI divides by 11 and old five-pick records still work; covered by the results and share-text tests.
- **Save continuity and slug:** the Expo slug is `auction`; `com.paddle.pitch` and the `paddle.*.v1` keys stay and are allow-listed by the neutrality guard. Saved history from before the rename still opens.
- **Public repository:** `.work/`, `.brilliant/`, native folders, `artifacts/builds/`, logs and env files are ignored. A scan of every file to be committed found no credentials, personal paths or e-mail addresses. At the user's request, no repository file names the source either: docs and generators say "the source site", the detection patterns are base64-encoded in `scripts/sourcePatterns.mjs`, and `npm run check:neutral` now scans every file.
- **Card privacy:** the original strict number rule is restored, plus an exact pinned list of the five documented career-year and team-name coincidences, which must keep matching.
- **Sports presentation:** built to `design/exports/sports.png` and `soccer.png`: sport cards with their own glyphs, then lineups first as forest cards with budget and formation, compact single-position rows, "More modes" and the current / all-time switch. "About this pack" stays reachable from every mode through a separate info button. Other topic choosers are unchanged.
- **Result keys:** `ResultSeatTiles` and `RatedRoster` key rows by original seat index.
- **Roster header on small screens:** "884 pts · avg 80.4" and the tiles fit on the 360 dp emulator and the iPhone SE.

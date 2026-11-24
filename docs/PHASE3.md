# Auction refinement

User requested typography clipping fixes, average points, sports subcategories and the full soccer XI. The final approved product name is **Auction**, and the upload destination is **public `ivchiik/auction`**. The source website name must not appear anywhere in the app.

## Acceptance

- Audit Fraunces text metrics across Android and iOS; “Argue now.” and other descenders remain fully visible, including short phones and scaled text.
- Reveal and saved results show each roster's average rating to one decimal place. Ratings remain hidden before reveal.
- Sports has a sport choice followed by meaningful mode choices. Soccer supports attackers, midfielders, defenders (including keepers), and Starting XI, in current and all-time pools.
- Starting XI costs $40 and requires GK ×1, FB ×2, CB ×2, MD ×3, W ×2, ST ×1. Other soccer modes use $20 and five picks. Position eligibility, remaining slots, reserve cash, bots, skips and saved drafts work for 2–4 seats.
- Extend the available NFL, NBA and F1 choices where the existing disjoint-slot engine can faithfully support them. Do not claim complete website parity or invent flexible-position rules.
- Rename visible branding, app metadata, share text and current documentation to Auction. Preserve existing local saved games where practical. Runtime content must contain no source-site name or links.
- Native Android and iOS Expo Go verification, meaningful engine regressions, type/lint/format gates, fresh Android artifact, then reviewed public GitHub upload.

## Implementation ownership

Codex owns requirements, independent review, native verification, Brilliant edits and publication. Claude Code Opus 5.5 at maximum effort implements all application code. A separate content worker owns only `src/data/sportsPacks/`, `src/data/sportsCatalog.ts`, `src/data/__tests__/sportsCatalog.test.ts`, `scripts/extract-sports-packs.mjs` and `docs/SPORTS-CATALOG.md`. The main agent owns integration and all other application files.

## Source verification

Rules checked on the source site's how-to-play page on 2026-11-24 (exact address in the git-ignored `.work/SOURCE-PROVENANCE.md`; this public repository never names the source). Public `players.js` snapshot is saved locally under ignored `.work/`. The source text is parsed as JSON, never executed. No source branding is shipped in app strings or runtime pack provenance.

## Status

Implemented and verified on 2026-11-24. Codex reached its usage limit while the main implementation worker was finishing and Codex had just started native review; the worker then stopped on a network error. Claude Code (Opus 5.5, maximum effort) completed the remaining work in a follow-up session: the Sports chooser and mode screen built to the Brilliant references, two layout fixes found on device, documentation, native verification, the Android 0.2.0 preview and the publication review. Results are in `docs/QA.md` under "Phase 3". The standalone iOS build is still limited by Xcode 26.2 (SDK 58 requires 26.4+); Expo Go works on both iPhone simulators.

## What shipped

- **Clipping:** Fraunces line heights come from the font's own metrics (a 1.233 em line box plus 1 pt for Android pixel rounding) in every display variant and screen override, with a test that reads the bundled TTFs. "Argue now." and every other display line keep their descenders on a 360 dp Android phone and the 375 × 667 iPhone SE. Two related glitches found on device were fixed: lineup formations now wrap only between slots ("W ×2 ·" / "ST ×1"), and screens without a header (Home, Daily, Collection, the revealed verdict) no longer scroll text under the status bar.
- **Averages:** each roster's average rating to one decimal, derived from its picks, on the verdict tiles, the rated-roster headers, Collection, saved results, share text and spoken labels. Records saved before this change get averages too. Nothing shows before the reveal.
- **Sports:** Sports → sport → mode. The whole-team lineup leads as a forest card: Starting XI $40 for 11 (GK ×1, CB ×2, FB ×2, MID ×3, W ×2, ST ×1), NFL full lineup and Formula 1 fantasy team $30 for 7. Single-position modes follow as compact rows ($20 for five), narrower original packs sit under "More modes", soccer switches between current players and all-time greats, and every mode keeps its "About this pack" sheet. 15 new packs: 35 packs and 2,409 cards in all.
- **Lineup rules in the UI:** setup shows budget, picks and allocation; the auction shows the card's position, open spots per position and "No GK spot" for seats sitting a card out; the roster sheet and verdict group picks by position. Grades compare against the best and worst legal lineup the shown cards allowed. Dailies stay on quick $20 / five-pick packs.
- **Auction rename and neutrality:** Auction in every visible string, app metadata, share text and current docs. The settings links to the source site are gone, runtime pack provenance is publisher-neutral, and `npm run check:neutral` fails the gate if the source's name or address appears in any repository file, or the retired working name in app copy. Docs and scripts say "the source site"; exact provenance is kept in the git-ignored `.work/SOURCE-PROVENANCE.md`. The native identifier `com.paddle.pitch` and the `paddle.*.v1` storage keys stay, so installed previews keep their saves; players never see them.

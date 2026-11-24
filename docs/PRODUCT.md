# Auction — mobile pitch brief

Status: playable pitch built and independently tested. The user approved the name Auction on 2026-11-24 (it replaced the working name Paddle). Android standalone preview is available; iOS standalone compilation requires Xcode 26.4+, with iPhone gameplay verified through Expo Go.
Research date: 2026-11-24. Product source: the source game's public website (exact address in the git-ignored `.work/SOURCE-PROVENANCE.md`).

## Intent
Make a ten-minute social auction feel excellent on a phone: pick a topic, fill a table with friends or bots, spend a shared-size play budget, reveal who drafted best and immediately play again. The hiring pitch must demonstrate a complete playable experience with careful visual craft, not a gallery of mock screens.

## Confirmed decisions
- English first, iOS and Android, Expo/React Native.
- Same-device play and computer opponents; online multiplayer is a later separately scoped release.
- Permission to reuse data and images is granted, but no source code or API was supplied.
- No real-money transactions. The currency is game credit, consistent with the source game's About page.
- Codex plans/designs/reviews/tests. Claude Code Opus 5.5 at max effort implements app code.

## Core rules observed in published how-to
- 2–4 seats. Single-position drafts: $20 and five picks. Mixed position modes can use $30/$40 and differing slot rules.
- Shuffle deck; rotate opening seat; opening bids $1, $2 or $3; later bid raises $1, $2 or $3; a pass eliminates that seat for that card.
- Highest remaining bidder receives the card. If everyone can legally pass before an opening bid, discard the card.
- Two opening skips per seat. Passing before any bid consumes a skip; passing after a bid is free.
- Maximum bid reserves $1 for every other empty roster slot.
- Filled rosters stop participating. Last eligible player must fill remaining spots at $1. Passing also locks when remaining cards for a position equal remaining slots.
- Ratings stay hidden until a deliberate verdict reveal. Show side-by-side rosters first. Reveal score, winner/tie, grade, best value and overpay with clear basis.
- Bots have three personalities: fair value, star-chasing and unpredictable. They must obey exactly the same bidding rules.
- Daily drafts share a date-seeded deck/opponent, one attempt per topic and local streak/stat storage. Published daily page says FIVE dailies; homepage help still says THREE. Use five topics, document the source discrepancy.
- Tournament supported for full roster modes. Call Out is a separate bluffing party game. Keep both in roadmap until core draft is solid; do not expose inert buttons claiming implementation.

## First playable pitch acceptance
1. Home with strong working brand, quick play, five topic entry points (Sports, Movies, Characters, Songs, Cars), daily challenge and local history.
2. Topic/mode chooser with genuinely available curated packs. Avoid pretending a tiny content sample is the full website catalog.
3. Setup: 2–4 named players, each human or one of three bots; at least one human; optional ten-second shot clock; useful rules entry.
4. Full auction: current card, turn owner, money, roster slots, skips, correct bid affordances, pass reason, roster sheet, quit confirmation and state resume.
5. Pre-verdict rosters, then animated rating reveal, score/tie, best buy/overpay, replay and native share.
6. Daily challenge with stable seed, local attempt accounting, restoration and honest local-only stats. Do not claim synchronization with website without the owner's exact seed/data contract.
7. Learn/settings/about: concise rules, reduced-motion-aware effects, haptic toggle, original product attribution, play-money explanation and local data behavior.
8. All main buttons work; no fake online player counts, reviews, monetization or analytics claims.

## Content strategy
Inspect publicly delivered data structure and asset sources. Preserve provenance. Build a clean local catalog boundary to replace with owner's exports. Use licensed/approved source image URLs where obtainable and robust local visual fallbacks. No fabricated official ratings: if a sample editorial pack is needed, label it clearly in About/pack detail and every rating basis. Images must not be necessary for offline play.

## Quality targets
- New player starts a game in three primary steps: topic, setup, play.
- Every valid draft completes with full rosters and no negative balances across randomized engine simulations.
- No visible ratings before reveal, including accessibility labels.
- No layout overflow on 360dp Android and small iPhone; controls clear of home indicator/navigation bar.
- Resume survives restart; stale or corrupt saves fail safely. Timer acts once and does not keep bidding while backgrounded.
- Typecheck/lint/tests pass; smoke tests on both platforms recorded with screenshots.

## Release dependencies
App store publication, final brand, content refresh pipeline, official support/privacy details, developer accounts/signing, real production data parity and company sign-off remain release steps. Build the local pitch without inventing these.

## Sources
The source site's How to play, About, Daily, Ratings and Call Out pages, read on 2026-11-24. This repository is public and never names the source; the exact addresses are in the git-ignored `.work/SOURCE-PROVENANCE.md`.

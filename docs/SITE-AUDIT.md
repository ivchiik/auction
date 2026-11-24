# Website discovery — 2026-11-24

## Public pages inspected
Home, How to play, About, Daily drafts, Ratings, Call Out, Contact and Privacy. Sources: the source site's home page and its /how-to-play/, /about/, /daily/, /ratings/, /call-out/, /contact/ and /privacy/ routes. This repository is public and never names the source; the exact addresses are in the git-ignored `.work/SOURCE-PROVENANCE.md`.

The site describes an independent, locally executed pass-and-play game. No account or server game state is required for the existing core. The public privacy page explicitly says ordinary drafts are held in memory and lost on reload; daily outcomes/streaks remain in localStorage. This makes native autosave/resume a useful improvement. The mobile demo will keep data locally and will not copy website advertising scripts.

The rating reference currently lists 5,497 entries across five topic groups. The publicly delivered `players.js` contains structured pool data; Claude is extracting compact approved packs with provenance. The mobile demo must explain its curated catalog and must not claim full parity or a live data feed.

Ratings are 40–99, with real source numbers where suitable and explicitly editorial standards elsewhere. These are snapshots, not continuously refreshed data. Preserve basis text. Website media comes from third parties and has fallbacks; native play must not depend on remote images loading.

The contact form sends user-provided text to the owner via Netlify. It was inspected but not submitted. No messages were sent to the company.

## Rules and discrepancies
Detailed rules are recorded in PRODUCT.md. Dedicated daily page and topic inventory support FIVE daily challenges; homepage help contains older THREE-challenge wording. Use five and keep mobile daily seeds explicitly separate until the owner supplies its exact source/contract.

Call Out page uses loose wording about money at stake, while About explicitly states all dollars are play money and nothing can be purchased or won. Native copy will consistently say play money. No transaction flow is planned.

Additional live Call Out inspection: two modes (Classic timed, Better Than without a clock), 2–6 players, 3/5/7/10 rounds or last one standing, and 30/45/60/90/120-second clock options. Its help describes claims that increase both count and stake, a manual honor-system answer counter, and majority voting in Better Than (ties favor the challenged name). This is a separate state machine from the auction draft and is deliberately outside the first native pitch. Setup and help controls were exercised; a full Call Out game was not played.

## Interaction evidence
Desktop Chrome's accessibility tree exposed the full topic menu, but native clicks/keyboard did not visibly change its state in this session. That is an automation limitation, not a confirmed website defect. Simulator Safari was then tested successfully using the installed native-testing CLI.

Observed live on iPhone 17 Pro / iOS 26.2: topic selection, sports list, soccer attacker setup, player count options, computer-personality picker, auction start, a $1 opening bid awarded to Player 1 (balance $20 -> $19), the rotating opening seat, The Accountant opening at $1, passing on its bid (both opening skips retained), and the roster drawer showing purchased names/prices while ratings remain hidden. The $19/4-slot budget correctly displayed a $16 cap. Opening controls offer $1, $2 and $3, not only $1.

Completed this full game. One opening pass consumed a skip. Once the bot filled its roster, the final human picks required the $1 TAKE HIM action with no skipping. Both rosters reached five picks. The pre-verdict screen still hid ratings; explicit REVEAL THE VERDICT exposed scores and grades: Player 1 scored 404 (80.8 average), The Accountant 432 (86.4 average), a 28-point win. Spending was $5 and $7 respectively. Ousmane Dembele at $1 was the steal. Screenshot is in ignored local evidence `.work/site-verdict.png`. Tournament, Call Out and every category variant have not received interactive coverage.

Mobile layout observations: setup requires substantial scrolling; floating Netlify/help controls occupy space near bid/pass actions. Native design keeps essential bidding controls in a dedicated safe-area dock. The website's roster overlay also leaves underlying controls present in the accessibility tree; native sheets should hide background controls from accessibility while open.

## Product opportunities
- Persistent draft recovery and local collection/history.
- Clear active-player banner and one-handed bid controls.
- A concise three-step first-run explanation and contextual constraints.
- Deliberate reveal choreography, honest source notes and shareable result text.
- Offline core play, image fallback and reduced-motion support.
- Native typography, safe-area layouts, keyboard handling and accessibility labels.

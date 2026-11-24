# Auction preview

A playable mobile auction game, version 0.2.0. The name comes from the auction table the game is built around.

## Try it

- **Android ARM64 APK:** a standalone preview with bundled JavaScript, no Metro needed, signed with the local debug certificate (not a store release). It is built locally as `artifacts/builds/auction-0.2.0-android-arm64.apk`; that folder is git-ignored, so build your own with [BUILD.md](../docs/BUILD.md).
- [Build and install instructions](../docs/BUILD.md), including iPhone Expo Go setup and the Xcode 26.4+ requirement for iOS standalone builds.
- [Two-minute demo walkthrough](../docs/DEMO.md).
- [Verification record](../docs/QA.md).

## App screenshots

Native screenshots of version 0.2.0 from testing on 2026-11-24, taken during games actually played. iPhone captures use Expo Go SDK 58 on an iPhone 17 Pro and an iPhone SE (3rd generation, 375 × 667). Android captures use a 360 dp emulator: the standalone APK where marked, otherwise Expo Go running the same JavaScript. Long pages scroll; the bidding dock and navigation stay reachable.

| Screen            | iPhone                                                                          | Android (360 dp)                                                      |
| ----------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Play              | [Home](screenshots/ios-home.png)                                                | [Home, standalone APK](screenshots/android-home.png)                  |
| Sports            | [Pick a sport](screenshots/ios-sports.png)                                      | —                                                                     |
| Soccer modes      | [Starting XI first](screenshots/ios-soccer-starting-xi.png)                     | [Starting XI first, standalone APK](screenshots/android-soccer.png)   |
| Setup             | —                                                                               | [Starting XI, three seats](screenshots/android-setup.png)             |
| Auction           | [NFL full lineup, four seats, SE](screenshots/iphone-se-auction-nfl-lineup.png) | —                                                                     |
| Before the reveal | ["Argue now.", SE](screenshots/iphone-se-argue-now.png)                         | ["Argue now." after a full XI](screenshots/android-argue-now.png)     |
| Verdict           | [Scores and averages, SE](screenshots/iphone-se-verdict.png)                    | [Scores and averages](screenshots/android-verdict.png)                |
| Collection        | —                                                                               | [0.1.0 saves kept after updating](screenshots/android-collection.png) |

## Editable design

Open `design/canvas` in Brilliant. [Auction.bl](../design/canvas/Auction.bl) holds the five core screens, [Sports.bl](../design/canvas/Sports.bl) the sport and soccer-mode screens, and [Brand.bl](../design/canvas/Brand.bl) the app icon and adaptive artwork. The [design handoff](../design/HANDOFF.md) documents the visual direction. Design compositions are references; the screenshots above show the implementation.

## Included scope

35 curated packs with 2,409 cards across five topics. Sports offers a sport, then modes: the soccer Starting XI ($40 for 11) in current and all-time pools, the NFL full lineup and the Formula 1 fantasy team ($30 for 7), and single-position modes ($20 for five). Also included: 2–4 same-device players, three computer personalities, an optional ten-second clock, hidden ratings with a deliberate reveal and one-decimal averages, offline play, resume, local daily challenges and streaks, Collection, settings, native share, and an original design and icon.

Application code was implemented by Claude Code Opus 5.5 at maximum effort. Codex led research, specifications, Brilliant design, review and independent testing; Claude Code completed the phase 3 verification and publication review after Codex reached its usage limit.

Not included: online multiplayer, account or data synchronization with the original game, full catalog and mode parity, store publication or company signing. The iOS standalone build needs a newer Xcode than this Mac has, so iPhone gameplay was tested through Expo Go.

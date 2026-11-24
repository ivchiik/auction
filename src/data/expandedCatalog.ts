// Fifteen more packs generated from the same public snapshot as the original five by
// scripts/extract-expanded-packs.mjs (provenance: docs/CONTENT-EXPANSION.md). Registered in PACKS
// (catalog.ts) after the five original packs, whose ids, versions and order stay fixed.
import { ACTION_ALL_TIME } from "./expandedPacks/actionAllTime";
import { COMEDY_ALL_TIME } from "./expandedPacks/comedyAllTime";
import { DRAGON_BALL } from "./expandedPacks/dragonBall";
import { F1_DRIVERS } from "./expandedPacks/f1Drivers";
import { HIP_HOP_10S } from "./expandedPacks/hipHop10s";
import { HORROR_ALL_TIME } from "./expandedPacks/horrorAllTime";
import { HYPERCARS_ALL_TIME } from "./expandedPacks/hypercarsAllTime";
import { NARUTO } from "./expandedPacks/naruto";
import { NBA_POINT_GUARDS } from "./expandedPacks/nbaPointGuards";
import { NINTENDO } from "./expandedPacks/nintendo";
import { OFF_ROADERS_ALL_TIME } from "./expandedPacks/offRoadersAllTime";
import { POP_20S } from "./expandedPacks/pop20s";
import { ROCK_ALL_TIME } from "./expandedPacks/rockAllTime";
import { SOCCER_STRIKERS } from "./expandedPacks/soccerStrikers";
import { SPORTS_CARS_20S } from "./expandedPacks/sportsCars20s";
import type { ContentPack } from "./types";

/** In topic order (sports, movies, characters, songs, cars), three packs per topic. */
export const EXPANDED_PACKS: readonly ContentPack[] = [
  NBA_POINT_GUARDS,
  SOCCER_STRIKERS,
  F1_DRIVERS,
  ACTION_ALL_TIME,
  COMEDY_ALL_TIME,
  HORROR_ALL_TIME,
  DRAGON_BALL,
  NARUTO,
  NINTENDO,
  POP_20S,
  ROCK_ALL_TIME,
  HIP_HOP_10S,
  HYPERCARS_ALL_TIME,
  SPORTS_CARS_20S,
  OFF_ROADERS_ALL_TIME,
];

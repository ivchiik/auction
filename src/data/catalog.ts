import { createSinglePositionRules, type EngineCard, type RuleSet } from "engine";

import { EXPANDED_PACKS } from "./expandedCatalog";
import { LOONEY_TUNES } from "./packs/looneyTunes";
import { NFL_QUARTERBACKS } from "./packs/nflQuarterbacks";
import { POP_80S } from "./packs/pop80s";
import { SCIFI_80S } from "./packs/scifi80s";
import { SUPERCARS_80S } from "./packs/supercars80s";
import { SPORTS_PACKS } from "./sportsCatalog";
import { TopicId, type CatalogCard, type ContentPack, type PublicCard } from "./types";

/** Date of the local content snapshot. Nothing in the app is a live feed. */
export const CATALOG_SNAPSHOT_DATE = "2026-11-24";

/**
 * Every playable pack: the five phase-1 packs first, then the fifteen expansion packs (ids,
 * versions and order of all twenty stay fixed so saved drafts, history and daily attempts keep
 * resolving), then the fifteen sports modes with lineups and all-time pools. A curated local
 * selection from one snapshot, not a full catalog of the source.
 */
export const PACKS: readonly ContentPack[] = [
  NFL_QUARTERBACKS,
  SCIFI_80S,
  LOONEY_TUNES,
  POP_80S,
  SUPERCARS_80S,
  ...EXPANDED_PACKS,
  ...SPORTS_PACKS,
];

/** Home order of topics; labels and blurbs live in i18n under `topics.<id>`. */
export const TOPIC_ORDER: readonly TopicId[] = [
  TopicId.Sports,
  TopicId.Movies,
  TopicId.Characters,
  TopicId.Songs,
  TopicId.Cars,
];

const PACKS_BY_ID = new Map(PACKS.map((pack) => [pack.id, pack]));

export const getPack = (packId: string): ContentPack | null => PACKS_BY_ID.get(packId) ?? null;

export const getPacksForTopic = (topic: TopicId): ContentPack[] =>
  PACKS.filter((pack) => pack.topic === topic);

export const getCatalogCard = (pack: ContentPack, cardId: string): CatalogCard | null =>
  pack.cards.find((card) => card.id === cardId) ?? null;

/** Game rules for a pack: shared constants plus the pack's own budget and roster slots. */
export const rulesForPack = (pack: ContentPack): RuleSet => ({
  ...createSinglePositionRules([]),
  budget: pack.budget,
  slots: pack.slots,
});

/** The engine only needs identity, position and the hidden rating. */
export const toEngineCards = (pack: ContentPack): EngineCard[] =>
  pack.cards.map((card) => ({ id: card.id, position: card.position, rating: card.rating }));

/**
 * Everything safe to show before the verdict. Built from an allowlist so a new hidden field can
 * never leak by accident. `sourceIndex` stays out too: some source pools are in rating order.
 */
export const toPublicCard = (card: CatalogCard): PublicCard => ({
  id: card.id,
  name: card.name,
  subtitle: card.subtitle,
  note: card.note,
  position: card.position,
  accentColor: card.accentColor,
  image: card.image,
  side: card.side,
});

export const getCatalogSummary = () => ({
  topics: TOPIC_ORDER.filter((topic) => getPacksForTopic(topic).length > 0).length,
  packs: PACKS.length,
  cards: PACKS.reduce((total, pack) => total + pack.cards.length, 0),
  snapshotDate: CATALOG_SNAPSHOT_DATE,
});

// Content catalog boundary. Everything the app knows about topics, packs and cards comes through
// these types, so an owner-supplied export can replace the local snapshot without touching the
// engine or the UI.
import type { SlotRule } from "engine";

export enum TopicId {
  Sports = "sports",
  Movies = "movies",
  Characters = "characters",
  Songs = "songs",
  Cars = "cars",
}

export enum RatingSource {
  /** Derived from a published number (game rating, critic/audience score, plays, specs). */
  PublishedMetric = "publishedMetric",
  /** The source site's own editorial judgement; its basis line says so. */
  Editorial = "editorial",
}

export interface CardImage {
  uri: string;
  host: string;
  /** Who hosts the file, as linked by the source site. Rights are not implied. */
  credit: string;
}

export interface CatalogCard {
  id: string;
  name: string;
  /** Team, release line or maker, shown during the auction. */
  subtitle: string;
  /** Short flavour line, shown during the auction (never the number). */
  note: string;
  position: string;
  /** Hidden until the verdict. */
  rating: number;
  /** Exact published basis line. Hidden until the verdict because it can reveal the rating. */
  ratingBasis: string;
  ratingSource: RatingSource;
  /** Colour published with the entry (team colour etc.), if any. */
  accentColor: string | null;
  /** Remote artwork; play never depends on it loading. */
  image: CardImage | null;
  /** Hero/villain tag published for some character entries. */
  side: "hero" | "villain" | null;
  /** Index of the entry in the source pool, for provenance. */
  sourceIndex: number;
}

export interface PackProvenance {
  publisher: string;
  siteUrl: string;
  dataUrl: string;
  /** Path of the pool inside the published data, e.g. "nfl.qb.current". */
  poolPath: string;
  /** The website mode this pack corresponds to. */
  siteMode: string;
  snapshotDate: string;
  /** How cards were chosen from the pool. */
  selection: string;
  sourceEntryCount: number;
  /** How the source says ratings are built for this pool. */
  ratingMethod: string;
  permission: string;
}

export interface ContentPack {
  id: string;
  /** Bump when cards change so saved drafts from older content are discarded safely. */
  version: string;
  topic: TopicId;
  title: string;
  subtitle: string;
  /** Plural noun for the cards, e.g. "quarterbacks". */
  noun: string;
  /** One-line rating basis for pack lists, e.g. "Madden NFL 27 overall ratings". */
  ratingLabel: string;
  budget: number;
  slots: SlotRule[];
  cards: CatalogCard[];
  provenance: PackProvenance;
}

/**
 * What may be shown before the verdict: no rating, no basis, and no source index (several
 * source pools are ordered by rating, so the index would hint at it).
 */
export type PublicCard = Omit<
  CatalogCard,
  "rating" | "ratingBasis" | "ratingSource" | "sourceIndex"
>;

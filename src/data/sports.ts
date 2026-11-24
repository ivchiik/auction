import { getPack, PACKS } from "./catalog";
import { TopicId, type ContentPack } from "./types";

/** Sports inside the Sports topic; names and blurbs live in i18n under `sports.<id>`. */
export enum SportId {
  Soccer = "soccer",
  NFL = "nfl",
  NBA = "nba",
  F1 = "f1",
}

export const SPORT_ORDER: readonly SportId[] = [
  SportId.Soccer,
  SportId.NFL,
  SportId.NBA,
  SportId.F1,
];

/** Which players a mode draws from: today's or the greats of every era. */
export enum SportEra {
  Current = "current",
  AllTime = "alltime",
}

export const ERA_ORDER: readonly SportEra[] = [SportEra.Current, SportEra.AllTime];

const ERA_SUFFIX: Record<SportEra, string> = {
  [SportEra.Current]: "-current",
  [SportEra.AllTime]: "-alltime",
};

/** Sport of a Sports pack from its id prefix ("soccer-", "nfl-", "nba-", "f1-"), else null. */
export const sportOfPack = (pack: ContentPack): SportId | null =>
  pack.topic === TopicId.Sports
    ? (SPORT_ORDER.find((sport) => pack.id.startsWith(`${sport}-`)) ?? null)
    : null;

/** Sport of a shipped pack by id (saved drafts and history); null for other topics or old ids. */
export const sportOfPackId = (packId: string): SportId | null => {
  const pack = getPack(packId);
  return pack ? sportOfPack(pack) : null;
};

/** "-alltime" packs are all-time; every other pack, the first single-position ones included, is current. */
export const eraOfPack = (pack: ContentPack): SportEra =>
  pack.id.endsWith(ERA_SUFFIX[SportEra.AllTime]) ? SportEra.AllTime : SportEra.Current;

/** "soccer-starting-xi-alltime" -> "starting-xi"; "nba-point-guards" -> "point-guards". */
const modeKeyOf = (pack: ContentPack, sport: SportId): string => {
  const withoutSport = pack.id.slice(sport.length + 1);
  const suffix = ERA_SUFFIX[eraOfPack(pack)];
  return withoutSport.endsWith(suffix) ? withoutSport.slice(0, -suffix.length) : withoutSport;
};

export const rosterSizeOf = (pack: ContentPack): number =>
  pack.slots.reduce((total, slot) => total + slot.count, 0);

/** A lineup has a separate spot count per position group; most packs have one slot. */
export const isLineupPack = (pack: ContentPack): boolean => pack.slots.length > 1;

const positionsOf = (pack: ContentPack): Set<string> =>
  new Set(pack.slots.flatMap((slot) => slot.accepts));

/**
 * A single-slot pack is an extra mode when another single-slot pack of the same sport and era
 * accepts all of its positions and more: Strikers sits inside Attackers, Point guards inside
 * Guards & wings. Lineups never demote a mode, so Quarterbacks and Drivers stay main choices.
 */
const isCoveredBy = (narrow: ContentPack, broad: ContentPack): boolean => {
  if (narrow === broad || isLineupPack(narrow) || isLineupPack(broad)) return false;
  const narrowPositions = positionsOf(narrow);
  const broadPositions = positionsOf(broad);
  return (
    broadPositions.size > narrowPositions.size &&
    [...narrowPositions].every((position) => broadPositions.has(position))
  );
};

export interface SportMode {
  /** Pack id without sport prefix and era suffix, e.g. "starting-xi". */
  key: string;
  /** The mode's pack in each era it exists in. */
  packs: Partial<Record<SportEra, ContentPack>>;
  /** Narrower than another mode; listed after the main choices instead of crowding them. */
  isExtra: boolean;
}

export interface SportCatalog {
  sport: SportId;
  /** Eras with at least one pack, current first. */
  eras: SportEra[];
  /** Main modes in catalog order, then the extras. */
  modes: SportMode[];
}

/** Groups one sport's packs into modes with their current and all-time variants. */
export const buildSportCatalog = (
  sport: SportId,
  packs: readonly ContentPack[] = PACKS
): SportCatalog => {
  const sportPacks = packs.filter((pack) => sportOfPack(pack) === sport);
  const modes = new Map<string, SportMode>();
  for (const pack of sportPacks) {
    const key = modeKeyOf(pack, sport);
    const mode = modes.get(key) ?? { key, packs: {}, isExtra: false };
    mode.packs[eraOfPack(pack)] = pack;
    modes.set(key, mode);
  }
  for (const mode of modes.values()) {
    mode.isExtra = Object.values(mode.packs).every((pack) =>
      sportPacks.some((other) => eraOfPack(other) === eraOfPack(pack) && isCoveredBy(pack, other))
    );
  }
  const ordered = [...modes.values()];
  return {
    sport,
    eras: ERA_ORDER.filter((era) => sportPacks.some((pack) => eraOfPack(pack) === era)),
    modes: [...ordered.filter((mode) => !mode.isExtra), ...ordered.filter((mode) => mode.isExtra)],
  };
};

const CATALOGS = new Map<SportId, SportCatalog>();

/** The shipped catalog's modes for one sport (computed once). */
export const getSportCatalog = (sport: SportId): SportCatalog => {
  const cached = CATALOGS.get(sport);
  if (cached) return cached;
  const built = buildSportCatalog(sport);
  CATALOGS.set(sport, built);
  return built;
};

export const isSportId = (value: string): value is SportId =>
  (SPORT_ORDER as readonly string[]).includes(value);

/**
 * Daily tables stay short: only "quick" packs, the classic $20 budget for five picks, can be a
 * daily. Lineups such as the $40 Starting XI are for quick play only.
 */
export const isQuickPack = (pack: ContentPack): boolean =>
  pack.budget === 20 && rosterSizeOf(pack) === 5;

import type { HistoryPick } from "./types";

/**
 * A revealed roster's average rating, derived from its picks rather than stored, so results saved
 * before averages were shown still get one. Zero for an empty roster (never a finished draft).
 * Only revealed records carry ratings, so nothing calls this before the reveal.
 */
export const averageRatingOf = (picks: readonly Pick<HistoryPick, "rating">[]): number =>
  picks.length > 0 ? picks.reduce((total, pick) => total + pick.rating, 0) / picks.length : 0;

/** One decimal place, as the reveal and the share text show averages ("86.4"). */
export const formatAverage = (value: number): string => value.toFixed(1);

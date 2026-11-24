import { findSlotForPosition, getSlot } from "./rules";
import { getCard } from "./selectors";
import { LotOutcomeKind, type DraftState, type SeatIndex } from "./types";

export enum Grade {
  APlus = "A+",
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  F = "F",
}

/** Minimum share of the best possible haul for each grade, best first. */
export const GRADE_THRESHOLDS: readonly { grade: Grade; minShare: number }[] = [
  { grade: Grade.APlus, minShare: 0.9 },
  { grade: Grade.A, minShare: 0.75 },
  { grade: Grade.B, minShare: 0.6 },
  { grade: Grade.C, minShare: 0.45 },
  { grade: Grade.D, minShare: 0.3 },
  { grade: Grade.F, minShare: 0 },
];

export interface SeatResult {
  seat: SeatIndex;
  totalRating: number;
  averageRating: number;
  picks: number;
  spent: number;
  moneyLeft: number;
  /** Competition rank: tied seats share a rank and the next rank is skipped (1, 1, 3). */
  rank: number;
  isWinner: boolean;
  /**
   * Where this roster lands between the worst and the best roster that could have been built
   * from the cards that actually came up (0 = worst possible, 1 = best possible).
   */
  haulShare: number;
  grade: Grade;
}

export interface PickHighlight {
  seat: SeatIndex;
  cardId: string;
  price: number;
  rating: number;
  /** What this table's spending implies the rating was worth, in dollars. */
  tableValue: number;
  /** tableValue minus price: positive is a bargain, negative an overpay. */
  margin: number;
  lotNumber: number;
}

export interface Verdict {
  /** In seat order. */
  results: SeatResult[];
  /** Seats from first to last; ties keep seat order. */
  standings: SeatIndex[];
  winners: SeatIndex[];
  isTie: boolean;
  bestBuy: PickHighlight | null;
  biggestOverpay: PickHighlight | null;
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

export const gradeForShare = (share: number): Grade =>
  GRADE_THRESHOLDS.find((entry) => share >= entry.minShare)?.grade ?? Grade.F;

export interface ReferenceHauls {
  /** Total of the best legal roster that the cards shown to the table allowed. */
  best: number;
  /** Total of the worst legal roster from the same cards. */
  worst: number;
}

/**
 * The best and worst rosters that could legally have been built from the cards the table saw
 * (sold, forced or discarded; cards skipped because nobody had room were never shown). Every slot
 * takes its own top or bottom `count` ratings, so a Starting XI is measured against one keeper,
 * two centre-backs and so on, never against eleven strikers. With one slot this is the plain
 * top/bottom of everything shown.
 */
export const computeReferenceHauls = (state: DraftState): ReferenceHauls => {
  const shownBySlot = new Map<string, number[]>();
  for (const record of state.history) {
    if (record.kind === LotOutcomeKind.Unplaceable) continue;
    const slot =
      getSlot(state.rules, record.slotId) ??
      findSlotForPosition(state.rules, getCard(state, record.cardId)?.position ?? "");
    if (!slot) continue;
    const ratings = shownBySlot.get(slot.id) ?? [];
    ratings.push(getCard(state, record.cardId)?.rating ?? 0);
    shownBySlot.set(slot.id, ratings);
  }
  let best = 0;
  let worst = 0;
  for (const slot of state.rules.slots) {
    const ratings = (shownBySlot.get(slot.id) ?? []).sort((a, b) => b - a);
    const take = Math.min(slot.count, ratings.length);
    best += sum(ratings.slice(0, take));
    worst += sum(ratings.slice(ratings.length - take));
  }
  return { best, worst };
};

export const computeVerdict = (state: DraftState): Verdict => {
  const ratingOf = (cardId: string) => getCard(state, cardId)?.rating ?? 0;
  const shownRatings = state.history
    .filter((record) => record.kind !== LotOutcomeKind.Unplaceable)
    .map((record) => ratingOf(record.cardId))
    .sort((a, b) => b - a);
  const { best: bestHaul, worst: worstHaul } = computeReferenceHauls(state);

  const totals = state.seats.map((seat) => sum(seat.roster.map((entry) => ratingOf(entry.cardId))));
  const results: SeatResult[] = state.seats.map((seat, index) => {
    const totalRating = totals[index];
    const spent = sum(seat.roster.map((entry) => entry.price));
    const haulShare =
      bestHaul > worstHaul
        ? Math.min(1, Math.max(0, (totalRating - worstHaul) / (bestHaul - worstHaul)))
        : 1;
    const rank = 1 + totals.filter((other) => other > totalRating).length;
    return {
      seat: index,
      totalRating,
      averageRating: seat.roster.length > 0 ? totalRating / seat.roster.length : 0,
      picks: seat.roster.length,
      spent,
      moneyLeft: seat.money,
      rank,
      isWinner: rank === 1 && seat.roster.length > 0,
      haulShare,
      grade: gradeForShare(haulShare),
    };
  });

  const standings = [...results]
    .sort((a, b) => a.rank - b.rank || a.seat - b.seat)
    .map((result) => result.seat);
  const winners = results.filter((result) => result.isWinner).map((result) => result.seat);

  const picks = state.seats.flatMap((seat, index) =>
    seat.roster.map((entry) => ({ seat: index, entry, rating: ratingOf(entry.cardId) }))
  );
  let bestBuy: PickHighlight | null = null;
  let biggestOverpay: PickHighlight | null = null;
  if (picks.length > 0 && shownRatings.length > 0) {
    // Weight each pick by how far it sits above the weakest card shown, then split the table's
    // total spend by weight: that is what the table "should" have paid for each rating.
    const floor = shownRatings[shownRatings.length - 1] - 1;
    const totalSpend = sum(picks.map((pick) => pick.entry.price));
    const totalWeight = sum(picks.map((pick) => pick.rating - floor));
    const highlights: PickHighlight[] = picks.map((pick) => {
      const tableValue = (totalSpend * (pick.rating - floor)) / totalWeight;
      return {
        seat: pick.seat,
        cardId: pick.entry.cardId,
        price: pick.entry.price,
        rating: pick.rating,
        tableValue,
        margin: tableValue - pick.entry.price,
        lotNumber: pick.entry.lotNumber,
      };
    });
    for (const highlight of highlights) {
      if (
        highlight.margin > 0 &&
        (!bestBuy ||
          highlight.margin > bestBuy.margin ||
          (highlight.margin === bestBuy.margin && highlight.rating > bestBuy.rating))
      ) {
        bestBuy = highlight;
      }
      if (
        highlight.margin < 0 &&
        (!biggestOverpay ||
          highlight.margin < biggestOverpay.margin ||
          (highlight.margin === biggestOverpay.margin && highlight.price > biggestOverpay.price))
      ) {
        biggestOverpay = highlight;
      }
    }
  }

  return { results, standings, winners, isTie: winners.length > 1, bestBuy, biggestOverpay };
};

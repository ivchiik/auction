import { shuffle } from "./rng";
import type { EngineCard, Rng, RuleSet } from "./types";

/** Extra cards dealt per slot kind beyond the spots to fill, as a share of those spots. */
export const DECK_EXTRA_SHARE = 0.5;
/** About 15% of each dealt slot kind is "bench" (its lowest-rated cards) and comes up last. */
export const BENCH_SHARE = 0.15;

export interface DeckPlanEntry {
  slotId: string;
  /** Spots of this kind across the whole table. */
  required: number;
  /** Pool cards that fit this slot kind. */
  available: number;
  /** Cards of this kind that will be dealt. */
  dealt: number;
}

/** Works out how many cards each slot kind deals. Null entries mean the pool is too small. */
export const planDeck = (
  rules: RuleSet,
  pool: readonly EngineCard[],
  seatCount: number
): DeckPlanEntry[] =>
  rules.slots.map((slot) => {
    const required = slot.count * seatCount;
    const available = pool.filter((card) => slot.accepts.includes(card.position)).length;
    const wanted = required + Math.ceil(required * DECK_EXTRA_SHARE);
    return { slotId: slot.id, required, available, dealt: Math.min(available, wanted) };
  });

export const findDeckShortfall = (plan: readonly DeckPlanEntry[]): DeckPlanEntry | null =>
  plan.find((entry) => entry.available < entry.required) ?? null;

/**
 * Deals a deck: a random subset of each slot kind, starters shuffled first, then the bench
 * (lowest-rated ~15% of what was dealt) shuffled at the end. Callers must check
 * `findDeckShortfall` first; this function trusts the plan.
 */
export const buildDeck = (
  rules: RuleSet,
  pool: readonly EngineCard[],
  seatCount: number,
  rng: Rng
): string[] => {
  const plan = planDeck(rules, pool, seatCount);
  const starters: EngineCard[] = [];
  const bench: EngineCard[] = [];

  rules.slots.forEach((slot, slotIndex) => {
    const candidates = pool.filter((card) => slot.accepts.includes(card.position));
    const dealt = shuffle(candidates, rng).slice(0, plan[slotIndex].dealt);
    const benchCount = Math.round(dealt.length * BENCH_SHARE);
    const benchIds = new Set(
      dealt
        .map((card, order) => ({ card, order }))
        .sort((a, b) => a.card.rating - b.card.rating || a.order - b.order)
        .slice(0, benchCount)
        .map((entry) => entry.card.id)
    );
    for (const card of dealt) {
      if (benchIds.has(card.id)) bench.push(card);
      else starters.push(card);
    }
  });

  return [...shuffle(starters, rng), ...shuffle(bench, rng)].map((card) => card.id);
};

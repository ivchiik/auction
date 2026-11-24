import type { RuleSet, SeatState, SlotRule } from "./types";

export const MIN_SEATS = 2;
export const MAX_SEATS = 4;

export const DEFAULT_BUDGET = 20;
export const DEFAULT_ROSTER_SIZE = 5;
export const DEFAULT_SKIPS_PER_SEAT = 2;
export const DEFAULT_OPENING_BID = 1;
export const DEFAULT_RAISE_STEPS: readonly number[] = [1, 2, 3];
export const DEFAULT_FORCED_FILL_PRICE = 1;

/** Classic single-position draft: one slot kind, five picks, $20, two skips, raises of 1–3. */
export const createSinglePositionRules = (
  positions: readonly string[],
  options: { slotId?: string; count?: number; budget?: number } = {}
): RuleSet => ({
  budget: options.budget ?? DEFAULT_BUDGET,
  slots: [
    {
      id: options.slotId ?? "pick",
      count: options.count ?? DEFAULT_ROSTER_SIZE,
      accepts: [...positions],
    },
  ],
  skipsPerSeat: DEFAULT_SKIPS_PER_SEAT,
  openingBid: DEFAULT_OPENING_BID,
  raiseSteps: [...DEFAULT_RAISE_STEPS],
  forcedFillPrice: DEFAULT_FORCED_FILL_PRICE,
});

const isPositiveInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isNonNegativeInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

export const rosterSize = (rules: RuleSet): number =>
  rules.slots.reduce((total, slot) => total + slot.count, 0);

/** Returns a list of problems; an empty list means the rule set is playable. */
export const validateRuleSet = (rules: unknown): string[] => {
  const problems: string[] = [];
  if (typeof rules !== "object" || rules === null) return ["rules must be an object"];
  const candidate = rules as Partial<RuleSet>;

  if (!isPositiveInt(candidate.budget)) problems.push("budget must be a positive integer");
  if (!isNonNegativeInt(candidate.skipsPerSeat)) problems.push("skipsPerSeat must be >= 0");
  if (!isPositiveInt(candidate.openingBid)) problems.push("openingBid must be a positive integer");
  if (!isPositiveInt(candidate.forcedFillPrice)) {
    problems.push("forcedFillPrice must be a positive integer");
  }

  const steps = candidate.raiseSteps;
  if (!Array.isArray(steps) || steps.length === 0 || !steps.every(isPositiveInt)) {
    problems.push("raiseSteps must be a non-empty list of positive integers");
  } else if (steps.some((step, index) => index > 0 && step <= steps[index - 1])) {
    problems.push("raiseSteps must be strictly ascending");
  }

  const slots = candidate.slots;
  if (!Array.isArray(slots) || slots.length === 0) {
    problems.push("slots must be a non-empty list");
    return problems;
  }
  const slotIds = new Set<string>();
  const positions = new Set<string>();
  for (const slot of slots as unknown[]) {
    const typed = slot as Partial<SlotRule> | null;
    if (typeof typed !== "object" || typed === null) {
      problems.push("every slot must be an object");
      continue;
    }
    if (typeof typed.id !== "string" || typed.id.length === 0) problems.push("slot id missing");
    else if (slotIds.has(typed.id)) problems.push(`duplicate slot id ${typed.id}`);
    else slotIds.add(typed.id);
    if (!isPositiveInt(typed.count)) problems.push(`slot ${typed.id} count must be positive`);
    if (!Array.isArray(typed.accepts) || typed.accepts.length === 0) {
      problems.push(`slot ${typed.id} must accept at least one position`);
      continue;
    }
    for (const position of typed.accepts) {
      if (typeof position !== "string" || position.length === 0) {
        problems.push(`slot ${typed.id} has an invalid position`);
      } else if (positions.has(position)) {
        problems.push(`position ${position} is accepted by more than one slot`);
      } else {
        positions.add(position);
      }
    }
  }

  if (problems.length === 0) {
    const typed = candidate as RuleSet;
    if (typed.budget < rosterSize(typed) * minSpotPrice(typed)) {
      problems.push("budget cannot cover the minimum price for every roster spot");
    }
  }
  return problems;
};

/** Cheapest price a spot can ever cost; the reserve keeps this much per open spot. */
export const minSpotPrice = (rules: RuleSet): number =>
  Math.max(rules.openingBid, rules.forcedFillPrice);

export const findSlotForPosition = (rules: RuleSet, position: string): SlotRule | null =>
  rules.slots.find((slot) => slot.accepts.includes(position)) ?? null;

export const getSlot = (rules: RuleSet, slotId: string): SlotRule | null =>
  rules.slots.find((slot) => slot.id === slotId) ?? null;

export const countFilled = (seat: SeatState, slotId: string): number =>
  seat.roster.reduce((total, entry) => (entry.slotId === slotId ? total + 1 : total), 0);

export const openSpotsForSlot = (seat: SeatState, slot: SlotRule): number =>
  Math.max(0, slot.count - countFilled(seat, slot.id));

export const openSpots = (seat: SeatState, rules: RuleSet): number =>
  rules.slots.reduce((total, slot) => total + openSpotsForSlot(seat, slot), 0);

export const isRosterFull = (seat: SeatState, rules: RuleSet): boolean =>
  openSpots(seat, rules) === 0;

/**
 * The budget rule: a seat must always keep the minimum price for every other open spot,
 * so its maximum bid is its money minus that reserve.
 */
export const maxBidFor = (seat: SeatState, rules: RuleSet): number => {
  const open = openSpots(seat, rules);
  if (open === 0) return 0;
  const reserve = (open - 1) * minSpotPrice(rules);
  return Math.max(0, seat.money - reserve);
};

import { buildDeck, findDeckShortfall, planDeck } from "./deck";
import { createRng, deriveSeed, isValidSeed } from "./rng";
import {
  findSlotForPosition,
  MAX_SEATS,
  MIN_SEATS,
  openSpots,
  openSpotsForSlot,
  validateRuleSet,
} from "./rules";
import {
  areAllRostersFull,
  countOpenForSlot,
  countRemainingForSlot,
  getCard,
  getStepKey,
  getTurnKey,
  getTurnOptions,
} from "./selectors";
import {
  DRAFT_SCHEMA_VERSION,
  DraftMode,
  DraftPhase,
  EngineErrorCode,
  LotOutcomeKind,
  SeatKind,
  type DraftAction,
  type DraftState,
  type EngineCard,
  type EngineResult,
  type LotRecord,
  type LotState,
  type RuleSet,
  type SeatConfig,
  type SeatIndex,
} from "./types";

export interface CreateDraftInput {
  packId: string;
  rules: RuleSet;
  seats: readonly SeatConfig[];
  pool: readonly EngineCard[];
  seed: number;
  /** Injected clock reading (ms). */
  now: number;
  mode?: DraftMode;
  dailyKey?: string | null;
  /** Defaults to a value derived from pack, seed and time. */
  draftId?: string;
}

const fail = <T>(code: EngineErrorCode, message: string): EngineResult<T> => ({
  ok: false,
  error: { code, message },
});

/**
 * Time stamped on a transition. Device clocks can be corrected backwards mid-draft; a stamp
 * earlier than the last one (or than `createdAt`) would make the saved draft fail validation at
 * the next launch. The stored time therefore never moves back: it is the latest of creation, the
 * previous update and the injected reading.
 */
const stampTime = (state: DraftState, now: number): number =>
  Math.max(state.createdAt, state.updatedAt, now);

/** Copies everything a transition may change; rules, pool and deck are never mutated. */
const cloneDraft = (state: DraftState): DraftState => ({
  ...state,
  seats: state.seats.map((seat) => ({ ...seat, roster: [...seat.roster] })),
  lot: state.lot
    ? {
        ...state.lot,
        eligible: [...state.lot.eligible],
        passed: [...state.lot.passed],
        bids: [...state.lot.bids],
        outcome: state.lot.outcome ? { ...state.lot.outcome } : null,
      }
    : null,
  history: [...state.history],
});

const validateSeatConfigs = (seats: readonly SeatConfig[]): string | null => {
  if (seats.length < MIN_SEATS || seats.length > MAX_SEATS) {
    return `a draft needs ${MIN_SEATS}-${MAX_SEATS} seats`;
  }
  const ids = new Set<string>();
  for (const seat of seats) {
    if (typeof seat.id !== "string" || seat.id.length === 0) return "every seat needs an id";
    if (ids.has(seat.id)) return `duplicate seat id ${seat.id}`;
    ids.add(seat.id);
    if (typeof seat.name !== "string" || seat.name.trim().length === 0) {
      return "every seat needs a name";
    }
    if (seat.kind !== SeatKind.Human && seat.kind !== SeatKind.Bot) return "unknown seat kind";
    if (seat.kind === SeatKind.Bot && !seat.personality) return "bots need a personality";
  }
  return null;
};

const validatePool = (rules: RuleSet, pool: readonly EngineCard[]): string | null => {
  const ids = new Set<string>();
  for (const card of pool) {
    if (typeof card.id !== "string" || card.id.length === 0) return "every card needs an id";
    if (ids.has(card.id)) return `duplicate card id ${card.id}`;
    ids.add(card.id);
    if (!Number.isFinite(card.rating)) return `card ${card.id} has no numeric rating`;
    if (!findSlotForPosition(rules, card.position)) {
      return `card ${card.id} has position ${card.position}, which no slot accepts`;
    }
  }
  return null;
};

export const createDraft = (input: CreateDraftInput): EngineResult<DraftState> => {
  const ruleProblems = validateRuleSet(input.rules);
  if (ruleProblems.length > 0) return fail(EngineErrorCode.InvalidConfig, ruleProblems.join("; "));
  const seatProblem = validateSeatConfigs(input.seats);
  if (seatProblem) return fail(EngineErrorCode.InvalidConfig, seatProblem);
  const poolProblem = validatePool(input.rules, input.pool);
  if (poolProblem) return fail(EngineErrorCode.InvalidConfig, poolProblem);
  if (!isValidSeed(input.seed)) return fail(EngineErrorCode.InvalidConfig, "seed must be uint32");
  if (!Number.isFinite(input.now)) return fail(EngineErrorCode.InvalidConfig, "now is required");

  const shortfall = findDeckShortfall(planDeck(input.rules, input.pool, input.seats.length));
  if (shortfall) {
    return fail(
      EngineErrorCode.InvalidConfig,
      `slot ${shortfall.slotId} needs ${shortfall.required} cards but the pack has ${shortfall.available}`
    );
  }

  const seatCount = input.seats.length;
  const deck = buildDeck(
    input.rules,
    input.pool,
    seatCount,
    createRng(deriveSeed(input.seed, "deck"))
  );
  const firstOpener = createRng(deriveSeed(input.seed, "opener")).int(0, seatCount - 1);

  const state: DraftState = {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    id: input.draftId ?? `${input.packId}-${input.seed.toString(36)}-${input.now.toString(36)}`,
    packId: input.packId,
    mode: input.mode ?? DraftMode.Quick,
    dailyKey: input.dailyKey ?? null,
    seed: input.seed,
    createdAt: input.now,
    updatedAt: input.now,
    rules: input.rules,
    pool: input.pool.map((card) => ({ id: card.id, position: card.position, rating: card.rating })),
    deck,
    nextDeckIndex: 0,
    nextOpener: firstOpener,
    seats: input.seats.map((seat) => ({
      id: seat.id,
      name: seat.name.trim(),
      kind: seat.kind,
      personality: seat.kind === SeatKind.Bot ? (seat.personality ?? null) : null,
      money: input.rules.budget,
      skipsLeft: input.rules.skipsPerSeat,
      roster: [],
    })),
    lot: null,
    history: [],
    phase: DraftPhase.Resolved,
  };

  if (!openNextLot(state)) return fail(EngineErrorCode.DeckExhausted, DECK_EXHAUSTED_MESSAGE);
  return { ok: true, value: state };
};

const toRecord = (lot: LotState): LotRecord => ({
  number: lot.number,
  deckIndex: lot.deckIndex,
  cardId: lot.cardId,
  slotId: lot.slotId,
  kind: lot.outcome?.kind ?? LotOutcomeKind.Discarded,
  seat: lot.outcome?.seat ?? null,
  price: lot.outcome?.price ?? 0,
  opener: lot.opener,
  bidCount: lot.bids.length,
});

/** Awards the current lot to `seat` at `price` (mutates a cloned state). */
const award = (state: DraftState, seat: SeatIndex, price: number, kind: LotOutcomeKind) => {
  const lot = state.lot as LotState;
  const winner = state.seats[seat];
  winner.money -= price;
  winner.roster.push({ cardId: lot.cardId, slotId: lot.slotId, price, lotNumber: lot.number });
  lot.outcome = { kind, seat, price };
  lot.turn = null;
  state.history.push(toRecord(lot));
  state.phase = DraftPhase.Resolved;
};

const discard = (state: DraftState) => {
  const lot = state.lot as LotState;
  lot.outcome = { kind: LotOutcomeKind.Discarded, seat: null, price: 0 };
  lot.turn = null;
  state.history.push(toRecord(lot));
  state.phase = DraftPhase.Resolved;
};

/** Next seat clockwise after `after` that is still in the running and not the high bidder. */
const nextContender = (lot: LotState, seatCount: number, after: SeatIndex): SeatIndex | null => {
  for (let offset = 1; offset <= seatCount; offset += 1) {
    const seat = (after + offset) % seatCount;
    if (seat === lot.highBidder) continue;
    if (lot.eligible.includes(seat) && !lot.passed.includes(seat)) return seat;
  }
  return null;
};

/**
 * Reveals cards until one needs a decision (Bidding), resolves by itself (Resolved, forced
 * fill) or every roster is full (Complete). Mutates a cloned state. Returns false if the deck
 * runs out while spots are still open, which the supply invariant makes unreachable for valid
 * states; callers turn that into an error instead of a "complete" draft with empty spots.
 */
const openNextLot = (state: DraftState): boolean => {
  const seatCount = state.seats.length;
  state.lot = null;

  while (!areAllRostersFull(state)) {
    if (state.nextDeckIndex >= state.deck.length) return false;
    const deckIndex = state.nextDeckIndex;
    const card = getCard(state, state.deck[deckIndex]) as EngineCard;
    const slot = findSlotForPosition(state.rules, card.position);
    state.nextDeckIndex += 1;
    const number = state.history.length + 1;
    const eligible = slot
      ? state.seats.flatMap((seat, index) => (openSpotsForSlot(seat, slot) > 0 ? [index] : []))
      : [];

    const lot: LotState = {
      number,
      deckIndex,
      cardId: card.id,
      slotId: slot?.id ?? "",
      opener: eligible[0] ?? 0,
      turn: null,
      eligible,
      passed: [],
      highBid: 0,
      highBidder: null,
      bids: [],
      skipLocked: false,
      outcome: null,
    };

    if (!slot || eligible.length === 0) {
      state.history.push({
        ...toRecord(lot),
        kind: LotOutcomeKind.Unplaceable,
        opener: null,
      });
      continue;
    }

    state.lot = lot;
    const seatsWithSpots = state.seats.filter((seat) => openSpots(seat, state.rules) > 0);
    if (seatsWithSpots.length === 1) {
      // No hiding: the last seat with open spots takes every card that fits at the floor price.
      lot.skipLocked = true;
      award(state, eligible[0], state.rules.forcedFillPrice, LotOutcomeKind.ForcedFill);
      return true;
    }

    let opener = eligible[0];
    for (let offset = 0; offset < seatCount; offset += 1) {
      const seat = (state.nextOpener + offset) % seatCount;
      if (eligible.includes(seat)) {
        opener = seat;
        break;
      }
    }
    state.nextOpener = (opener + 1) % seatCount;
    lot.opener = opener;
    lot.turn = opener;
    lot.skipLocked =
      countRemainingForSlot(state, slot.id, deckIndex) <= countOpenForSlot(state, slot.id);
    state.phase = DraftPhase.Bidding;
    return true;
  }

  state.lot = null;
  state.phase = DraftPhase.Complete;
  return true;
};

const DECK_EXHAUSTED_MESSAGE = "the deck ran out before every roster was full";

/**
 * The single transition function. Invalid actions never throw and never change state: they
 * return a typed error so UI and bots can explain or retry. `now` must be a finite clock reading;
 * a reading earlier than the draft's last update is accepted but does not move `updatedAt` back.
 */
export const applyAction = (
  state: DraftState,
  action: DraftAction,
  now: number
): EngineResult<DraftState> => {
  if (!Number.isFinite(now)) {
    return fail(EngineErrorCode.InvalidAction, "now must be a finite clock reading");
  }
  if (state.phase === DraftPhase.Complete) {
    return fail(EngineErrorCode.DraftComplete, "the draft is over");
  }

  if (action.type === "advance") {
    if (state.phase !== DraftPhase.Resolved) {
      return fail(EngineErrorCode.NotResolved, "the current lot is still being auctioned");
    }
    const next = cloneDraft(state);
    if (!openNextLot(next)) return fail(EngineErrorCode.DeckExhausted, DECK_EXHAUSTED_MESSAGE);
    next.updatedAt = stampTime(state, now);
    return { ok: true, value: next };
  }

  if (action.type !== "bid" && action.type !== "pass") {
    return fail(EngineErrorCode.InvalidAction, "unknown action");
  }
  if (state.phase !== DraftPhase.Bidding || !state.lot) {
    return fail(EngineErrorCode.NotBidding, "no lot is open for bidding");
  }
  const options = getTurnOptions(state);
  if (!options || options.seat !== action.seat) {
    return fail(EngineErrorCode.NotYourTurn, `it is not seat ${action.seat}'s turn`);
  }

  const next = cloneDraft(state);
  const lot = next.lot as LotState;
  const seatCount = next.seats.length;

  if (action.type === "bid") {
    if (!Number.isInteger(action.amount)) {
      return fail(EngineErrorCode.BidNotAllowed, "bids are whole dollars");
    }
    if (action.amount > options.maxBid) {
      return fail(
        EngineErrorCode.BidOverLimit,
        `bid ${action.amount} breaks the reserve; the limit is ${options.maxBid}`
      );
    }
    if (!options.bids.includes(action.amount)) {
      return fail(EngineErrorCode.BidNotAllowed, `bid ${action.amount} is not a legal amount`);
    }
    lot.highBid = action.amount;
    lot.highBidder = action.seat;
    lot.bids.push({ seat: action.seat, amount: action.amount });
    const following = nextContender(lot, seatCount, action.seat);
    if (following === null) award(next, action.seat, action.amount, LotOutcomeKind.Sold);
    else lot.turn = following;
  } else {
    if (!options.canPass) {
      return fail(EngineErrorCode.PassNotAllowed, `seat ${action.seat} must bid on this card`);
    }
    if (options.passCostsSkip) next.seats[action.seat].skipsLeft -= 1;
    lot.passed.push(action.seat);
    const following = nextContender(lot, seatCount, action.seat);
    if (following !== null) lot.turn = following;
    else if (lot.highBidder !== null) award(next, lot.highBidder, lot.highBid, LotOutcomeKind.Sold);
    else discard(next);
  }

  next.updatedAt = stampTime(state, now);
  return { ok: true, value: next };
};

/**
 * For anything scheduled (shot clock, bot think time): the action only applies if the decision
 * it was scheduled for, identified by `getTurnKey`, is still the one pending in `state`.
 */
export const applyActionForTurn = (
  state: DraftState,
  turnKey: string,
  action: DraftAction,
  now: number
): EngineResult<DraftState> => {
  if (getTurnKey(state) !== turnKey) {
    return fail(EngineErrorCode.StaleTurn, "that decision has already been made");
  }
  return applyAction(state, action, now);
};

/**
 * Like `applyActionForTurn`, but also covers moving past a resolved card: the action applies only
 * while `getStepKey(state)` still equals the key it was issued for. This is the dispatch-layer
 * double-tap and stale-render guard used by every button, timer and bot.
 */
export const applyActionForStep = (
  state: DraftState,
  stepKey: string,
  action: DraftAction,
  now: number
): EngineResult<DraftState> => {
  if (getStepKey(state) !== stepKey) {
    return fail(EngineErrorCode.StaleTurn, "the table has already moved on");
  }
  return applyAction(state, action, now);
};

/** Convenience for drivers that treat an illegal action as a programming error. */
export const applyActionOrThrow = (state: DraftState, action: DraftAction, now: number) => {
  const result = applyAction(state, action, now);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};

import { isValidSeed } from "./rng";
import {
  findSlotForPosition,
  getSlot,
  isRosterFull,
  MAX_SEATS,
  maxBidFor,
  MIN_SEATS,
  minSpotPrice,
  openSpots,
  openSpotsForSlot,
  validateRuleSet,
} from "./rules";
import { countOpenForSlot, countRemainingForSlot, getCard } from "./selectors";
import {
  BotPersonality,
  DRAFT_SCHEMA_VERSION,
  DraftMode,
  DraftPhase,
  EngineErrorCode,
  LotOutcomeKind,
  SeatKind,
  type DraftState,
  type EngineResult,
} from "./types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);
const isNonNegativeInt = (value: unknown): value is number => isInt(value) && value >= 0;
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isOneOf = <T extends string>(values: Record<string, T>, value: unknown): value is T =>
  Object.values(values).includes(value as T);
const isIntArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(isNonNegativeInt);
const unique = (values: readonly (string | number)[]) => new Set(values).size === values.length;

/** Shape check only: every field exists with the right primitive type. */
const findShapeProblem = (input: unknown): string | null => {
  if (!isRecord(input)) return "draft is not an object";
  if (input.schemaVersion !== DRAFT_SCHEMA_VERSION) return "unsupported schema version";
  if (!isString(input.id) || !isString(input.packId)) return "id/packId missing";
  if (!isOneOf(DraftMode, input.mode)) return "unknown mode";
  if (input.dailyKey !== null && !isString(input.dailyKey)) return "dailyKey malformed";
  if (!isValidSeed(input.seed)) return "seed malformed";
  if (!isFiniteNumber(input.createdAt) || !isFiniteNumber(input.updatedAt)) {
    return "timestamps malformed";
  }
  const ruleProblems = validateRuleSet(input.rules);
  if (ruleProblems.length > 0) return `rules: ${ruleProblems[0]}`;
  if (!Array.isArray(input.pool) || input.pool.length === 0) return "pool missing";
  for (const card of input.pool) {
    if (!isRecord(card) || !isString(card.id) || !isString(card.position)) return "bad card";
    if (!isFiniteNumber(card.rating)) return "card rating malformed";
  }
  if (!Array.isArray(input.deck) || !input.deck.every(isString)) return "deck malformed";
  if (!isNonNegativeInt(input.nextDeckIndex) || !isNonNegativeInt(input.nextOpener)) {
    return "deck cursor malformed";
  }
  if (!Array.isArray(input.seats)) return "seats missing";
  for (const seat of input.seats) {
    if (!isRecord(seat) || !isString(seat.id) || !isString(seat.name)) return "bad seat";
    if (!isOneOf(SeatKind, seat.kind)) return "unknown seat kind";
    if (seat.personality !== null && !isOneOf(BotPersonality, seat.personality)) {
      return "unknown personality";
    }
    if (!isNonNegativeInt(seat.money) || !isNonNegativeInt(seat.skipsLeft)) return "bad bankroll";
    if (!Array.isArray(seat.roster)) return "roster missing";
    for (const entry of seat.roster) {
      if (!isRecord(entry) || !isString(entry.cardId) || !isString(entry.slotId)) {
        return "bad roster entry";
      }
      if (!isNonNegativeInt(entry.price) || !isNonNegativeInt(entry.lotNumber)) {
        return "bad roster price";
      }
    }
  }
  if (!Array.isArray(input.history)) return "history missing";
  for (const record of input.history) {
    if (!isRecord(record) || !isString(record.cardId) || !isString(record.slotId)) {
      return "bad history record";
    }
    if (!isOneOf(LotOutcomeKind, record.kind)) return "unknown lot outcome";
    if (!isNonNegativeInt(record.number) || !isNonNegativeInt(record.deckIndex)) {
      return "bad history numbering";
    }
    if (record.seat !== null && !isNonNegativeInt(record.seat)) return "bad history seat";
    if (record.opener !== null && !isNonNegativeInt(record.opener)) return "bad history opener";
    if (!isNonNegativeInt(record.price) || !isNonNegativeInt(record.bidCount)) {
      return "bad history price";
    }
  }
  if (!isOneOf(DraftPhase, input.phase)) return "unknown phase";
  if (input.lot !== null) {
    const lot = input.lot;
    if (!isRecord(lot) || !isString(lot.cardId) || !isString(lot.slotId)) return "bad lot";
    if (!isNonNegativeInt(lot.number) || !isNonNegativeInt(lot.deckIndex)) return "bad lot index";
    if (!isNonNegativeInt(lot.opener)) return "bad lot opener";
    if (lot.turn !== null && !isNonNegativeInt(lot.turn)) return "bad lot turn";
    if (!isIntArray(lot.eligible) || !isIntArray(lot.passed)) return "bad lot seats";
    if (!isNonNegativeInt(lot.highBid)) return "bad high bid";
    if (lot.highBidder !== null && !isNonNegativeInt(lot.highBidder)) return "bad high bidder";
    if (typeof lot.skipLocked !== "boolean") return "bad skip lock";
    if (!Array.isArray(lot.bids)) return "bids missing";
    for (const bid of lot.bids) {
      if (!isRecord(bid) || !isNonNegativeInt(bid.seat) || !isNonNegativeInt(bid.amount)) {
        return "bad bid";
      }
    }
    if (lot.outcome !== null) {
      const outcome = lot.outcome;
      if (!isRecord(outcome) || !isOneOf(LotOutcomeKind, outcome.kind)) return "bad outcome";
      if (outcome.seat !== null && !isNonNegativeInt(outcome.seat)) return "bad outcome seat";
      if (!isNonNegativeInt(outcome.price)) return "bad outcome price";
    }
  }
  return null;
};

/**
 * Game-rule invariants that every reachable state satisfies. Used to reject corrupted or
 * hand-edited saves and, in tests, after every single simulated action.
 */
export const checkDraftInvariants = (state: DraftState): string[] => {
  const problems: string[] = [];
  const { rules, seats, deck, history, lot } = state;
  const seatCount = seats.length;
  const isSeat = (value: number | null) => value !== null && value >= 0 && value < seatCount;

  if (seatCount < MIN_SEATS || seatCount > MAX_SEATS) problems.push("seat count out of range");
  if (!unique(seats.map((seat) => seat.id))) problems.push("duplicate seat ids");
  if (state.updatedAt < state.createdAt) problems.push("updatedAt precedes createdAt");

  const poolIds = state.pool.map((card) => card.id);
  if (!unique(poolIds)) problems.push("duplicate pool card ids");
  for (const card of state.pool) {
    if (!findSlotForPosition(rules, card.position)) problems.push(`card ${card.id} fits no slot`);
  }
  const poolIdSet = new Set(poolIds);
  if (!unique(deck)) problems.push("deck repeats a card");
  if (deck.some((cardId) => !poolIdSet.has(cardId))) problems.push("deck card missing from pool");
  if (state.nextDeckIndex > deck.length) problems.push("deck cursor past the end");
  if (!isSeat(state.nextOpener)) problems.push("opener cursor out of range");

  const awarded = new Map<string, { seat: number; price: number; lotNumber: number }>();
  seats.forEach((seat, index) => {
    if (seat.kind === SeatKind.Bot && seat.personality === null) {
      problems.push(`bot seat ${index} has no personality`);
    }
    if (seat.kind === SeatKind.Human && seat.personality !== null) {
      problems.push(`human seat ${index} has a personality`);
    }
    if (seat.skipsLeft > rules.skipsPerSeat) problems.push(`seat ${index} has too many skips`);
    let spent = 0;
    for (const entry of seat.roster) {
      const slot = getSlot(rules, entry.slotId);
      const card = getCard(state, entry.cardId);
      if (!slot || !card || !slot.accepts.includes(card.position)) {
        problems.push(`seat ${index} holds ${entry.cardId} in the wrong slot`);
      }
      if (entry.price < Math.min(rules.openingBid, rules.forcedFillPrice)) {
        problems.push(`seat ${index} paid below the floor for ${entry.cardId}`);
      }
      if (awarded.has(entry.cardId)) problems.push(`card ${entry.cardId} awarded twice`);
      awarded.set(entry.cardId, { seat: index, price: entry.price, lotNumber: entry.lotNumber });
      spent += entry.price;
    }
    for (const slot of rules.slots) {
      if (seat.roster.filter((entry) => entry.slotId === slot.id).length > slot.count) {
        problems.push(`seat ${index} overfilled slot ${slot.id}`);
      }
    }
    if (seat.money + spent !== rules.budget) problems.push(`seat ${index} money does not balance`);
    if (seat.money < openSpots(seat, rules) * minSpotPrice(rules)) {
      problems.push(`seat ${index} cannot cover its open spots`);
    }
  });

  // History must replay the revealed part of the deck exactly once, in order.
  const revealed = new Set<number>();
  let awardsInHistory = 0;
  history.forEach((record, index) => {
    if (record.number !== index + 1) problems.push(`history record ${index} misnumbered`);
    if (index > 0 && record.deckIndex <= history[index - 1].deckIndex) {
      problems.push("history out of deck order");
    }
    if (record.deckIndex >= state.nextDeckIndex || deck[record.deckIndex] !== record.cardId) {
      problems.push(`history record ${record.number} does not match the deck`);
    }
    revealed.add(record.deckIndex);
    if (record.kind === LotOutcomeKind.Sold || record.kind === LotOutcomeKind.ForcedFill) {
      awardsInHistory += 1;
      const award = awarded.get(record.cardId);
      if (
        !award ||
        award.seat !== record.seat ||
        award.price !== record.price ||
        award.lotNumber !== record.number
      ) {
        problems.push(`history record ${record.number} disagrees with the rosters`);
      }
    } else if (record.seat !== null || record.price !== 0) {
      problems.push(`history record ${record.number} has a buyer but no sale`);
    }
  });
  if (awardsInHistory !== awarded.size) problems.push("rosters hold cards missing from history");

  const slotStart = state.phase === DraftPhase.Bidding && lot ? lot.deckIndex : state.nextDeckIndex;
  for (const slot of rules.slots) {
    if (countRemainingForSlot(state, slot.id, slotStart) < countOpenForSlot(state, slot.id)) {
      problems.push(`not enough cards left to fill slot ${slot.id}`);
    }
  }

  if (state.phase === DraftPhase.Complete) {
    if (lot !== null) problems.push("complete draft still has a lot");
    if (!seats.every((seat) => isRosterFull(seat, rules)))
      problems.push("complete with open spots");
    if (revealed.size !== state.nextDeckIndex) problems.push("unrevealed gaps in history");
    return problems;
  }

  if (!lot) {
    problems.push(`${state.phase} draft has no lot`);
    return problems;
  }
  if (lot.deckIndex !== state.nextDeckIndex - 1 || deck[lot.deckIndex] !== lot.cardId) {
    problems.push("lot does not match the deck cursor");
  }
  const card = getCard(state, lot.cardId);
  const slot = getSlot(rules, lot.slotId);
  if (!card || !slot || !slot.accepts.includes(card.position)) problems.push("lot slot mismatch");
  if (!unique(lot.eligible) || !lot.eligible.every(isSeat)) problems.push("lot eligibility broken");
  if (!unique(lot.passed) || !lot.passed.every((seat) => lot.eligible.includes(seat))) {
    problems.push("passed seats must be eligible");
  }
  if (!lot.eligible.includes(lot.opener)) problems.push("opener is not eligible");

  if (state.phase === DraftPhase.Resolved) {
    const last = history[history.length - 1];
    if (!lot.outcome || lot.turn !== null) problems.push("resolved lot still open");
    else if (
      !last ||
      last.number !== lot.number ||
      last.cardId !== lot.cardId ||
      last.kind !== lot.outcome.kind ||
      last.seat !== lot.outcome.seat ||
      last.price !== lot.outcome.price
    ) {
      problems.push("resolved lot is not the last history record");
    }
    if (revealed.size !== state.nextDeckIndex) problems.push("unrevealed gaps in history");
    return problems;
  }

  // Bidding
  revealed.add(lot.deckIndex);
  if (revealed.size !== state.nextDeckIndex) problems.push("unrevealed gaps in history");
  if (lot.outcome !== null) problems.push("open lot already has an outcome");
  if (lot.number !== history.length + 1) problems.push("lot number out of sequence");
  if (
    slot &&
    lot.eligible.some((seat) => isSeat(seat) && openSpotsForSlot(seats[seat], slot) === 0)
  ) {
    problems.push("a seat without room is bidding");
  }
  if (seats.filter((seat) => openSpots(seat, rules) > 0).length < 2) {
    problems.push("a lone seat should have been force-filled");
  }
  if (
    lot.turn === null ||
    !lot.eligible.includes(lot.turn) ||
    lot.passed.includes(lot.turn) ||
    lot.turn === lot.highBidder
  ) {
    problems.push("turn belongs to a seat that cannot act");
  }
  const hasBid = lot.highBidder !== null;
  if (hasBid !== lot.highBid > 0 || hasBid !== lot.bids.length > 0) {
    problems.push("high bid bookkeeping inconsistent");
  }
  if (lot.bids.some((bid, index) => index > 0 && bid.amount <= lot.bids[index - 1].amount)) {
    problems.push("bids must rise");
  }
  if (hasBid) {
    const lastBid = lot.bids[lot.bids.length - 1];
    if (lastBid.seat !== lot.highBidder || lastBid.amount !== lot.highBid) {
      problems.push("high bid is not the last bid");
    }
    if (!isSeat(lot.highBidder) || lot.passed.includes(lot.highBidder as number)) {
      problems.push("high bidder is out");
    } else if (lot.highBid > maxBidFor(seats[lot.highBidder as number], rules)) {
      problems.push("high bid breaks the reserve");
    }
  }
  if (slot) {
    const shouldLock =
      countRemainingForSlot(state, slot.id, lot.deckIndex) <= countOpenForSlot(state, slot.id);
    if (lot.skipLocked !== shouldLock) problems.push("skip lock does not match the deck");
  }
  return problems;
};

/**
 * Turns untrusted saved data into a DraftState, or explains why it cannot be trusted.
 * Never throws.
 */
export const parseDraftState = (input: unknown): EngineResult<DraftState> => {
  try {
    const shapeProblem = findShapeProblem(input);
    if (shapeProblem) {
      return { ok: false, error: { code: EngineErrorCode.InvalidConfig, message: shapeProblem } };
    }
    const state = input as DraftState;
    const problems = checkDraftInvariants(state);
    if (problems.length > 0) {
      return {
        ok: false,
        error: { code: EngineErrorCode.InvalidConfig, message: problems.slice(0, 3).join("; ") },
      };
    }
    return { ok: true, value: state };
  } catch {
    return { ok: false, error: { code: EngineErrorCode.InvalidConfig, message: "unreadable" } };
  }
};

import { findSlotForPosition, getSlot, isRosterFull, maxBidFor, openSpotsForSlot } from "./rules";
import {
  DraftPhase,
  PassBlockReason,
  type DraftAction,
  type DraftState,
  type EngineCard,
  type SeatIndex,
  type TurnOptions,
} from "./types";

export const getCard = (state: DraftState, cardId: string): EngineCard | null =>
  state.pool.find((card) => card.id === cardId) ?? null;

/** Seat that must act now, or null when no decision is pending. */
export const getActiveSeat = (state: DraftState): SeatIndex | null =>
  state.phase === DraftPhase.Bidding && state.lot ? state.lot.turn : null;

/** Seats still in the running for the current lot (eligible and not passed). */
export const getContenders = (state: DraftState): SeatIndex[] => {
  const lot = state.lot;
  if (!lot) return [];
  return lot.eligible.filter((seat) => !lot.passed.includes(seat));
};

/** Cards of the given slot kind still to come, counting the card currently on the block. */
export const countRemainingForSlot = (state: DraftState, slotId: string, fromDeckIndex: number) => {
  const slot = getSlot(state.rules, slotId);
  if (!slot) return 0;
  let remaining = 0;
  for (let index = fromDeckIndex; index < state.deck.length; index += 1) {
    const card = getCard(state, state.deck[index]);
    if (card && slot.accepts.includes(card.position)) remaining += 1;
  }
  return remaining;
};

/** Open spots of one slot kind across the whole table. */
export const countOpenForSlot = (state: DraftState, slotId: string): number => {
  const slot = getSlot(state.rules, slotId);
  if (!slot) return 0;
  return state.seats.reduce((total, seat) => total + openSpotsForSlot(seat, slot), 0);
};

export const getSeatSlotForCard = (state: DraftState, cardId: string) => {
  const card = getCard(state, cardId);
  return card ? findSlotForPosition(state.rules, card.position) : null;
};

export const areAllRostersFull = (state: DraftState): boolean =>
  state.seats.every((seat) => isRosterFull(seat, state.rules));

/** Legal choices for the seat whose turn it is, with the reasons behind every restriction. */
export const getTurnOptions = (state: DraftState): TurnOptions | null => {
  const lot = state.lot;
  if (state.phase !== DraftPhase.Bidding || !lot || lot.turn === null) return null;
  const seatIndex = lot.turn;
  const seat = state.seats[seatIndex];
  const { rules } = state;
  const maxBid = maxBidFor(seat, rules);
  const hasBid = lot.highBidder !== null;
  const rivalsLeft = lot.eligible.some(
    (other) => other !== seatIndex && !lot.passed.includes(other)
  );

  let candidates: number[];
  if (hasBid) {
    candidates = rules.raiseSteps.map((step) => lot.highBid + step);
  } else if (rivalsLeft) {
    // Openings use the same three buttons as raises: $1, $2 or $3 over nothing.
    candidates = rules.raiseSteps.map((step) => rules.openingBid + step - rules.raiseSteps[0]);
  } else {
    // Everyone else already passed: any opening wins on the spot, so only the floor makes sense.
    candidates = [rules.openingBid];
  }
  const bids = candidates.filter((amount) => amount <= maxBid);

  let passBlockedBy: PassBlockReason | null = null;
  if (!hasBid) {
    if (lot.skipLocked) passBlockedBy = PassBlockReason.LastCardsForSlot;
    else if (seat.skipsLeft <= 0) passBlockedBy = PassBlockReason.NoSkipsLeft;
  }
  const canPass = passBlockedBy === null;

  return {
    seat: seatIndex,
    bids,
    maxBid,
    canPass,
    passCostsSkip: !hasBid && canPass,
    passBlockedBy,
    raiseBlockedByReserve: bids.length === 0,
  };
};

/**
 * What a shot clock should do when it runs out: pass when passing is allowed, otherwise make
 * the smallest legal bid. Returns null when no turn is pending.
 */
export const getTimeoutAction = (state: DraftState): DraftAction | null => {
  const options = getTurnOptions(state);
  if (!options) return null;
  if (options.canPass) return { type: "pass", seat: options.seat };
  return { type: "bid", seat: options.seat, amount: options.bids[0] };
};

/**
 * Identifies one decision point. UI timers and bot schedulers key on it so they act at most
 * once per turn, even if a render or app resume fires twice.
 */
export const getTurnKey = (state: DraftState): string | null => {
  const lot = state.lot;
  if (state.phase !== DraftPhase.Bidding || !lot || lot.turn === null) return null;
  return `${state.id}:${lot.number}:${lot.bids.length}:${lot.passed.length}:${lot.turn}`;
};

/**
 * Identifies whatever the table is waiting for: a seat's decision (the turn key) or moving past
 * a card that just resolved. Null once the draft is complete. Taps, timers and bots all carry
 * the step key they were created for, so a stale render or late callback cannot act twice.
 */
export const getStepKey = (state: DraftState): string | null => {
  if (state.phase === DraftPhase.Bidding) return getTurnKey(state);
  if (state.phase === DraftPhase.Resolved && state.lot) {
    return `${state.id}:${state.lot.number}:resolved`;
  }
  return null;
};

export const getDeckProgress = (state: DraftState) => ({
  /** 1-based position of the card on the block (or of the last card shown). */
  current: state.lot ? state.lot.deckIndex + 1 : state.nextDeckIndex,
  total: state.deck.length,
});

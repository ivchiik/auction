import assert from "node:assert/strict";

import { applyAction, createDraft } from "../draft";
import { createSinglePositionRules } from "../rules";
import { getTurnOptions } from "../selectors";
import {
  BotPersonality,
  DraftPhase,
  SeatKind,
  type DraftAction,
  type DraftState,
  type EngineCard,
  type RuleSet,
  type SeatConfig,
} from "../types";

export const NOW = 1_764_000_000_000;

/** Cards c01..cNN of one position with distinct, descending ratings starting at 99. */
export const makePool = (count: number, position = "pick", startRating = 99): EngineCard[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${position}-${String(index + 1).padStart(2, "0")}`,
    position,
    rating: startRating - index,
  }));

export type SeatSpec = "human" | BotPersonality;

export const makeSeats = (specs: readonly SeatSpec[]): SeatConfig[] =>
  specs.map((spec, index) => ({
    id: `seat-${index}`,
    name: spec === "human" ? `Player ${index + 1}` : `Bot ${index + 1}`,
    kind: spec === "human" ? SeatKind.Human : SeatKind.Bot,
    personality: spec === "human" ? null : spec,
  }));

export interface StartOptions {
  seats?: readonly SeatSpec[];
  pool?: EngineCard[];
  rules?: RuleSet;
  seed?: number;
}

export const startDraft = (options: StartOptions = {}): DraftState => {
  const seats = options.seats ?? ["human", "human"];
  const result = createDraft({
    packId: "test-pack",
    rules: options.rules ?? createSinglePositionRules(["pick"]),
    seats: makeSeats(seats),
    pool: options.pool ?? makePool(seats.length * 8),
    seed: options.seed ?? 42,
    now: NOW,
  });
  assert.ok(result.ok, result.ok ? "" : result.error.message);
  return result.value;
};

export const act = (state: DraftState, action: DraftAction): DraftState => {
  const result = applyAction(state, action, NOW);
  assert.ok(result.ok, result.ok ? "" : `${result.error.code}: ${result.error.message}`);
  return result.value;
};

export const turnOf = (state: DraftState): number => {
  const options = getTurnOptions(state);
  assert.ok(options, "expected a pending turn");
  return options.seat;
};

export const bidMin = (state: DraftState): DraftState => {
  const options = getTurnOptions(state);
  assert.ok(options && options.bids.length > 0, "expected a legal bid");
  return act(state, { type: "bid", seat: options.seat, amount: options.bids[0] });
};

export const pass = (state: DraftState): DraftState =>
  act(state, { type: "pass", seat: turnOf(state) });

export const advance = (state: DraftState): DraftState => act(state, { type: "advance" });

/** Advances through resolved lots until a lot needs a decision or the draft ends. */
export const toNextDecision = (state: DraftState): DraftState => {
  let current = state;
  while (current.phase === DraftPhase.Resolved) current = advance(current);
  return current;
};

/**
 * Scripted policy: `winner` takes every lot it can at the lowest price, everybody else
 * walks away whenever the rules allow it.
 */
export const playLotForWinner = (state: DraftState, winner: number): DraftState => {
  let current = state;
  while (current.phase === DraftPhase.Bidding) {
    const options = getTurnOptions(current);
    assert.ok(options);
    const hasBid = current.lot?.highBidder !== null;
    if (options.seat === winner) {
      current = options.bids.length > 0 ? bidMin(current) : pass(current);
    } else if (hasBid || options.canPass) {
      current = pass(current);
    } else {
      current = bidMin(current);
    }
  }
  return current;
};

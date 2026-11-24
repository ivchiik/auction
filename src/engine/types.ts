// Pure auction-draft domain types. Nothing in src/engine may import React Native, storage,
// timers, Math.random or Date.now: randomness and time are always injected by the caller.

/** Zero-based seat position around the table. Turn order and opener rotation follow it. */
export type SeatIndex = number;

export enum SeatKind {
  Human = "human",
  Bot = "bot",
}

export enum BotPersonality {
  /** Pays fair value and nothing more. */
  Accountant = "accountant",
  /** Overpays for stars and lets the rest go. */
  Shark = "shark",
  /** Misreads cards and bids on a whim. */
  Gambler = "gambler",
}

export enum DraftMode {
  Quick = "quick",
  Daily = "daily",
}

export enum DraftPhase {
  /** A lot is open and `lot.turn` must act. */
  Bidding = "bidding",
  /** The current lot just resolved; the caller decides when to `advance`. */
  Resolved = "resolved",
  /** Every roster is full. */
  Complete = "complete",
}

export enum LotOutcomeKind {
  /** Highest remaining bidder won the card. */
  Sold = "sold",
  /** Only one seat still had open spots, so it took the card at the forced-fill price. */
  ForcedFill = "forcedFill",
  /** Every eligible seat passed before an opening bid; the card is gone for good. */
  Discarded = "discarded",
  /** No seat had an open spot for this card's slot; it was skipped without an auction. */
  Unplaceable = "unplaceable",
}

export enum PassBlockReason {
  /** Passing before any bid costs a skip and this seat has none left. */
  NoSkipsLeft = "noSkipsLeft",
  /** Cards left for this slot equal the open spots for it, so the card cannot be discarded. */
  LastCardsForSlot = "lastCardsForSlot",
}

export enum EngineErrorCode {
  InvalidConfig = "invalidConfig",
  InvalidAction = "invalidAction",
  NotBidding = "notBidding",
  NotResolved = "notResolved",
  DraftComplete = "draftComplete",
  NotYourTurn = "notYourTurn",
  BidNotAllowed = "bidNotAllowed",
  BidOverLimit = "bidOverLimit",
  PassNotAllowed = "passNotAllowed",
  /** Defensive: the deck ran out with spots open. Unreachable from any state that validates. */
  DeckExhausted = "deckExhausted",
  /** A timer or bot acted for a decision that has already been made. */
  StaleTurn = "staleTurn",
}

/**
 * One kind of roster spot. Single-position packs use one slot with `count` 5; mixed lineups
 * (future) use several slots whose `accepts` lists must not overlap.
 */
export interface SlotRule {
  id: string;
  count: number;
  /** Card positions this slot accepts. */
  accepts: readonly string[];
}

export interface RuleSet {
  /** Starting play-money bankroll per seat. */
  budget: number;
  slots: readonly SlotRule[];
  /** Opening passes each seat may spend over the whole draft. */
  skipsPerSeat: number;
  /** Smallest legal opening bid; openings step up from it like raises ($1, $2 or $3). */
  openingBid: number;
  /** Allowed raises over the current bid, ascending (e.g. 1, 2, 3). */
  raiseSteps: readonly number[];
  /** Price paid when the only seat with open spots takes a card. */
  forcedFillPrice: number;
}

/** The engine's view of a card: identity, roster position and the hidden rating. */
export interface EngineCard {
  id: string;
  position: string;
  rating: number;
}

export interface SeatConfig {
  id: string;
  name: string;
  kind: SeatKind;
  /** Required for bots, ignored for humans. */
  personality?: BotPersonality | null;
}

export interface RosterEntry {
  cardId: string;
  slotId: string;
  price: number;
  /** 1-based number of the lot that produced this pick. */
  lotNumber: number;
}

export interface SeatState {
  id: string;
  name: string;
  kind: SeatKind;
  personality: BotPersonality | null;
  money: number;
  skipsLeft: number;
  roster: RosterEntry[];
}

export interface Bid {
  seat: SeatIndex;
  amount: number;
}

export interface LotOutcome {
  kind: LotOutcomeKind;
  seat: SeatIndex | null;
  price: number;
}

export interface LotState {
  /** 1-based lot counter; equals the number of history records once this lot resolves. */
  number: number;
  deckIndex: number;
  cardId: string;
  slotId: string;
  opener: SeatIndex;
  /** Seat that must act, or null once resolved. */
  turn: SeatIndex | null;
  /** Seats with an open spot for this card when the lot opened. */
  eligible: SeatIndex[];
  /** Seats that passed and are out for this card. */
  passed: SeatIndex[];
  highBid: number;
  highBidder: SeatIndex | null;
  bids: Bid[];
  /** True when the card may not be discarded because cards for its slot ran short. */
  skipLocked: boolean;
  outcome: LotOutcome | null;
}

export interface LotRecord {
  number: number;
  deckIndex: number;
  cardId: string;
  slotId: string;
  kind: LotOutcomeKind;
  seat: SeatIndex | null;
  price: number;
  opener: SeatIndex | null;
  bidCount: number;
}

export const DRAFT_SCHEMA_VERSION = 1;

export interface DraftState {
  schemaVersion: typeof DRAFT_SCHEMA_VERSION;
  id: string;
  packId: string;
  mode: DraftMode;
  /** Local calendar day (YYYY-MM-DD) for daily drafts, otherwise null. */
  dailyKey: string | null;
  seed: number;
  createdAt: number;
  updatedAt: number;
  rules: RuleSet;
  /** Every card of the pack. Bots may read ratings ("like a fan would"), never the deck order. */
  pool: EngineCard[];
  /** Dealt card ids in reveal order. */
  deck: string[];
  /** Index of the next card to reveal. */
  nextDeckIndex: number;
  /** Rotation cursor for the next opening seat. */
  nextOpener: SeatIndex;
  seats: SeatState[];
  lot: LotState | null;
  history: LotRecord[];
  phase: DraftPhase;
}

export type DraftAction =
  | { type: "bid"; seat: SeatIndex; amount: number }
  | { type: "pass"; seat: SeatIndex }
  | { type: "advance" };

export interface EngineError {
  code: EngineErrorCode;
  message: string;
}

export type EngineResult<T> = { ok: true; value: T } | { ok: false; error: EngineError };

/** Everything the active seat may do right now, with reasons for anything it may not. */
export interface TurnOptions {
  seat: SeatIndex;
  /** Legal bid totals in ascending order (empty when a raise is impossible). */
  bids: number[];
  /** Highest bid this seat can make while keeping $1 for every other open spot. */
  maxBid: number;
  canPass: boolean;
  /** True when passing now spends one of the seat's skips. */
  passCostsSkip: boolean;
  passBlockedBy: PassBlockReason | null;
  /** True when the seat cannot raise because its reserve-limited maximum is too low. */
  raiseBlockedByReserve: boolean;
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next: () => number;
  /** Uniform integer in [min, max]. */
  int: (min: number, max: number) => number;
}

import { createRng, deriveSeed } from "./rng";
import { getSlot, minSpotPrice, openSpots } from "./rules";
import { countOpenForSlot, countRemainingForSlot, getCard, getTurnOptions } from "./selectors";
import {
  BotPersonality,
  SeatKind,
  type DraftAction,
  type DraftState,
  type Rng,
  type SeatIndex,
  type TurnOptions,
} from "./types";

/** Gambler misreads every card by up to this many rating points (fixed per card and seat). */
export const GAMBLER_MISREAD_POINTS = 12;
/** Cards at or above this share of their slot's pool ratings count as stars for the Shark. */
export const STAR_PERCENTILE = 0.8;

export interface CardValuation {
  /** Rating the bot believes the card has (the Gambler misreads). */
  perceivedRating: number;
  /** Rating the bot expects to end up with if it lets this card go. */
  replacementRating: number;
  /** (perceived - replacement) in units of the slot's rating spread. */
  relative: number;
  /** Dollars this card is worth to this seat at this table. */
  fairPrice: number;
  isStar: boolean;
}

const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

const standardDeviation = (values: readonly number[]): number => {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Deterministic randomness for one bot decision; replaying the same draft replays the bots. */
export const botRngFor = (state: DraftState): Rng | null => {
  const lot = state.lot;
  if (!lot || lot.turn === null) return null;
  return createRng(
    deriveSeed(state.seed, "bot", lot.number, lot.bids.length, lot.passed.length, lot.turn)
  );
};

const misreadFor = (state: DraftState, seat: SeatIndex, cardId: string): number => {
  const rng = createRng(deriveSeed(state.seed, "gambler-misread", seat, cardId));
  return (rng.next() * 2 - 1) * GAMBLER_MISREAD_POINTS;
};

/**
 * Prices the card on the block for `seat`. Uses only what a fan at the table would know: the
 * pack's ratings, the cards already shown, every seat's money and open spots and how many cards
 * are left. It never reads which cards are still in the deck or their order.
 */
export const valueCurrentCard = (state: DraftState, seat: SeatIndex): CardValuation | null => {
  const lot = state.lot;
  if (!lot) return null;
  const card = getCard(state, lot.cardId);
  const slot = getSlot(state.rules, lot.slotId);
  if (!card || !slot) return null;
  const me = state.seats[seat];

  const slotPool = state.pool.filter((entry) => slot.accepts.includes(entry.position));
  const poolRatings = slotPool.map((entry) => entry.rating);
  const shown = new Set(state.history.map((record) => record.cardId));
  shown.add(card.id);
  const unseen = slotPool
    .filter((entry) => !shown.has(entry.id))
    .map((entry) => entry.rating)
    .sort((a, b) => b - a);

  const misread = me.personality === BotPersonality.Gambler ? misreadFor(state, seat, card.id) : 0;
  const perceivedRating = card.rating + misread;

  // Deep supply means good alternatives later; scarce supply means take what comes. The card a
  // seat ends up with instead is roughly the average of the best `takenShare` of what is unseen.
  const cardsAfterThis = countRemainingForSlot(state, slot.id, lot.deckIndex + 1);
  const spotsAfterThis = Math.max(0, countOpenForSlot(state, slot.id) - 1);
  const takenShare = cardsAfterThis > 0 ? Math.min(1, spotsAfterThis / cardsAfterThis) : 0;
  const likelyBought = unseen.slice(0, Math.ceil(unseen.length * takenShare));
  const replacementRating = likelyBought.length > 0 ? mean(likelyBought) : Math.min(...poolRatings);

  const spread = Math.max(4, standardDeviation(poolRatings));
  const relative = (perceivedRating - replacementRating) / spread;

  // Pace spending on this seat's own dollars per open spot, nudged by the money still on the
  // table ("pays more when cash is loose"): a card as good as the replacement is worth one
  // spot's share of the budget, better cards more, worse cards less.
  const drafting = state.seats.filter((entry) => openSpots(entry, state.rules) > 0);
  const tableMoney = drafting.reduce((total, entry) => total + entry.money, 0);
  const tableSpots = drafting.reduce((total, entry) => total + openSpots(entry, state.rules), 0);
  const floorPrice = minSpotPrice(state.rules);
  const marketPerSpot = tableSpots > 0 ? tableMoney / tableSpots : floorPrice;
  const mySpots = Math.max(1, openSpots(me, state.rules));
  const basePrice = (me.money / mySpots) ** 0.8 * Math.max(floorPrice, marketPerSpot) ** 0.2;

  let fairPrice = basePrice * Math.exp(0.75 * relative);
  if (mySpots === 1) {
    // Last spot: whatever is left can only buy this card or the ones after it.
    fairPrice = Math.max(fairPrice, me.money * clamp(0.6 + 0.4 * relative, 0, 1));
  }
  const sortedPool = [...poolRatings].sort((a, b) => a - b);
  const starIndex = Math.min(
    sortedPool.length - 1,
    Math.floor(sortedPool.length * STAR_PERCENTILE)
  );
  const isStar = perceivedRating >= sortedPool[starIndex];

  return { perceivedRating, replacementRating, relative, fairPrice, isStar };
};

interface Temperament {
  willingness: number;
  wantsToSkip: boolean;
  pickBid: (affordable: readonly number[]) => number;
}

const temperamentFor = (
  state: DraftState,
  seat: SeatIndex,
  valuation: CardValuation,
  rng: Rng
): Temperament => {
  const lot = state.lot;
  const cardsAfterThis = lot ? countRemainingForSlot(state, lot.slotId, lot.deckIndex + 1) : 0;
  const spotsAfterThis = lot ? Math.max(0, countOpenForSlot(state, lot.slotId) - 1) : 0;
  const cardsToSpare = cardsAfterThis > spotsAfterThis;
  const smallest = (affordable: readonly number[]) => affordable[0];

  switch (state.seats[seat].personality) {
    case BotPersonality.Shark: {
      if (valuation.isStar) {
        const willingness = valuation.fairPrice * 1.5 + 1;
        return {
          willingness,
          wantsToSkip: false,
          // Jump the price on a star when there is room, to scare the table off.
          pickBid: (affordable) =>
            affordable.length > 1 && willingness - affordable[0] >= 3
              ? affordable[1]
              : affordable[0],
        };
      }
      return {
        willingness: valuation.fairPrice * 0.55,
        wantsToSkip: cardsToSpare,
        pickBid: smallest,
      };
    }
    case BotPersonality.Gambler: {
      const whim = 0.75 + rng.next() * 0.6;
      return {
        willingness: valuation.fairPrice * whim,
        wantsToSkip: cardsToSpare && valuation.relative < 0.2 && rng.next() < 0.3,
        pickBid: (affordable) => affordable[rng.int(0, affordable.length - 1)],
      };
    }
    case BotPersonality.Accountant:
    default:
      return {
        willingness: valuation.fairPrice,
        wantsToSkip: cardsToSpare && valuation.relative < -0.6,
        pickBid: smallest,
      };
  }
};

/**
 * Chooses a legal action for the bot whose turn it is. Bots obey exactly the same rules as
 * people: every choice is picked from `getTurnOptions`, and the reducer re-validates it anyway.
 */
export const chooseBotAction = (state: DraftState, rng: Rng): DraftAction | null => {
  const options: TurnOptions | null = getTurnOptions(state);
  if (!options) return null;
  const seat = state.seats[options.seat];
  if (seat.kind !== SeatKind.Bot) return null;

  const valuation = valueCurrentCard(state, options.seat);
  const hasBid = state.lot?.highBidder !== null;
  const pass: DraftAction = { type: "pass", seat: options.seat };
  const bid = (amount: number): DraftAction => ({ type: "bid", seat: options.seat, amount });

  if (!valuation) {
    if (options.canPass) return pass;
    return bid(options.bids[0]);
  }
  const temperament = temperamentFor(state, options.seat, valuation, rng);

  const affordable = options.bids.filter((amount) => amount <= temperament.willingness);

  if (!hasBid) {
    if (options.canPass && temperament.wantsToSkip) return pass;
    if (options.bids.length === 0) return pass;
    // Opening: the floor unless the temperament says to open higher.
    return bid(affordable.length > 0 ? temperament.pickBid(affordable) : options.bids[0]);
  }

  if (affordable.length === 0) return pass;
  return bid(temperament.pickBid(affordable));
};

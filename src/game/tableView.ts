import { getCatalogCard, toPublicCard, type ContentPack, type PublicCard } from "data";
import {
  getDeckProgress,
  getStepKey,
  getTurnOptions,
  maxBidFor,
  openSpots,
  openSpotsForSlot,
  type BotPersonality,
  type DraftPhase,
  type DraftState,
  type LotOutcome,
  type SeatKind,
  type SlotRule,
  type TurnOptions,
} from "engine";

export interface SeatPickView {
  cardId: string;
  name: string;
  subtitle: string;
  price: number;
  /** Roster slot the pick fills, and the card's own position (public, shown on every card). */
  slotId: string;
  position: string;
}

export interface SeatView {
  index: number;
  id: string;
  name: string;
  kind: SeatKind;
  personality: BotPersonality | null;
  money: number;
  spent: number;
  openSpots: number;
  rosterSize: number;
  skipsLeft: number;
  maxBid: number;
  isTurn: boolean;
  isHighBidder: boolean;
  hasPassed: boolean;
  isDone: boolean;
  /** False while a card is up that this seat has no open spot for (it sits that card out). */
  hasRoomForLot: boolean;
  /** Open spots per slot id; lineups show them position by position. */
  openBySlot: Record<string, number>;
  picks: SeatPickView[];
}

export interface LotView {
  card: PublicCard;
  /** The slot this card fills. */
  slotId: string;
  number: number;
  progress: { current: number; total: number };
  highBid: number;
  highBidder: number | null;
  opener: number;
  passed: number[];
  outcome: LotOutcome | null;
  skipLocked: boolean;
}

export interface TableView {
  phase: DraftPhase;
  stepKey: string | null;
  seats: SeatView[];
  lot: LotView | null;
  turn: TurnOptions | null;
  rosterSize: number;
  /** The pack's roster slots in order; more than one means a lineup. */
  slots: readonly SlotRule[];
}

const placeholderCard = (cardId: string): PublicCard => ({
  id: cardId,
  name: cardId,
  subtitle: "",
  note: "",
  position: "",
  accentColor: null,
  image: null,
  side: null,
});

/**
 * Everything the table screens may show while ratings are hidden: public card data, money,
 * spots, skips, bids and outcomes. Built from `toPublicCard`, so it carries no rating or basis.
 */
export const buildTableView = (draft: DraftState, pack: ContentPack): TableView => {
  const publicCard = (cardId: string) => {
    const card = getCatalogCard(pack, cardId);
    return card ? toPublicCard(card) : placeholderCard(cardId);
  };
  const lot = draft.lot;
  const rosterSize = draft.rules.slots.reduce((total, slot) => total + slot.count, 0);
  const seats = draft.seats.map((seat, index): SeatView => {
    const spots = openSpots(seat, draft.rules);
    return {
      index,
      id: seat.id,
      name: seat.name,
      kind: seat.kind,
      personality: seat.personality,
      money: seat.money,
      spent: draft.rules.budget - seat.money,
      openSpots: spots,
      rosterSize,
      skipsLeft: seat.skipsLeft,
      maxBid: maxBidFor(seat, draft.rules),
      isTurn: lot?.turn === index,
      isHighBidder: lot?.highBidder === index,
      hasPassed: !!lot?.passed.includes(index),
      isDone: spots === 0,
      hasRoomForLot: !lot || lot.eligible.includes(index),
      openBySlot: Object.fromEntries(
        draft.rules.slots.map((slot) => [slot.id, openSpotsForSlot(seat, slot)])
      ),
      picks: seat.roster.map((entry) => {
        const card = publicCard(entry.cardId);
        return {
          cardId: entry.cardId,
          name: card.name,
          subtitle: card.subtitle,
          price: entry.price,
          slotId: entry.slotId,
          position: card.position,
        };
      }),
    };
  });

  return {
    phase: draft.phase,
    stepKey: getStepKey(draft),
    seats,
    rosterSize,
    slots: draft.rules.slots,
    turn: getTurnOptions(draft),
    lot: lot
      ? {
          card: publicCard(lot.cardId),
          slotId: lot.slotId,
          number: lot.number,
          progress: getDeckProgress(draft),
          highBid: lot.highBid,
          highBidder: lot.highBidder,
          opener: lot.opener,
          passed: [...lot.passed],
          outcome: lot.outcome,
          skipLocked: lot.skipLocked,
        }
      : null,
  };
};

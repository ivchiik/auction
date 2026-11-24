import {
  useIsFocused,
  useNavigation,
  usePreventRemove,
  type NavigationAction,
} from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useTranslation } from "react-i18next";

import { getPack } from "data";
import {
  DraftPhase,
  EngineErrorCode,
  LotOutcomeKind,
  PassBlockReason,
  SeatKind,
  type DraftAction,
} from "engine";
import { buildTableView, type SeatView } from "game";
import { HapticKind, useAppIsActive, useHaptic, useReducedMotion } from "hooks";
import {
  positionLabels,
  slotLabels,
  topicNameKey,
  type TranslationKey,
  type TranslationValues,
} from "i18n";
import { RootRoute, type RootNavigation } from "navigation";
import { useGameStore } from "stores";

import { useTableScheduler } from "./useTableScheduler";

export enum AuctionOverlay {
  Roster = "roster",
  Rules = "rules",
  Leave = "leave",
}

export interface BidButtonModel {
  step: number;
  amount: number;
  isEnabled: boolean;
  label: string;
  accessibilityLabel: string;
  accessibilityHint: string;
}

export interface OutcomeModel {
  kind: LotOutcomeKind;
  seat: number | null;
  title: string;
  detail: string;
  /** Two or three characters for the stamp on the card ("$6", "$1", "Gone"). */
  stamp: string;
  accessibilityLabel: string;
}

export interface BannerModel {
  seat: number | null;
  title: string;
  line: string | null;
  isHumanTurn: boolean;
  /** One spoken sentence from its own i18n template, so title and line never double a stop. */
  accessibilityLabel: string;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

const CHOICE_KEYS: Record<number, TranslationKey> = {
  1: "auction.choices_1",
  2: "auction.choices_2",
  3: "auction.choices_3",
};

const PASS_BLOCK_KEYS: Record<PassBlockReason, TranslationKey> = {
  [PassBlockReason.NoSkipsLeft]: "auction.passNoSkips",
  [PassBlockReason.LastCardsForSlot]: "auction.passLastCards",
};

export const useAuction = () => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const haptic = useHaptic();
  const isFocused = useIsFocused();
  const isAppActive = useAppIsActive();
  const isReducedMotion = useReducedMotion();
  const session = useGameStore((state) => state.data.session);
  const dispatchForStep = useGameStore((state) => state.dispatchForStep);
  const [overlay, setOverlay] = useState<AuctionOverlay | null>(null);
  const [leaveAction, setLeaveAction] = useState<NavigationAction | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const draft = session?.draft ?? null;
  const pack = draft ? getPack(draft.packId) : null;
  const view = useMemo(() => (draft && pack ? buildTableView(draft, pack) : null), [draft, pack]);
  const isLive = !!draft && draft.phase !== DraftPhase.Complete && !session?.revealed;

  const { getShotClockMs } = useTableScheduler({
    isActive: isFocused && isAppActive && overlay === null && isLive && !isLeaving,
    shotClockMs: session?.options.shotClockMs ?? null,
  });

  // Leaving keeps the draft saved; the system back gesture and Android back ask first.
  usePreventRemove(isLive && !isLeaving, ({ data }) => {
    setLeaveAction(data.action);
    setOverlay(AuctionOverlay.Leave);
  });

  // React Navigation 7: `navigate` to an earlier screen pushes a new copy, so go back with popTo.
  useEffect(() => {
    if (!isLeaving) return;
    if (leaveAction) navigation.dispatch(leaveAction);
    else navigation.popTo(RootRoute.MAIN);
  }, [isLeaving, leaveAction, navigation]);

  useEffect(() => {
    if (!isFocused) return;
    if (!session) navigation.popTo(RootRoute.MAIN);
    else if (session.draft.phase === DraftPhase.Complete) navigation.replace(RootRoute.VERDICT);
  }, [isFocused, session, navigation]);

  const lot = view?.lot ?? null;
  const seats = useMemo<SeatView[]>(() => view?.seats ?? [], [view]);
  const nameOf = useCallback(
    (seat: number | null) => (seat === null ? "" : (seats[seat]?.name ?? "")),
    [seats]
  );
  const turnSeat = view?.turn ? seats[view.turn.seat] : null;
  const isHumanTurn = !!turnSeat && turnSeat.kind === SeatKind.Human;
  const hasBid = !!lot && lot.highBidder !== null;
  const isResolved = view?.phase === DraftPhase.Resolved;

  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {}),
    [t]
  );
  // Lineups (several slots) and packs whose slot takes several positions name the card's position.
  const slots = view?.slots ?? null;
  const isLineup = !!slots && slots.length > 1;
  const lotSlot = lot && slots ? (slots.find((slot) => slot.id === lot.slotId) ?? null) : null;
  const lotPosition = useMemo(() => {
    if (!lot || !slots) return null;
    const positions = new Set(slots.flatMap((slot) => slot.accepts));
    return positions.size > 1 ? positionLabels(lot.card.position, translate) : null;
  }, [lot, slots, translate]);
  const lotSlotShort = lotSlot && isLineup ? slotLabels(lotSlot, translate).short : null;

  const outcome = useMemo<OutcomeModel | null>(() => {
    if (!lot?.outcome || !isResolved) return null;
    const { kind, seat, price } = lot.outcome;
    const name = nameOf(seat);
    const card = lot.card.name;
    if (kind === LotOutcomeKind.Sold) {
      return {
        kind,
        seat,
        title: t("auction.soldTo", { name }),
        detail: t("auction.soldFor", { price }),
        stamp: t("auction.soldFor", { price }),
        accessibilityLabel: t("auction.soldLabel", { card, name, price }),
      };
    }
    if (kind === LotOutcomeKind.ForcedFill) {
      return {
        kind,
        seat,
        title: t("auction.forced", { name }),
        detail: t("auction.forcedBody"),
        stamp: t("auction.soldFor", { price }),
        accessibilityLabel: t("auction.forcedLabel", { name, card }),
      };
    }
    return {
      kind,
      seat: null,
      title: t("auction.discarded"),
      detail: t("auction.discardedBody"),
      stamp: t("auction.stampGone"),
      accessibilityLabel: t("auction.discardedLabel", { card }),
    };
  }, [lot, isResolved, nameOf, t]);

  const banner = useMemo<BannerModel | null>(() => {
    if (outcome) {
      return {
        seat: outcome.seat,
        title: outcome.title,
        line: outcome.detail,
        isHumanTurn: false,
        accessibilityLabel: outcome.accessibilityLabel,
      };
    }
    if (!turnSeat) return null;
    // In a lineup the open spots that matter are the ones for this card's position.
    const line = (
      lotSlot && lotSlotShort
        ? [
            t("auction.moneyLeft", { money: turnSeat.money }),
            t("auction.slotOpen", {
              short: lotSlotShort,
              open: turnSeat.openBySlot[lotSlot.id] ?? 0,
              count: lotSlot.count,
            }),
            t("auction.skips", { count: turnSeat.skipsLeft }),
          ]
        : [
            t("auction.moneyLine", { money: turnSeat.money, count: turnSeat.openSpots }),
            t("auction.skips", { count: turnSeat.skipsLeft }),
          ]
    ).join(" · ");
    const name = turnSeat.name;
    return {
      seat: turnSeat.index,
      title: isHumanTurn ? t("auction.yourMove", { name }) : t("auction.thinking", { name }),
      line,
      isHumanTurn,
      accessibilityLabel: isHumanTurn
        ? t("auction.yourMoveLabel", { name, line })
        : t("auction.thinkingLabel", { name, line }),
    };
  }, [outcome, turnSeat, isHumanTurn, lotSlot, lotSlotShort, t]);

  const bidButtons = useMemo<BidButtonModel[]>(() => {
    if (!draft || !lot) return [];
    const steps = draft.rules.raiseSteps;
    const base = hasBid ? lot.highBid : draft.rules.openingBid - steps[0];
    const legal = view?.turn?.bids ?? [];
    const max = view?.turn?.maxBid ?? 0;
    return steps.map((step) => {
      const amount = base + step;
      const isEnabled = isHumanTurn && legal.includes(amount);
      return {
        step,
        amount,
        isEnabled,
        label: t("auction.bid", { step }),
        accessibilityLabel: t("auction.bidLabel", { amount }),
        accessibilityHint: !isHumanTurn
          ? ""
          : isEnabled
            ? hasBid
              ? t("auction.bidHint", { step })
              : t("auction.openHint", { amount })
            : t("auction.bidUnavailable", { max }),
      };
    });
  }, [draft, lot, hasBid, view, isHumanTurn, t]);

  const bidHint = useMemo(() => {
    if (!isHumanTurn || !view?.turn) return null;
    const { bids, maxBid } = view.turn;
    if (bids.length === 0) return t("auction.reserveBlocked");
    // Everyone else passed before an opening: the engine offers only the floor.
    if (!hasBid && bids.length === 1 && maxBid > bids[0]) {
      return t("auction.choicesOnly", { a: bids[0] });
    }
    const [a, b, c] = bids;
    return t(CHOICE_KEYS[Math.min(3, bids.length)], { a, b, c, max: maxBid });
  }, [isHumanTurn, view, hasBid, t]);

  const pass = useMemo(() => {
    const turn = view?.turn;
    if (!isHumanTurn || !turn || !turnSeat)
      return { label: t("auction.pass"), isEnabled: false, hint: null };
    if (turn.passBlockedBy) {
      return {
        label: t("auction.pass"),
        isEnabled: false,
        hint: t(PASS_BLOCK_KEYS[turn.passBlockedBy]),
      };
    }
    if (turn.passCostsSkip) {
      return {
        label: t("auction.passSkip"),
        isEnabled: true,
        hint: t("auction.passSkipHint", { left: turnSeat.skipsLeft }),
      };
    }
    return { label: t("auction.pass"), isEnabled: true, hint: t("auction.passFreeHint") };
  }, [view, isHumanTurn, turnSeat, t]);

  // Spoken and felt feedback when a card resolves.
  const announcedLotRef = useRef<number | null>(null);
  useEffect(() => {
    if (!outcome || !lot || announcedLotRef.current === lot.number) return;
    announcedLotRef.current = lot.number;
    AccessibilityInfo.announceForAccessibility(outcome.accessibilityLabel);
    const winner = outcome.seat !== null ? seats[outcome.seat] : null;
    if (winner?.kind === SeatKind.Human) haptic(HapticKind.Win);
  }, [outcome, lot, seats, haptic]);

  const announcedTurnRef = useRef<string | null>(null);
  useEffect(() => {
    const key = view?.stepKey ?? null;
    if (!key || !isHumanTurn || !banner || announcedTurnRef.current === key) return;
    announcedTurnRef.current = key;
    AccessibilityInfo.announceForAccessibility(banner.title);
  }, [view, isHumanTurn, banner]);

  /** Every tap carries the step it was rendered for; a stale render or double tap is refused. */
  const act = useCallback(
    (action: DraftAction, kind: HapticKind) => {
      const stepKey = view?.stepKey;
      if (!stepKey) return;
      const result = dispatchForStep(stepKey, action);
      if (result.ok) haptic(kind);
      else if (result.error.code !== EngineErrorCode.StaleTurn) haptic(HapticKind.Warning);
    },
    [view, dispatchForStep, haptic]
  );

  const handleBid = useCallback(
    (amount: number) => {
      if (!view?.turn) return;
      act({ type: "bid", seat: view.turn.seat, amount }, HapticKind.Bid);
    },
    [view, act]
  );

  const handlePass = useCallback(() => {
    if (!view?.turn) return;
    act({ type: "pass", seat: view.turn.seat }, HapticKind.Tap);
  }, [view, act]);

  const handleNext = useCallback(() => act({ type: "advance" }, HapticKind.Tap), [act]);

  const topicName = pack ? t(topicNameKey(pack.topic)) : "";
  const progress = lot?.progress ?? null;

  return {
    isReady: !!view && !!pack && !!lot,
    pack,
    view,
    lot,
    seats,
    topicName,
    cardOfLabel: progress
      ? t("auction.cardOf", { current: pad2(progress.current), total: pad2(progress.total) })
      : "",
    contextLabel: pack ? t("auction.context", { topic: topicName, pack: pack.title }) : "",
    cardAccessibilityLabel: lot
      ? lotPosition
        ? t("auction.cardLabelPosition", {
            position: lotPosition.name,
            name: lot.card.name,
            subtitle: lot.card.subtitle,
            note: lot.card.note,
          })
        : t("auction.cardLabel", {
            name: lot.card.name,
            subtitle: lot.card.subtitle,
            note: lot.card.note,
          })
      : "",
    /** "Goalkeeper" on the card when the pack mixes positions; null for one-position packs. */
    positionLabel: lotPosition
      ? lotPosition.name.charAt(0).toUpperCase() + lotPosition.name.slice(1)
      : null,
    /** Short tag for "No GK spot" on seats that sit this card out (lineups only). */
    lotTag: lotSlotShort,
    slots: slots ?? [],
    amountLabel: t("common.dollars", { amount: lot?.highBid ?? 0 }),
    // Derived from the live lot only: before any bid there is no leader to name, and the exact
    // legal amounts are in the bid hint, so nothing here can contradict the current turn.
    leaderLine:
      lot && hasBid ? t("auction.leading", { name: nameOf(lot.highBidder) }) : t("auction.noBids"),
    nudge:
      hasBid && isHumanTurn && lot?.highBidder !== view?.turn?.seat ? t("auction.nudge") : null,
    outcome,
    banner,
    bidButtons,
    bidHint,
    pass,
    isResolved,
    isHumanTurn,
    hasShotClock: !!session?.options.shotClockMs,
    getShotClockMs,
    isReducedMotion,
    overlay,
    handleBid,
    handlePass,
    handleNext,
    handleOpenRoster: () => setOverlay(AuctionOverlay.Roster),
    handleOpenRules: () => setOverlay(AuctionOverlay.Rules),
    handleRequestLeave: () => {
      setLeaveAction(null);
      setOverlay(AuctionOverlay.Leave);
    },
    handleCloseOverlay: () => setOverlay(null),
    handleConfirmLeave: () => {
      setOverlay(null);
      setIsLeaving(true);
    },
  };
};

import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, Share } from "react-native";
import { useTranslation } from "react-i18next";

import { getPack } from "data";
import { DraftMode } from "engine";
import { buildShareText, buildTableView, type HistorySeat } from "game";
import { HapticKind, useHaptic, usePickPositions, useReducedMotion } from "hooks";
import {
  formatShortDateKey,
  gradeLineKey,
  type TranslationKey,
  type TranslationValues,
} from "i18n";
import { MainTab, RootRoute, type RootNavigation } from "navigation";
import { useGameStore } from "stores";

const COUNT_UP_MS = 900;

export const useVerdict = () => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const haptic = useHaptic();
  const isReducedMotion = useReducedMotion();
  const isFocused = useIsFocused();
  const session = useGameStore((state) => state.data.session);
  const history = useGameStore((state) => state.data.history);
  const reveal = useGameStore((state) => state.reveal);
  const closeSession = useGameStore((state) => state.closeSession);
  const [isGradeHelpOpen, setIsGradeHelpOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  /** 0→1 while the scores count up after a reveal; null means show final numbers. */
  const [revealProgress, setRevealProgress] = useState<number | null>(null);
  const [counter] = useState(() => new Animated.Value(0));

  const draft = session?.draft ?? null;
  const pack = draft ? getPack(draft.packId) : null;
  const isRevealed = !!session?.revealed;
  const isDaily = draft?.mode === DraftMode.Daily;
  const positionOf = usePickPositions(draft?.packId ?? null);
  const record = useMemo(
    () => (isRevealed && draft ? (history.find((entry) => entry.id === draft.id) ?? null) : null),
    [isRevealed, draft, history]
  );
  const preView = useMemo(
    () => (!isRevealed && draft && pack ? buildTableView(draft, pack) : null),
    [isRevealed, draft, pack]
  );

  useEffect(() => {
    if (isFocused && !session) navigation.popTo(RootRoute.MAIN);
  }, [isFocused, session, navigation]);

  const winners = record?.seats.filter((seat) => seat.isWinner) ?? [];
  const lead = winners[0] ?? null;
  const score = lead?.totalRating ?? 0;

  const handleReveal = useCallback(() => {
    if (!reveal()) return;
    haptic(HapticKind.Win);
    if (isReducedMotion) return;
    // Count up from zero once, on the reveal itself (not when returning to a revealed verdict).
    setRevealProgress(0);
    counter.setValue(0);
    const listener = counter.addListener(({ value }) => setRevealProgress(value));
    Animated.timing(counter, { toValue: 1, duration: COUNT_UP_MS, useNativeDriver: false }).start(
      () => {
        counter.removeListener(listener);
        setRevealProgress(null);
      }
    );
  }, [reveal, haptic, isReducedMotion, counter]);

  useEffect(() => () => counter.removeAllListeners(), [counter]);

  const displayPoints = useCallback(
    (seat: HistorySeat) =>
      revealProgress === null ? seat.totalRating : Math.round(seat.totalRating * revealProgress),
    [revealProgress]
  );

  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {}),
    [t]
  );

  const handleShare = useCallback(async () => {
    if (!record) return;
    try {
      setShareError(null);
      await Share.share({ message: buildShareText(record, translate, formatShortDateKey) });
    } catch {
      setShareError(t("verdict.shareFailed"));
    }
  }, [record, translate, t]);

  const handlePlayAgain = useCallback(() => {
    if (!draft || !session) return;
    const seats = draft.seats.map((seat) => ({
      kind: seat.kind,
      personality: seat.personality,
      name: seat.name,
    }));
    const shotClock = !!session.options.shotClockMs;
    closeSession();
    navigation.reset({
      index: 1,
      routes: [
        { name: RootRoute.MAIN },
        { name: RootRoute.SETUP, params: { packId: draft.packId, seats, shotClock } },
      ],
    });
  }, [draft, session, closeSession, navigation]);

  const leaveTo = useCallback(
    (tab: MainTab) => {
      closeSession();
      navigation.reset({ index: 0, routes: [{ name: RootRoute.MAIN, params: { tab } }] });
    },
    [closeSession, navigation]
  );

  const steal = record?.bestBuy ?? null;
  const overpay = record?.biggestOverpay ?? null;

  return {
    isReady: !!draft && !!pack,
    isRevealed,
    isDaily,
    pack,
    preView,
    record,
    positionOf,
    winnerTitle: record
      ? record.isTie || winners.length > 1
        ? t("verdict.tie")
        : t("verdict.winner", { name: lead?.name ?? "" })
      : "",
    scoreLabel: String(revealProgress === null ? score : Math.round(score * revealProgress)),
    gradeLine: lead ? t(gradeLineKey(lead.grade)) : "",
    displayPoints,
    steal: steal
      ? {
          title: t("verdict.stealTitle"),
          body: t("verdict.stealBody", {
            card: steal.name,
            name: record?.seats[steal.seat]?.name ?? "",
            price: steal.price,
            value: Math.round(steal.tableValue),
          }),
        }
      : null,
    overpay: overpay
      ? {
          title: t("verdict.overpayTitle"),
          body: t("verdict.overpayBody", {
            card: overpay.name,
            name: record?.seats[overpay.seat]?.name ?? "",
            price: overpay.price,
            value: Math.round(overpay.tableValue),
          }),
        }
      : null,
    shareError,
    isGradeHelpOpen,
    handleReveal,
    handleShare,
    handlePlayAgain,
    handleDailyHome: () => leaveTo(MainTab.Daily),
    handleHome: () => leaveTo(MainTab.Play),
    /** Before the reveal: step away; the draft stays and Home offers "See the verdict". */
    handleLeaveForNow: () => navigation.popTo(RootRoute.MAIN),
    handleOpenGradeHelp: () => setIsGradeHelpOpen(true),
    handleCloseGradeHelp: () => setIsGradeHelpOpen(false),
  };
};

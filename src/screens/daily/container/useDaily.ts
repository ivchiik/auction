import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getPack, type TopicId } from "data";
import { DraftMode, DraftPhase, SeatKind, type BotPersonality } from "engine";
import {
  buildDailyDraftInput,
  DailyTopicState,
  getDailyBoard,
  SessionBlock,
  SHOT_CLOCK_MS,
  type DailyTopicStatus,
} from "game";
import {
  formatLongDate,
  formatShortDateKey,
  personalityBlurbKey,
  personalityNameKey,
  topicDailyKey,
  topicNameKey,
} from "i18n";
import { RootRoute, type RootNavigation } from "navigation";
import { useClockStore, useGameStore, useSettingsStore } from "stores";

export interface DailyRowModel {
  topicId: TopicId;
  name: string;
  line: string;
  stateLabel: string;
  state: DailyTopicState;
}

export interface DailyPreviewModel {
  status: DailyTopicStatus;
  eyebrow: string;
  packTitle: string;
  packSubtitle: string;
  /** Null when the opponent is no longer known (an abandoned attempt). */
  versus: string | null;
  opponentLine: string | null;
  rulesLine: string;
}

export const useDaily = () => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const data = useGameStore((state) => state.data);
  const startDraft = useGameStore((state) => state.startDraft);
  const isShotClockOn = useSettingsStore((state) => state.shotClockEnabled);
  const dateKey = useClockStore((state) => state.dateKey);
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);

  const board = useMemo(() => getDailyBoard(data, dateKey), [data, dateKey]);

  const stateLabel = useCallback(
    (status: DailyTopicStatus) => {
      switch (status.state) {
        case DailyTopicState.InProgress:
          return t("daily.stateInProgress");
        case DailyTopicState.Abandoned:
          return t("daily.stateAbandoned");
        case DailyTopicState.Completed: {
          const result = status.attempt?.result;
          if (!result) return t("daily.stateLost", { points: 0 });
          const points = result.totalRating;
          if (result.isWinner && result.isTie) return t("daily.stateTied", { points });
          return result.isWinner
            ? t("daily.stateWon", { points })
            : t("daily.stateLost", { points });
        }
        default:
          return t("daily.stateAvailable");
      }
    },
    [t]
  );

  const rows = useMemo<DailyRowModel[]>(
    () =>
      board.topics
        .filter((status) => status.state !== DailyTopicState.Unavailable)
        .map((status) => ({
          topicId: status.topicId,
          name: t(topicNameKey(status.topicId)),
          line: t(topicDailyKey(status.topicId)),
          stateLabel: stateLabel(status),
          state: status.state,
        })),
    [board, stateLabel, t]
  );

  const selected = selectedTopic
    ? (board.topics.find((status) => status.topicId === selectedTopic) ?? null)
    : null;

  /**
   * Who sat across the table. A daily that has started is described from its own draft or saved
   * record, never from today's plan recomputed against a catalog that may have grown since.
   */
  const opponentFor = useCallback(
    (status: DailyTopicStatus): { name: string; personality: BotPersonality | null } | null => {
      if (status.state === DailyTopicState.Available && status.plan) {
        return {
          name: t(personalityNameKey(status.plan.opponent)),
          personality: status.plan.opponent,
        };
      }
      const draftId = status.attempt?.draftId;
      const live = data.session?.draft.id === draftId ? data.session?.draft : null;
      const liveBot = live?.seats.find((seat) => seat.kind === SeatKind.Bot);
      if (liveBot) return { name: liveBot.name, personality: liveBot.personality };
      const record = data.history.find((entry) => entry.id === draftId);
      const recordBot = record?.seats.find((seat) => seat.kind === SeatKind.Bot);
      return recordBot ? { name: recordBot.name, personality: recordBot.personality } : null;
    },
    [data, t]
  );

  const preview = useMemo<DailyPreviewModel | null>(() => {
    if (!selected?.pack) return null;
    const opponent = opponentFor(selected);
    const picks = selected.pack.slots.reduce((total, slot) => total + slot.count, 0);
    return {
      status: selected,
      eyebrow: t("daily.previewEyebrow", {
        topic: t(topicNameKey(selected.topicId)),
        date: formatShortDateKey(dateKey),
      }),
      packTitle: selected.pack.title,
      packSubtitle: selected.pack.subtitle,
      versus: opponent ? t("daily.previewVersus", { opponent: opponent.name }) : null,
      opponentLine:
        opponent?.personality != null
          ? t("daily.previewOpponent", {
              opponent: opponent.name,
              blurb: t(personalityBlurbKey(opponent.personality)),
            })
          : null,
      rulesLine: t("daily.previewRules", { budget: selected.pack.budget, picks }),
    };
  }, [selected, opponentFor, dateKey, t]);

  const start = useCallback(
    (replaceUnfinished: boolean) => {
      if (!selected?.plan || !selected.pack || selected.state !== DailyTopicState.Available) return;
      const outcome = startDraft({
        draft: buildDailyDraftInput(selected.plan, selected.pack, {
          you: t("common.you"),
          opponent: t(personalityNameKey(selected.plan.opponent)),
        }),
        options: { shotClockMs: isShotClockOn ? SHOT_CLOCK_MS : null },
        replaceUnfinished,
      });
      if (!outcome.ok) {
        if (outcome.reason === SessionBlock.UnfinishedSession) setIsReplaceOpen(true);
        return;
      }
      setIsReplaceOpen(false);
      setSelectedTopic(null);
      navigation.navigate(RootRoute.AUCTION);
    },
    [selected, startDraft, isShotClockOn, t, navigation]
  );

  const handleResume = useCallback(() => {
    const draft = data.session?.draft;
    setSelectedTopic(null);
    navigation.navigate(
      draft?.phase === DraftPhase.Complete ? RootRoute.VERDICT : RootRoute.AUCTION
    );
  }, [data.session, navigation]);

  const handleSeeResult = useCallback(() => {
    const recordId = selected?.attempt?.draftId;
    setSelectedTopic(null);
    if (recordId) navigation.navigate(RootRoute.HISTORY_DETAIL, { recordId });
  }, [selected, navigation]);

  const unfinished = data.session && !data.session.revealed ? data.session.draft : null;
  const unfinishedTitle = unfinished ? (getPack(unfinished.packId)?.title ?? "") : "";

  return {
    dateLabel: formatLongDate(dateKey),
    done: board.completed,
    total: board.total,
    streakLabel:
      board.streak.current > 0 || board.streak.best > 0
        ? t("daily.streak", { count: board.streak.current, best: board.streak.best })
        : t("daily.noStreak"),
    rows,
    preview,
    isReplaceOpen,
    replaceTitle: preview
      ? t("daily.replaceTitle", { topic: t(topicNameKey(preview.status.topicId)) })
      : "",
    replaceBody: unfinished
      ? t(unfinished.mode === DraftMode.Daily ? "daily.replaceBodyDaily" : "daily.replaceBody", {
          pack: unfinishedTitle,
        })
      : "",
    handleOpenTopic: (topicId: TopicId) => setSelectedTopic(topicId),
    handleClosePreview: () => {
      setSelectedTopic(null);
      setIsReplaceOpen(false);
    },
    handleStart: () => start(false),
    handleConfirmReplace: () => start(true),
    handleCancelReplace: () => setIsReplaceOpen(false),
    handleResume,
    handleSeeResult,
  };
};

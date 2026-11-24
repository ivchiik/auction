import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getPack, sportOfPack, TOPIC_ORDER, TopicId, type SportId } from "data";
import { DraftMode, DraftPhase, getDeckProgress } from "engine";
import { DailyTopicState, GameDataNotice, getDailyBoard, type ActiveSession } from "game";
import { topicNameKey, type TranslationKey } from "i18n";
import { MainTab, RootRoute, type RootNavigation } from "navigation";
import { useClockStore, useGameStore, useUIStore } from "stores";

const NOTICE_KEYS: Record<GameDataNotice, TranslationKey> = {
  [GameDataNotice.SessionDiscarded]: "notices.sessionDiscarded",
  [GameDataNotice.DataReset]: "notices.dataReset",
  [GameDataNotice.StorageUnavailable]: "notices.storageUnavailable",
};

export interface ResumeModel {
  topic: TopicId;
  sport: SportId | null;
  packTitle: string;
  eyebrow: string;
  status: string;
  ctaLabel: string;
  isDaily: boolean;
  goesToVerdict: boolean;
}

export const useHome = () => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const data = useGameStore((state) => state.data);
  const notice = useGameStore((state) => state.notice);
  const dismissNotice = useGameStore((state) => state.dismissNotice);
  const abandonSession = useGameStore((state) => state.abandonSession);
  const dateKey = useClockStore((state) => state.dateKey);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const session: ActiveSession | null = data.session;
  const resume = useMemo<ResumeModel | null>(() => {
    if (!session) return null;
    const pack = getPack(session.draft.packId);
    if (!pack) return null;
    const { draft } = session;
    const isDaily = draft.mode === DraftMode.Daily;
    const goesToVerdict = draft.phase === DraftPhase.Complete;
    const progress = getDeckProgress(draft);
    const turn = draft.lot?.turn ?? null;
    const status = goesToVerdict
      ? t("home.resumeWaiting")
      : [
          t("home.resumeProgress", { current: progress.current, total: progress.total }),
          turn !== null ? t("home.resumeMove", { name: draft.seats[turn].name }) : null,
        ]
          .filter(Boolean)
          .join(" · ");
    return {
      topic: pack.topic,
      sport: sportOfPack(pack),
      packTitle: pack.title,
      eyebrow: t(isDaily ? "home.resumeDailyEyebrow" : "home.resumeEyebrow"),
      status,
      ctaLabel: t(goesToVerdict ? "home.seeVerdict" : "home.resume"),
      isDaily,
      goesToVerdict,
    };
  }, [session, t]);

  const board = useMemo(() => getDailyBoard(data, dateKey), [data, dateKey]);
  const featuredTopic =
    board.topics.find((entry) => entry.state === DailyTopicState.Available)?.topicId ??
    TopicId.Sports;

  const handleResume = useCallback(() => {
    if (!resume) return;
    navigation.navigate(resume.goesToVerdict ? RootRoute.VERDICT : RootRoute.AUCTION);
  }, [navigation, resume]);

  const handleConfirmDiscard = useCallback(() => {
    abandonSession();
    setIsDiscardOpen(false);
  }, [abandonSession]);

  const discardBody = resume?.isDaily
    ? t("home.discardBodyDaily", { topic: t(topicNameKey(resume.topic)) })
    : t("home.discardBody");

  return {
    noticeText: notice ? t(NOTICE_KEYS[notice]) : null,
    handleDismissNotice: dismissNotice,
    resume,
    handleResume,
    isDiscardOpen,
    discardBody,
    handleRequestDiscard: () => setIsDiscardOpen(true),
    handleCancelDiscard: () => setIsDiscardOpen(false),
    handleConfirmDiscard,
    dailyDone: board.completed,
    dailyTotal: board.total,
    featuredTopic,
    handleOpenDaily: () => setActiveTab(MainTab.Daily),
    topics: TOPIC_ORDER,
    handleOpenTopic: (topicId: TopicId) => navigation.navigate(RootRoute.TOPIC, { topicId }),
    handleOpenSettings: () => navigation.navigate(RootRoute.SETTINGS),
  };
};

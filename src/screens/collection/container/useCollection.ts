import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { sportOfPackId, TopicId, type SportId } from "data";
import { computeStreak, DraftMode, SeatKind } from "engine";
import { averageRatingOf, finishedDateKeys, formatAverage, type HistoryRecord } from "game";
import { formatShortDate, isTopicId } from "i18n";
import { MainTab, RootRoute, type RootNavigation } from "navigation";
import { useClockStore, useGameStore, useUIStore } from "stores";

export interface CollectionItem {
  id: string;
  topic: TopicId;
  sport: SportId | null;
  packTitle: string;
  meta: string;
  result: string;
  accessibilityLabel: string;
}

export const resultLineFor = (
  record: HistoryRecord,
  t: ReturnType<typeof useTranslation>["t"]
): string => {
  const winners = record.seats.filter((seat) => seat.isWinner);
  const lead = winners[0];
  if (!lead) return "";
  const average = formatAverage(averageRatingOf(lead.picks));
  return record.isTie || winners.length > 1
    ? t("collection.resultTie", { points: lead.totalRating, average })
    : t("collection.resultWin", { name: lead.name, points: lead.totalRating, average });
};

export const useCollection = () => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const history = useGameStore((state) => state.data.history);
  const daily = useGameStore((state) => state.data.daily);
  const dateKey = useClockStore((state) => state.dateKey);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const items = useMemo<CollectionItem[]>(
    () =>
      history.map((record) => {
        const meta = [
          t(record.mode === DraftMode.Daily ? "collection.daily" : "collection.quick"),
          formatShortDate(record.finishedAt),
        ].join(" · ");
        const result = resultLineFor(record, t);
        return {
          id: record.id,
          topic: isTopicId(record.topicId) ? record.topicId : TopicId.Sports,
          sport: sportOfPackId(record.packId),
          packTitle: record.packTitle,
          meta,
          result,
          accessibilityLabel: t("collection.recordLabel", {
            pack: record.packTitle,
            date: meta,
            result,
          }),
        };
      }),
    [history, t]
  );

  const wins = history.filter((record) =>
    record.seats.some((seat) => seat.kind === SeatKind.Human && seat.isWinner)
  ).length;
  const streak = computeStreak(finishedDateKeys(daily), dateKey);

  return {
    items,
    statsLine: [
      t("collection.played", { count: history.length }),
      t("collection.wins", { count: wins }),
      t("collection.streak", { count: streak.current }),
    ].join(" · "),
    handleOpen: (recordId: string) => navigation.navigate(RootRoute.HISTORY_DETAIL, { recordId }),
    handleStart: () => setActiveTab(MainTab.Play),
  };
};

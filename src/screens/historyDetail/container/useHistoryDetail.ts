import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Share } from "react-native";
import { useTranslation } from "react-i18next";

import { sportOfPackId, TopicId } from "data";
import { DraftMode } from "engine";
import { buildShareText } from "game";
import { usePickPositions } from "hooks";
import {
  formatShortDate,
  formatShortDateKey,
  isTopicId,
  type TranslationKey,
  type TranslationValues,
} from "i18n";
import type { RootNavigation } from "navigation";
import { useGameStore } from "stores";

export const useHistoryDetail = (recordId: string) => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const record = useGameStore(
    (state) => state.data.history.find((entry) => entry.id === recordId) ?? null
  );
  const [shareError, setShareError] = useState<string | null>(null);
  const positionOf = usePickPositions(record?.packId ?? null);

  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {}),
    [t]
  );

  const model = useMemo(() => {
    if (!record) return null;
    const winners = record.seats.filter((seat) => seat.isWinner);
    const lead = winners[0] ?? null;
    const nameOf = (seat: number) => record.seats[seat]?.name ?? "";
    return {
      record,
      topic: isTopicId(record.topicId) ? record.topicId : TopicId.Sports,
      sport: sportOfPackId(record.packId),
      eyebrow: t("history.eyebrow", {
        mode: t(record.mode === DraftMode.Daily ? "collection.daily" : "collection.quick"),
        date:
          record.mode === DraftMode.Daily && record.dailyKey
            ? formatShortDateKey(record.dailyKey)
            : formatShortDate(record.finishedAt),
      }),
      winnerTitle:
        record.isTie || winners.length > 1
          ? t("verdict.tie")
          : t("verdict.winner", { name: lead?.name ?? "" }),
      steal: record.bestBuy
        ? t("verdict.stealBody", {
            card: record.bestBuy.name,
            name: nameOf(record.bestBuy.seat),
            price: record.bestBuy.price,
            value: Math.round(record.bestBuy.tableValue),
          })
        : null,
      overpay: record.biggestOverpay
        ? t("verdict.overpayBody", {
            card: record.biggestOverpay.name,
            name: nameOf(record.biggestOverpay.seat),
            price: record.biggestOverpay.price,
            value: Math.round(record.biggestOverpay.tableValue),
          })
        : null,
    };
  }, [record, t]);

  const handleShare = useCallback(async () => {
    if (!record) return;
    try {
      setShareError(null);
      await Share.share({ message: buildShareText(record, translate, formatShortDateKey) });
    } catch {
      setShareError(t("verdict.shareFailed"));
    }
  }, [record, translate, t]);

  return { model, positionOf, shareError, handleShare, handleBack: () => navigation.goBack() };
};

import { DraftMode } from "engine";
import type { TranslationKey, TranslationValues } from "i18n";

import { averageRatingOf, formatAverage } from "./results";
import type { HistoryRecord } from "./types";

export type Translate = (key: TranslationKey, values?: TranslationValues) => string;

/** Plain-text brag for the native share sheet. Built from a revealed record only. */
export const buildShareText = (
  record: HistoryRecord,
  translate: Translate,
  formatDate: (dateKey: string) => string
): string => {
  const winners = record.seats.filter((seat) => seat.isWinner);
  const lines = [
    translate("verdict.shareHeader", { pack: record.packTitle, subtitle: record.packSubtitle }),
    record.mode === DraftMode.Daily && record.dailyKey
      ? translate("verdict.shareDaily", { date: formatDate(record.dailyKey) })
      : null,
    ...[...record.seats]
      .sort((a, b) => a.rank - b.rank)
      .map((seat) =>
        translate("verdict.shareLine", {
          name: seat.name,
          points: seat.totalRating,
          average: formatAverage(averageRatingOf(seat.picks)),
        })
      ),
    record.isTie || winners.length > 1
      ? translate("verdict.shareTie")
      : winners[0]
        ? translate("verdict.shareWinner", { name: winners[0].name })
        : null,
    record.bestBuy
      ? translate("verdict.shareSteal", { card: record.bestBuy.name, price: record.bestBuy.price })
      : null,
    translate("verdict.shareFooter"),
  ];
  return lines.filter((line): line is string => !!line).join("\n");
};

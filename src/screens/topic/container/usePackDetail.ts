import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ContentPack } from "data";
import {
  describePackPositions,
  formatLongDate,
  type TranslationKey,
  type TranslationValues,
} from "i18n";

export interface PackDetailModel {
  pack: ContentPack;
  /** What the roster is made of, for lineups and multi-position packs. */
  positions: string | null;
  snapshot: string;
  imagesLine: string;
}

/** The "About this pack" sheet, shared by the topic and sport choosers. */
export const usePackDetail = () => {
  const { t } = useTranslation();
  const [pack, setPack] = useState<ContentPack | null>(null);
  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {}),
    [t]
  );

  const detail = useMemo<PackDetailModel | null>(() => {
    if (!pack) return null;
    // Third-party image credits stay with the pack; the card-data source is never named.
    const hosts = [
      ...new Set(pack.cards.flatMap((card) => (card.image ? [card.image.credit] : []))),
    ];
    return {
      pack,
      positions: describePackPositions(pack.slots, translate)?.text ?? null,
      snapshot: t("topic.snapshotBody", {
        date: formatLongDate(pack.provenance.snapshotDate),
        selection: pack.provenance.selection,
      }),
      imagesLine:
        hosts.length > 0
          ? t("topic.imagesSome", { hosts: hosts.join("; ") })
          : t("topic.imagesNone"),
    };
  }, [pack, t, translate]);

  return {
    detail,
    handleOpenDetail: (next: ContentPack) => setPack(next),
    handleCloseDetail: () => setPack(null),
  };
};

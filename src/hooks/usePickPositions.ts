import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getPack } from "data";
import { positionLabels, type TranslationKey, type TranslationValues } from "i18n";

export interface PickPosition {
  /** Short tag, e.g. "GK". */
  tag: string;
  /** Sort key: slot order first, then position order inside the slot. */
  order: number;
}

export type PickPositionLookup = (cardId: string) => PickPosition | null;

/**
 * For packs whose cards come in several positions (lineups, or one slot taking strikers and
 * wingers): each pick's position tag and lineup order, looked up from the pack by card id, so
 * results saved before positions were shown get them too. Null for one-position packs.
 */
export const usePickPositions = (packId: string | null): PickPositionLookup | null => {
  const { t } = useTranslation();
  return useMemo(() => {
    const pack = packId ? getPack(packId) : null;
    const positions = new Set(pack?.slots.flatMap((slot) => slot.accepts) ?? []);
    if (!pack || positions.size < 2) return null;
    const translate = (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {});
    const positionByCard = new Map(pack.cards.map((card) => [card.id, card.position]));
    return (cardId: string) => {
      const position = positionByCard.get(cardId);
      if (!position) return null;
      const slotIndex = pack.slots.findIndex((slot) => slot.accepts.includes(position));
      const inSlot = slotIndex >= 0 ? pack.slots[slotIndex].accepts.indexOf(position) : 0;
      return {
        tag: positionLabels(position, translate).short,
        order: Math.max(0, slotIndex) * 100 + inSlot,
      };
    };
  }, [packId, t]);
};

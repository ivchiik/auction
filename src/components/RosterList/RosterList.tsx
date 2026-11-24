import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { SlotRule } from "engine";
import type { SeatPickView, SeatView } from "game";
import { positionLabels, slotLabels, type TranslationKey, type TranslationValues } from "i18n";
import { TextVariant, useTheme } from "theme";

import { AppText } from "../AppText/AppText";
import { LockIcon } from "../icons/icons";
import { SeatAvatar } from "../SeatAvatar/SeatAvatar";
import { _styles } from "./RosterList.styles";

export interface RosterListProps {
  seats: SeatView[];
  /** The pack's slots; a lineup (several slots) lists picks and open spots position by position. */
  slots?: readonly SlotRule[];
  /** Pre-verdict: mark every pick's rating as hidden. */
  showHiddenMark?: boolean;
  testID?: string;
}

interface RosterRow {
  key: string;
  pick: SeatPickView | null;
  /** Position tag for lineups ("GK"), on picks and open spots alike. */
  tag: string | null;
}

/** Each seat's picks, prices and open spots. Built from SeatView, so no rating can appear. */
export const RosterList = ({
  seats,
  slots = [],
  showHiddenMark = false,
  testID,
}: RosterListProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {}),
    [t]
  );
  const isLineup = slots.length > 1;
  const hasPositions = new Set(slots.flatMap((slot) => slot.accepts)).size > 1;

  const rowsFor = (seat: SeatView): RosterRow[] => {
    const tagOf = (pick: SeatPickView) =>
      hasPositions ? positionLabels(pick.position, translate).short : null;
    if (!isLineup) {
      const openCount = Math.max(0, seat.rosterSize - seat.picks.length);
      return [
        ...seat.picks.map((pick) => ({ key: pick.cardId, pick, tag: tagOf(pick) })),
        ...Array.from({ length: openCount }, (_, index) => ({
          key: `open-${index}`,
          pick: null,
          tag: null,
        })),
      ];
    }
    return slots.flatMap((slot) => {
      const short = slotLabels(slot, translate).short;
      const picks = seat.picks.filter((pick) => pick.slotId === slot.id);
      const open = seat.openBySlot[slot.id] ?? Math.max(0, slot.count - picks.length);
      return [
        ...picks.map((pick) => ({ key: pick.cardId, pick, tag: short })),
        ...Array.from({ length: open }, (_, index) => ({
          key: `open-${slot.id}-${index}`,
          pick: null,
          tag: short,
        })),
      ];
    });
  };

  return (
    <View style={styles.list} testID={testID}>
      {seats.map((seat) => (
        <View key={seat.id} style={styles.seat} testID={testID && `${testID}-seat-${seat.index}`}>
          <View style={styles.header} accessible accessibilityRole="header">
            <SeatAvatar seat={seat.index} size={36} />
            <View style={styles.headerText}>
              <AppText variant={TextVariant.Subhead}>{seat.name}</AppText>
              <AppText variant={TextVariant.Caption} color="textMuted">
                {t("auction.rosterSpent", { spent: seat.spent, money: seat.money })}
              </AppText>
            </View>
          </View>
          {rowsFor(seat).map(({ key, pick, tag }) =>
            pick ? (
              <View
                key={key}
                style={styles.pick}
                accessible
                accessibilityLabel={[
                  tag,
                  t("auction.pick", { name: pick.name, price: pick.price }),
                  showHiddenMark ? t("a11y.ratingHidden") : null,
                ]
                  .filter(Boolean)
                  .join(". ")}
              >
                {tag ? (
                  <AppText variant={TextVariant.Label} color="textMuted" style={styles.tag}>
                    {tag}
                  </AppText>
                ) : null}
                <View style={styles.pickText}>
                  <AppText variant={TextVariant.BodyStrong}>{pick.name}</AppText>
                  {pick.subtitle ? (
                    <AppText variant={TextVariant.Caption} color="textMuted" numberOfLines={1}>
                      {pick.subtitle}
                    </AppText>
                  ) : null}
                </View>
                {showHiddenMark ? <LockIcon size={16} color={theme.color.textMuted} /> : null}
                <AppText variant={TextVariant.BodyStrong}>
                  {t("common.dollars", { amount: pick.price })}
                </AppText>
              </View>
            ) : (
              <View key={key} style={styles.open}>
                <AppText variant={TextVariant.Caption} color="textMuted">
                  {tag ? t("auction.openSlot", { short: tag }) : t("auction.openSpot")}
                </AppText>
              </View>
            )
          )}
        </View>
      ))}
    </View>
  );
};

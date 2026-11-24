import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { averageRatingOf, formatAverage, type HistorySeat } from "game";
import type { PickPositionLookup } from "hooks";
import { TextVariant, useTheme, type ColorToken } from "theme";

import { AppText } from "../AppText/AppText";
import { _styles } from "./RatedRoster.styles";

export interface RatedRosterProps {
  seats: HistorySeat[];
  onDark: boolean;
  /** Lineups: each pick's position tag, and picks listed in lineup order (keeper first). */
  positionOf?: PickPositionLookup | null;
}

/** After the reveal: every pick with its rating, price and the published basis line. */
export const RatedRoster = ({ seats, onDark, positionOf }: RatedRosterProps) => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  const ink: ColorToken = onDark ? "textOnDark" : "text";
  const muted: ColorToken = onDark ? "textMutedOnDark" : "textMuted";
  const accent: ColorToken = onDark ? "highlight" : "accent";
  return (
    <View style={styles.list} testID="rated-roster">
      {seats.map((seat, index) => {
        const average = formatAverage(averageRatingOf(seat.picks));
        const picks = positionOf
          ? [...seat.picks].sort(
              (a, b) => (positionOf(a.cardId)?.order ?? 0) - (positionOf(b.cardId)?.order ?? 0)
            )
          : seat.picks;
        return (
          <View key={`seat-${index}`} style={styles.seat}>
            <View
              style={styles.seatHeader}
              accessible
              accessibilityRole="header"
              accessibilityLabel={t("verdict.seatHeaderLabel", {
                name: seat.name,
                points: seat.totalRating,
                average,
              })}
            >
              <AppText variant={TextVariant.Subhead} color={ink} style={styles.seatName}>
                {seat.name}
              </AppText>
              <AppText variant={TextVariant.BodyStrong} color={accent}>
                {t("verdict.ptsAverage", { points: seat.totalRating, average })}
              </AppText>
            </View>
            {picks.map((pick) => {
              const tag = positionOf?.(pick.cardId)?.tag ?? null;
              return (
                <View
                  key={pick.cardId}
                  style={[styles.pick, onDark ? styles.pickDark : styles.pickLight]}
                  accessible
                  accessibilityLabel={[
                    tag,
                    t("auction.pick", { name: pick.name, price: pick.price }),
                    t("verdict.ratingLabel", { rating: pick.rating, basis: pick.basis }),
                  ]
                    .filter(Boolean)
                    .join(". ")}
                >
                  <AppText variant={TextVariant.Stat} color={accent} style={styles.rating}>
                    {t("verdict.rating", { rating: pick.rating })}
                  </AppText>
                  <View style={styles.pickText}>
                    {tag ? (
                      <AppText variant={TextVariant.Label} color={muted}>
                        {tag}
                      </AppText>
                    ) : null}
                    <AppText variant={TextVariant.BodyStrong} color={ink}>
                      {pick.name}
                    </AppText>
                    <AppText variant={TextVariant.Caption} color={muted}>
                      {pick.basis}
                    </AppText>
                  </View>
                  <AppText variant={TextVariant.BodyStrong} color={ink}>
                    {t("verdict.price", { price: pick.price })}
                  </AppText>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { averageRatingOf, formatAverage, type HistorySeat } from "game";
import { TextVariant, useTheme, type ColorToken } from "theme";

import { AppText } from "../AppText/AppText";
import { _styles } from "./ResultSeatTiles.styles";

export interface ResultSeatTilesProps {
  seats: HistorySeat[];
  /** Forest verdict screen or ivory history detail. */
  onDark: boolean;
  /** Optional display override for the score while it counts up. */
  displayPoints?: (seat: HistorySeat) => number;
}

/** "You 428 pts, avg 85.6 / The Shark 416 pts", best first; winners raised. Revealed rosters only. */
export const ResultSeatTiles = ({ seats, onDark, displayPoints }: ResultSeatTilesProps) => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  // Seat order is the identity: two seats may share a name and a total.
  const ordered = seats
    .map((seat, index) => ({ seat, index }))
    .sort((a, b) => a.seat.rank - b.seat.rank || a.index - b.index);
  return (
    <View style={styles.grid} testID="result-tiles">
      {ordered.map(({ seat, index }) => {
        const points = displayPoints ? displayPoints(seat) : seat.totalRating;
        const tileStyle = onDark
          ? seat.isWinner
            ? styles.darkWinner
            : styles.darkOther
          : seat.isWinner
            ? styles.lightWinner
            : styles.lightOther;
        const nameColor: ColorToken = onDark
          ? seat.isWinner
            ? "highlight"
            : "textOnDark"
          : "text";
        const textColor: ColorToken = onDark
          ? "textOnDark"
          : seat.isWinner
            ? "onHighlight"
            : "text";
        const mutedColor: ColorToken = onDark ? "textMutedOnDark" : "textMuted";
        const average = formatAverage(averageRatingOf(seat.picks));
        return (
          <View
            key={`seat-${index}`}
            style={[styles.tile, tileStyle]}
            accessible
            accessibilityLabel={t("verdict.seatLabel", {
              name: seat.name,
              points: seat.totalRating,
              average,
              grade: seat.grade,
              spent: seat.spent,
            })}
          >
            <AppText
              variant={TextVariant.Label}
              color={nameColor}
              style={styles.center}
              numberOfLines={2}
            >
              {seat.name}
            </AppText>
            <AppText
              variant={TextVariant.Stat}
              color={textColor}
              style={styles.points}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t("verdict.pts", { points })}
            </AppText>
            <AppText variant={TextVariant.BodyStrong} color={textColor} style={styles.center}>
              {t("verdict.average", { average })}
            </AppText>
            <AppText variant={TextVariant.Caption} color={mutedColor} style={styles.center}>
              {t("verdict.seatSummary", { grade: seat.grade, spent: seat.spent })}
            </AppText>
          </View>
        );
      })}
    </View>
  );
};

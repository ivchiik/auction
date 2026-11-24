import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AppText } from "components";
import { TextVariant, useTheme } from "theme";

import { _styles } from "./StatusRow.styles";

export interface StatusRowProps {
  amountLabel: string;
  leaderLine: string;
  nudge: string | null;
}

/**
 * "On the table $4 · Leading: The Shark", compact enough to live in the pinned dock so the
 * current bid and leader are always visible during a decision, even on the smallest phones.
 * The leader copy names the seat without a verb, so it reads right for any name, "You" included.
 */
export const StatusRow = ({ amountLabel, leaderLine, nudge }: StatusRowProps) => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t("auction.statusLabel", { amount: amountLabel, leader: leaderLine })}
      testID="auction-status"
    >
      <View style={styles.amount}>
        <AppText variant={TextVariant.Label} color="textMuted" i18nKey="auction.onTheTable" />
        <AppText variant={TextVariant.Stat} testID="auction-amount">
          {amountLabel}
        </AppText>
      </View>
      <View style={styles.lines}>
        <AppText variant={TextVariant.BodyStrong} style={styles.right} numberOfLines={2}>
          {leaderLine}
        </AppText>
        {nudge ? (
          <AppText variant={TextVariant.Caption} color="textMuted" style={styles.right}>
            {nudge}
          </AppText>
        ) : null}
      </View>
    </View>
  );
};

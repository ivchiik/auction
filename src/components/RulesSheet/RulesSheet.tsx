import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { TranslationKey } from "i18n";
import { TextVariant, useTheme } from "theme";

import { AppSheet } from "../AppSheet/AppSheet";
import { AppText } from "../AppText/AppText";
import { _styles } from "./RulesSheet.styles";

const SECTIONS: readonly { title: TranslationKey; body: TranslationKey }[] = [
  { title: "rules.tableTitle", body: "rules.tableBody" },
  { title: "rules.biddingTitle", body: "rules.biddingBody" },
  { title: "rules.skipsTitle", body: "rules.skipsBody" },
  { title: "rules.budgetTitle", body: "rules.budgetBody" },
  { title: "rules.positionsTitle", body: "rules.positionsBody" },
  { title: "rules.hidingTitle", body: "rules.hidingBody" },
  { title: "rules.deckTitle", body: "rules.deckBody" },
  { title: "rules.verdictTitle", body: "rules.verdictBody" },
];

export interface RulesSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** The concise rules, reachable from setup, the auction and settings. */
export const RulesSheet = ({ visible, onClose }: RulesSheetProps) => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  return (
    <AppSheet visible={visible} onClose={onClose} title={t("rules.title")} testID="rules-sheet">
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <AppText
            variant={TextVariant.Subhead}
            i18nKey={section.title}
            accessibilityRole="header"
          />
          <AppText variant={TextVariant.Body} color="textMuted" i18nKey={section.body} />
        </View>
      ))}
    </AppSheet>
  );
};

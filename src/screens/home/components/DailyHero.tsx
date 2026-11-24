import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AppButton, AppText, ArrowUpRightIcon, ButtonVariant, TopicIcon } from "components";
import type { TopicId } from "data";
import { TextVariant, useTheme } from "theme";

import { _styles } from "./DailyHero.styles";

export interface DailyHeroProps {
  done: number;
  total: number;
  featuredTopic: TopicId;
  onOpen: () => void;
}

/** "Today's table." on forest, with two tilted cards. Local progress only, no crowd claims. */
export const DailyHero = ({ done, total, featuredTopic, onOpen }: DailyHeroProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const isAllDone = done >= total;
  return (
    <View style={styles.hero} testID="home-daily-hero">
      <View style={styles.art} accessible={false} importantForAccessibility="no-hide-descendants">
        <View style={[styles.card, styles.backCard]} />
        <View style={[styles.card, styles.frontCard]}>
          <TopicIcon topic={featuredTopic} size={44} />
        </View>
      </View>
      <View style={styles.text}>
        <AppText variant={TextVariant.Label} color="highlight" i18nKey="home.dailyEyebrow" />
        <AppText
          variant={TextVariant.Title}
          style={styles.title}
          i18nKey="home.dailyTitle"
          accessibilityRole="header"
        />
        <AppText variant={TextVariant.Body} color="textMutedOnDark">
          {isAllDone ? t("home.dailyAllDone") : t("home.dailyProgress", { done, total })}
        </AppText>
      </View>
      <AppButton
        i18nKey="home.dailyCta"
        variant={ButtonVariant.Highlight}
        pill
        onPress={onOpen}
        style={styles.cta}
        trailing={<ArrowUpRightIcon size={22} color={theme.color.onHighlight} />}
        testID="home-daily-cta"
      />
    </View>
  );
};

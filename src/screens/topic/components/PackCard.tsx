import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  AppButton,
  AppText,
  ArrowRightIcon,
  ButtonVariant,
  InfoIcon,
  PressableCard,
  TOPIC_SURFACE,
} from "components";
import { rosterSizeOf, type ContentPack } from "data";
import { describePackPositions, type TranslationKey, type TranslationValues } from "i18n";
import { TextVariant, useTheme } from "theme";

import { _styles } from "./PackCard.styles";

export interface PackCardProps {
  pack: ContentPack;
  onChoose: (pack: ContentPack) => void;
  onAbout: (pack: ContentPack) => void;
}

/** A pack or sport mode: format, positions for lineups, rating basis and "About this pack". */
export const PackCard = ({ pack, onChoose, onAbout }: PackCardProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(key, values ?? {}),
    [t]
  );
  const meta = [
    t("topic.cards", { count: pack.cards.length }),
    t("topic.format", { budget: pack.budget, picks: rosterSizeOf(pack) }),
  ].join(" · ");
  const positions = describePackPositions(pack.slots, translate);
  const label = [t("topic.choose", { pack: pack.title }), pack.subtitle, meta, positions?.label]
    .filter(Boolean)
    .join(". ");

  return (
    <View
      style={[styles.card, { backgroundColor: theme.color[TOPIC_SURFACE[pack.topic]] }]}
      testID={`pack-${pack.id}`}
    >
      <PressableCard
        onPress={() => onChoose(pack)}
        accessibilityLabel={`${label}.`}
        style={styles.choose}
        testID={`pack-${pack.id}-choose`}
      >
        <AppText variant={TextVariant.Label} color="textMuted">
          {pack.subtitle}
        </AppText>
        <View style={styles.titleRow}>
          <AppText variant={TextVariant.Title} style={styles.title}>
            {pack.title}
          </AppText>
          <ArrowRightIcon size={28} color={theme.color.primary} />
        </View>
        <AppText variant={TextVariant.BodyStrong}>{meta}</AppText>
        {positions ? <AppText variant={TextVariant.Body}>{positions.text}</AppText> : null}
        <AppText variant={TextVariant.Body} color="textMuted">
          {t("topic.ratedOn", { basis: pack.ratingLabel })}
        </AppText>
      </PressableCard>
      <AppButton
        i18nKey="topic.about"
        variant={ButtonVariant.Ghost}
        onPress={() => onAbout(pack)}
        accessibilityLabel={t("topic.aboutLabel", { pack: pack.title })}
        leading={<InfoIcon size={18} color={theme.color.primary} />}
        style={styles.about}
        testID={`pack-${pack.id}-about`}
      />
    </View>
  );
};

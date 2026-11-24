import { View } from "react-native";

import {
  AppText,
  ArrowRightIcon,
  IconButton,
  IconButtonVariant,
  InfoIcon,
  PressableCard,
} from "components";
import type { ContentPack } from "data";
import { TextVariant, useTheme } from "theme";

import type { LineupCardModel } from "../container/useSport";
import { _styles } from "./LineupCard.styles";

export interface LineupCardProps {
  model: LineupCardModel;
  onChoose: (pack: ContentPack) => void;
  onAbout: (pack: ContentPack) => void;
}

/**
 * The whole-team mode on forest: budget, picks and formation, chosen with one tap anywhere on the
 * card. "About this pack" is a separate control in the corner so its spoken name stays its own.
 */
export const LineupCard = ({ model, onChoose, onAbout }: LineupCardProps) => {
  const { styles, theme } = useTheme(_styles);
  return (
    <View style={styles.card} testID={`pack-${model.pack.id}`}>
      <PressableCard
        onPress={() => onChoose(model.pack)}
        accessibilityLabel={model.label}
        style={styles.choose}
        testID={`pack-${model.pack.id}-choose`}
      >
        <AppText
          variant={TextVariant.Label}
          color="highlight"
          i18nKey="sport.lineupEyebrow"
          style={styles.clearOfAbout}
        />
        <AppText variant={TextVariant.Title} color="textOnDark" style={styles.clearOfAbout}>
          {model.pack.title}
        </AppText>
        <AppText variant={TextVariant.Subhead} color="textOnDark">
          {model.stats}
        </AppText>
        <AppText variant={TextVariant.Body} color="textMutedOnDark">
          {model.formation}
        </AppText>
        <View style={styles.cta}>
          <AppText
            variant={TextVariant.BodyStrong}
            color="highlight"
            i18nKey="sport.lineupCta"
            style={styles.ctaText}
          />
          <ArrowRightIcon size={28} color={theme.color.highlight} />
        </View>
      </PressableCard>
      <View style={styles.about}>
        <IconButton
          icon={InfoIcon}
          variant={IconButtonVariant.OnDark}
          accessibilityLabel={model.aboutLabel}
          onPress={() => onAbout(model.pack)}
          testID={`pack-${model.pack.id}-about`}
        />
      </View>
    </View>
  );
};

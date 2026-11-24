import { useTranslation } from "react-i18next";

import { AppText, PressableCard, TOPIC_SURFACE, TopicIcon } from "components";
import type { TopicId } from "data";
import { topicBlurbKey, topicNameKey } from "i18n";
import { TextVariant, useTheme } from "theme";

import { _styles } from "./TopicTile.styles";

export interface TopicTileProps {
  topic: TopicId;
  /** The wide tile also shows the topic's line ("Cars · Build your dream garage"). */
  wide?: boolean;
  onPress: (topic: TopicId) => void;
}

export const TopicTile = ({ topic, wide = false, onPress }: TopicTileProps) => {
  const { styles, theme, dimensions } = useTheme(_styles);
  const { t } = useTranslation();
  const name = t(topicNameKey(topic));
  const blurb = t(topicBlurbKey(topic));
  const isNarrow = dimensions.width < theme.breakpoints.narrowWidth;
  return (
    <PressableCard
      onPress={() => onPress(topic)}
      accessibilityLabel={t("home.topicLabel", { name, blurb })}
      style={[styles.tile, { backgroundColor: theme.color[TOPIC_SURFACE[topic]] }]}
      testID={`home-topic-${topic}`}
    >
      <TopicIcon topic={topic} size={isNarrow ? 24 : 28} />
      <AppText
        variant={TextVariant.Subhead}
        numberOfLines={wide ? 2 : 1}
        adjustsFontSizeToFit={!wide}
        minimumFontScale={0.8}
        style={styles.label}
      >
        {wide ? t("home.carsWide", { name, blurb }) : name}
      </AppText>
    </PressableCard>
  );
};

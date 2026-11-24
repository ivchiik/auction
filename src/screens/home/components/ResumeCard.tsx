import { View } from "react-native";

import { AppButton, AppText, ButtonVariant, TOPIC_SURFACE, TopicIcon } from "components";
import { TextVariant, useTheme } from "theme";

import type { ResumeModel } from "../container/useHome";
import { _styles } from "./ResumeCard.styles";

export interface ResumeCardProps {
  model: ResumeModel;
  onResume: () => void;
  onDiscard: () => void;
}

/** The one unfinished draft: pick it up or end it deliberately. */
export const ResumeCard = ({ model, onResume, onDiscard }: ResumeCardProps) => {
  const { styles, theme } = useTheme(_styles);
  return (
    <View style={styles.card} testID="home-resume-card">
      <View style={styles.top}>
        <View style={[styles.badge, { backgroundColor: theme.color[TOPIC_SURFACE[model.topic]] }]}>
          <TopicIcon topic={model.topic} sport={model.sport} size={26} />
        </View>
        <View style={styles.text}>
          <AppText variant={TextVariant.Label} color="textMuted">
            {model.eyebrow}
          </AppText>
          <AppText variant={TextVariant.Subhead} numberOfLines={2}>
            {model.packTitle}
          </AppText>
          <AppText variant={TextVariant.Caption} color="textMuted" numberOfLines={2}>
            {model.status}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          label={model.ctaLabel}
          pill
          onPress={onResume}
          style={styles.primary}
          testID="home-resume"
        />
        {!model.goesToVerdict ? (
          <AppButton
            i18nKey="home.discard"
            variant={ButtonVariant.Secondary}
            pill
            onPress={onDiscard}
            testID="home-discard"
          />
        ) : null}
      </View>
    </View>
  );
};

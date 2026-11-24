import { View } from "react-native";

import { TopicId } from "data";
import { TextVariant, useTheme } from "theme";

import { AppButton } from "../AppButton/AppButton";
import { AppText } from "../AppText/AppText";
import { TopicIcon } from "../icons/TopicIcon";
import { _styles } from "./EmptyState.styles";

export interface EmptyStateProps {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

/** A friendly first-run panel with a small stack of cards instead of an empty list. */
export const EmptyState = ({ title, body, actionLabel, onAction, testID }: EmptyStateProps) => {
  const { styles } = useTheme(_styles);
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.stack} accessible={false} importantForAccessibility="no-hide-descendants">
        <View style={[styles.card, styles.back]} />
        <View style={[styles.card, styles.middle]}>
          <TopicIcon topic={TopicId.Songs} size={30} />
        </View>
        <View style={[styles.card, styles.front]}>
          <TopicIcon topic={TopicId.Sports} size={36} />
        </View>
      </View>
      <View style={styles.text}>
        <AppText variant={TextVariant.Heading} align="center" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant={TextVariant.Body} color="textMuted" align="center">
          {body}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} pill onPress={onAction} testID={testID && `${testID}-cta`} />
      ) : null}
    </View>
  );
};

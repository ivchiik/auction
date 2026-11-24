import { View } from "react-native";

import { TextVariant, useTheme, type ColorToken } from "theme";

import { AppText } from "../AppText/AppText";
import { BadgeCheckIcon, TrendingDownIcon } from "../icons/icons";
import { _styles } from "./HighlightCard.styles";

export enum HighlightKind {
  Steal = "steal",
  Overpay = "overpay",
}

export interface HighlightCardProps {
  kind: HighlightKind;
  eyebrow: string;
  title: string;
  body: string;
  onDark: boolean;
  testID?: string;
}

/** The steal of the draft (ivory card, vermilion badge) or the biggest overpay (outlined). */
export const HighlightCard = ({
  kind,
  eyebrow,
  title,
  body,
  onDark,
  testID,
}: HighlightCardProps) => {
  const { styles, theme } = useTheme(_styles);
  const isSteal = kind === HighlightKind.Steal;
  const isFilled = isSteal || !onDark;
  const containerStyle = isSteal
    ? styles.filled
    : onDark
      ? styles.outlineDark
      : styles.outlineLight;
  const titleColor: ColorToken = isFilled ? "primary" : "textOnDark";
  const mutedColor: ColorToken = isFilled ? "textMuted" : "textMutedOnDark";
  const Icon = isSteal ? BadgeCheckIcon : TrendingDownIcon;
  return (
    <View
      style={[styles.card, containerStyle]}
      accessible
      accessibilityLabel={`${eyebrow}. ${title} ${body}`}
      testID={testID}
    >
      <View style={[styles.badge, isSteal ? styles.badgeSteal : styles.badgeOverpay]}>
        <Icon size={28} color={isSteal ? theme.color.onAccent : theme.color.primary} />
      </View>
      <View style={styles.text}>
        <AppText variant={TextVariant.Label} color={mutedColor}>
          {eyebrow}
        </AppText>
        <AppText variant={TextVariant.Heading} color={titleColor}>
          {title}
        </AppText>
        <AppText variant={TextVariant.Body} color={mutedColor}>
          {body}
        </AppText>
      </View>
    </View>
  );
};

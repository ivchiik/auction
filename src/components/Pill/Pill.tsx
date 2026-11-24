import { View } from "react-native";

import { TextVariant, useTheme, type ColorToken } from "theme";

import { AppText } from "../AppText/AppText";
import type { IconComponent } from "../icons/icons";
import { _styles } from "./Pill.styles";

export enum PillTone {
  Ivory = "ivory",
  Acid = "acid",
  Forest = "forest",
  Outline = "outline",
}

export interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: IconComponent;
  /** Uppercase tracked label style instead of body text. */
  shout?: boolean;
}

const INK: Record<PillTone, ColorToken> = {
  [PillTone.Ivory]: "text",
  [PillTone.Acid]: "onHighlight",
  [PillTone.Forest]: "onPrimary",
  [PillTone.Outline]: "textMuted",
};

/** Small rounded label: "Rating hidden", winner badges, status chips. */
export const Pill = ({ label, tone = PillTone.Ivory, icon: Icon, shout = false }: PillProps) => {
  const { styles, theme } = useTheme(_styles);
  const toneStyle = {
    [PillTone.Ivory]: styles.ivory,
    [PillTone.Acid]: styles.acid,
    [PillTone.Forest]: styles.forest,
    [PillTone.Outline]: styles.outline,
  }[tone];
  const ink = INK[tone];
  return (
    <View style={[styles.pill, toneStyle]}>
      {Icon ? <Icon size={16} color={theme.color[ink]} strokeWidth={2} /> : null}
      <AppText
        variant={shout ? TextVariant.Label : TextVariant.Caption}
        color={ink}
        maxFontSizeMultiplier={1.4}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
};

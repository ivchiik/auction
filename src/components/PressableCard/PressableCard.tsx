import type { ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "theme";

import { usePressGuard } from "../usePressGuard";
import { _styles } from "./PressableCard.styles";

export interface PressableCardProps {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  testID?: string;
}

/** A whole tappable surface (topic tile, pack, resume card). One spoken label, one target. */
export const PressableCard = ({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  style,
  children,
  testID,
}: PressableCardProps) => {
  const { styles, theme } = useTheme(_styles);
  const handlePress = usePressGuard(onPress, disabled);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      testID={testID}
      hitSlop={theme.space.xs}
      style={({ pressed }) => [style, pressed && !disabled && styles.pressed]}
    >
      {children}
    </Pressable>
  );
};

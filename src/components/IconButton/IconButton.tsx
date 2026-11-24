import { Pressable } from "react-native";

import { useTheme } from "theme";

import { usePressGuard } from "../usePressGuard";
import { _styles } from "./IconButton.styles";
import { IconButtonVariant, type IconButtonProps } from "./IconButton.types";

const ICON_SIZE = 24;

export const IconButton = ({
  icon: Icon,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  variant = IconButtonVariant.Outline,
  disabled = false,
  testID,
}: IconButtonProps) => {
  const { styles, theme } = useTheme(_styles);
  const handlePress = usePressGuard(onPress, disabled);
  const variantStyle = {
    [IconButtonVariant.Outline]: styles.outline,
    [IconButtonVariant.Plain]: styles.plain,
    [IconButtonVariant.OnDark]: styles.onDark,
  }[variant];
  const color = variant === IconButtonVariant.OnDark ? theme.color.textOnDark : theme.color.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      hitSlop={theme.space.xs}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon size={ICON_SIZE} color={color} strokeWidth={1.75} />
    </Pressable>
  );
};

import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { TextVariant, useTheme } from "theme";

import { AppText } from "../AppText/AppText";
import { usePressGuard } from "../usePressGuard";
import { _styles } from "./AppButton.styles";
import { ButtonVariant, type AppButtonProps } from "./AppButton.types";

const LABEL_MAX_FONT_SCALE = 1.4;

export const AppButton = ({
  onPress,
  i18nKey,
  i18nValues,
  label,
  variant = ButtonVariant.Primary,
  pill = false,
  disabled = false,
  visuallyDisabled = false,
  isLoading = false,
  accessibilityLabel,
  accessibilityHint,
  leading,
  trailing,
  style,
  testID,
}: AppButtonProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();

  const text = i18nKey ? t(i18nKey, i18nValues ?? {}) : (label ?? "");
  const isBlocked = disabled || isLoading;
  const looksDisabled = disabled || visuallyDisabled;
  const handlePress = usePressGuard(onPress, isBlocked);

  const containerStyle = {
    [ButtonVariant.Primary]: styles.primary,
    [ButtonVariant.Secondary]: styles.secondary,
    [ButtonVariant.Highlight]: styles.highlight,
    [ButtonVariant.Ghost]: styles.ghost,
    [ButtonVariant.Danger]: styles.danger,
    [ButtonVariant.OnDark]: styles.onDark,
  }[variant];
  const labelStyle = {
    [ButtonVariant.Primary]: styles.primaryLabel,
    [ButtonVariant.Secondary]: styles.secondaryLabel,
    [ButtonVariant.Highlight]: styles.highlightLabel,
    [ButtonVariant.Ghost]: styles.ghostLabel,
    [ButtonVariant.Danger]: styles.dangerLabel,
    [ButtonVariant.OnDark]: styles.onDarkLabel,
  }[variant];
  const spinnerColor =
    variant === ButtonVariant.Primary || variant === ButtonVariant.Danger
      ? theme.color.onPrimary
      : theme.color.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: looksDisabled, busy: isLoading }}
      disabled={isBlocked}
      onPress={handlePress}
      hitSlop={theme.space.xs}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        pill && styles.pill,
        looksDisabled && styles.disabled,
        pressed && !isBlocked && styles.pressed,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {leading}
          <AppText
            variant={TextVariant.BodyStrong}
            maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
            numberOfLines={2}
            style={[styles.label, labelStyle]}
          >
            {text}
          </AppText>
          {trailing}
        </View>
      )}
    </Pressable>
  );
};

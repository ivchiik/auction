import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import type { TranslationKey, TranslationValues } from "i18n";

export enum ButtonVariant {
  /** Forest action surface: the main thing to do on a screen. */
  Primary = "primary",
  /** Outlined: secondary choices such as Pass. */
  Secondary = "secondary",
  /** Acid yellow call to action, at home on dark surfaces. */
  Highlight = "highlight",
  /** Text-only: low-emphasis navigation. */
  Ghost = "ghost",
  /** Vermilion: destructive confirmations. */
  Danger = "danger",
  /** Outlined on forest backgrounds. */
  OnDark = "onDark",
}

export interface AppButtonProps {
  onPress: () => void;
  /** Static label. */
  i18nKey?: TranslationKey;
  i18nValues?: TranslationValues;
  /** Dynamic label (data). Ignored when `i18nKey` is set. */
  label?: string;
  variant?: ButtonVariant;
  /** Pill shape (fully rounded) instead of the 16pt card radius. */
  pill?: boolean;
  /** Blocks presses and looks disabled. */
  disabled?: boolean;
  /** Looks disabled but still pressable, e.g. to explain why an action is unavailable. */
  visuallyDisabled?: boolean;
  /** Swaps the label for a spinner and blocks presses. */
  isLoading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const ICON_BUTTON_SIZE = 48;

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      width: ICON_BUTTON_SIZE,
      height: ICON_BUTTON_SIZE,
      borderRadius: ICON_BUTTON_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    outline: {
      borderWidth: 1.5,
      borderColor: theme.color.border,
    },
    plain: {
      width: theme.touchTarget,
    },
    onDark: {
      borderWidth: 1.5,
      borderColor: theme.color.lineOnPrimary,
    },
    pressed: {
      opacity: 0.6,
    },
    disabled: {
      opacity: 0.35,
    },
  });

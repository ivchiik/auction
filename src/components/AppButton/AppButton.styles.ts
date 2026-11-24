import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const BUTTON_MIN_HEIGHT = 52;

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: Math.max(BUTTON_MIN_HEIGHT, theme.touchTarget),
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.space.xl,
      paddingVertical: theme.space.md,
      alignItems: "center",
      justifyContent: "center",
    },
    pill: {
      borderRadius: theme.radius.pill,
    },
    primary: {
      backgroundColor: theme.color.primary,
    },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: theme.color.border,
    },
    highlight: {
      backgroundColor: theme.color.highlight,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    danger: {
      backgroundColor: theme.color.accent,
    },
    onDark: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: theme.color.lineOnPrimary,
    },
    disabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.97 }],
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.space.sm,
    },
    label: {
      textAlign: "center",
      flexShrink: 1,
    },
    primaryLabel: {
      color: theme.color.onPrimary,
    },
    secondaryLabel: {
      color: theme.color.primary,
    },
    highlightLabel: {
      color: theme.color.onHighlight,
    },
    ghostLabel: {
      color: theme.color.primary,
    },
    dangerLabel: {
      color: theme.color.onAccent,
    },
    onDarkLabel: {
      color: theme.color.textOnDark,
    },
  });

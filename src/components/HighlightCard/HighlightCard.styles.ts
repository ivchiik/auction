import { StyleSheet } from "react-native";

import type { Theme } from "theme";

const BADGE = 56;

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.lg,
      padding: theme.space.lg,
      borderRadius: theme.radius.lg,
    },
    filled: {
      backgroundColor: theme.color.background,
    },
    outlineDark: {
      borderWidth: 1.5,
      borderColor: theme.color.lineOnPrimary,
    },
    outlineLight: {
      borderWidth: 1.5,
      borderColor: theme.color.border,
    },
    badge: {
      width: BADGE,
      height: BADGE,
      borderRadius: BADGE / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeSteal: {
      backgroundColor: theme.color.accent,
    },
    badgeOverpay: {
      backgroundColor: theme.color.surfaceMuted,
    },
    text: {
      flex: 1,
      gap: 2,
    },
  });

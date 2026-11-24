import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      padding: theme.space.xs + 2,
      gap: theme.space.xs,
      borderRadius: theme.radius.md,
      backgroundColor: theme.color.surfaceMuted,
    },
    segment: {
      flex: 1,
      minHeight: theme.touchTarget,
      borderRadius: theme.radius.sm,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.space.xs,
    },
    selected: {
      backgroundColor: theme.color.primary,
    },
    pressed: {
      opacity: 0.7,
    },
  });

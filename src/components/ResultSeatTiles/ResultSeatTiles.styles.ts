import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.space.md,
    },
    tile: {
      flexGrow: 1,
      flexBasis: "45%",
      minHeight: 104,
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      padding: theme.space.lg,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.space.xs,
    },
    darkWinner: {
      backgroundColor: theme.color.primaryRaised,
      borderColor: theme.color.primaryRaised,
    },
    darkOther: {
      borderColor: theme.color.lineOnPrimary,
    },
    lightWinner: {
      backgroundColor: theme.color.highlight,
      borderColor: theme.color.highlight,
    },
    lightOther: {
      borderColor: theme.color.border,
    },
    center: {
      textAlign: "center",
    },
    // Stretched so a four-digit lineup total has a width to shrink into instead of wrapping.
    points: {
      alignSelf: "stretch",
      textAlign: "center",
    },
  });

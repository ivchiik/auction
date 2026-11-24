import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.sm,
      minHeight: theme.touchTarget,
    },
    back: {
      marginLeft: -theme.space.md,
    },
    eyebrow: {
      flex: 1,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.sm,
    },
  });

import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      backgroundColor: theme.color.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.color.border,
      paddingTop: theme.space.sm,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.space.xs,
      minHeight: 56,
    },
    pressed: {
      opacity: 0.6,
    },
  });

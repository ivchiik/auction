import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.lg,
      minHeight: 48,
    },
    amount: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: theme.space.sm,
    },
    lines: {
      flex: 1,
      alignItems: "flex-end",
    },
    right: {
      textAlign: "right",
    },
  });

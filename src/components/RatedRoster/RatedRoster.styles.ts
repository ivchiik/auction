import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    list: {
      gap: theme.space.lg,
    },
    seat: {
      gap: theme.space.sm,
    },
    seatHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "baseline",
      justifyContent: "space-between",
      columnGap: theme.space.md,
    },
    seatName: {
      flexShrink: 1,
    },
    pick: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
      paddingVertical: theme.space.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    pickDark: {
      borderTopColor: theme.color.lineOnPrimary,
    },
    pickLight: {
      borderTopColor: theme.color.border,
    },
    rating: {
      minWidth: 44,
      textAlign: "center",
    },
    pickText: {
      flex: 1,
      gap: 2,
    },
  });

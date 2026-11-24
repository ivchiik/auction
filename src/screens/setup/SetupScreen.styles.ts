import { StyleSheet } from "react-native";

import { displayType, type Theme, type WindowDimensions } from "theme";

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const isNarrow = width < theme.breakpoints.narrowWidth;
  return StyleSheet.create({
    title: {
      ...displayType(isNarrow ? 38 : 44),
    },
    packPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
      minHeight: 56,
      paddingHorizontal: theme.space.lg,
      paddingVertical: theme.space.md,
      borderRadius: theme.radius.md,
    },
    packText: {
      flex: 1,
    },
    section: {
      gap: theme.space.md,
    },
    seats: {
      gap: theme.space.md,
    },
    quickRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.lg,
      paddingVertical: theme.space.sm,
    },
    quickText: {
      flex: 1,
      gap: 2,
    },
    rule: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.color.border,
    },
    stats: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: theme.space.xl,
      rowGap: theme.space.xs,
    },
    stat: {
      color: theme.color.primary,
    },
  });
};

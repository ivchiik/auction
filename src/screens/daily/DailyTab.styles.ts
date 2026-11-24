import { StyleSheet } from "react-native";

import { displayType, type Theme, type WindowDimensions } from "theme";

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const isNarrow = width < theme.breakpoints.narrowWidth;
  return StyleSheet.create({
    title: {
      ...displayType(isNarrow ? 38 : 46),
      color: theme.color.primary,
    },
    progressCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.lg,
      padding: theme.space.xl,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.color.highlight,
    },
    progressText: {
      flex: 1,
      gap: theme.space.xs,
    },
    list: {
      marginTop: -theme.space.sm,
    },
    versus: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
    },
    versusText: {
      flex: 1,
    },
    previewSection: {
      gap: theme.space.sm,
    },
  });
};

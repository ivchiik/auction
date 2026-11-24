import { StyleSheet } from "react-native";

import { displayType, type Theme, type WindowDimensions } from "theme";

const DOT_SIZE = 11;

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const isNarrow = width < theme.breakpoints.narrowWidth;
  return StyleSheet.create({
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    wordmarkRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.space.xs,
    },
    wordmark: {
      ...displayType(34),
      textTransform: "lowercase",
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      marginTop: theme.space.sm,
      backgroundColor: theme.color.accent,
    },
    tagline: {
      ...displayType(isNarrow ? 36 : 40),
    },
    intro: {
      gap: theme.space.xs,
    },
    sectionTitle: {
      ...displayType(26),
    },
    grid: {
      gap: theme.space.sm + 2,
    },
    gridRow: {
      flexDirection: "row",
      gap: theme.space.sm + 2,
    },
  });
};

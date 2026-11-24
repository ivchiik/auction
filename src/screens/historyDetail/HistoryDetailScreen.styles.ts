import { StyleSheet } from "react-native";

import { displayType, type Theme, type WindowDimensions } from "theme";

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const isNarrow = width < theme.breakpoints.narrowWidth;
  return StyleSheet.create({
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
    },
    tile: {
      width: 52,
      height: 52,
      borderRadius: theme.radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      flex: 1,
      ...displayType(isNarrow ? 30 : 34),
    },
    sectionTitle: {
      marginTop: theme.space.sm,
    },
  });
};

import { StyleSheet } from "react-native";

import { displayType, type Theme, type WindowDimensions } from "theme";

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const isNarrow = width < theme.breakpoints.narrowWidth;
  return StyleSheet.create({
    title: {
      ...displayType(isNarrow ? 38 : 46),
    },
    titleOnDark: {
      color: theme.color.textOnDark,
    },
    center: {
      alignItems: "center",
      gap: theme.space.sm,
    },
    centerText: {
      textAlign: "center",
    },
    // Four 0.7 em figures (an eleven-pick lineup can pass 1,000) stay inside the 327 pt column of
    // a 375 pt phone even at the 1.1× text-size cap; the screen also shrinks it to fit if needed.
    score: {
      ...displayType(isNarrow ? 84 : 104),
      textAlign: "center",
      alignSelf: "stretch",
    },
    footerRow: {
      flexDirection: "row",
      gap: theme.space.sm,
    },
    footerButton: {
      flex: 1,
      paddingHorizontal: theme.space.md,
    },
    sectionTitle: {
      marginTop: theme.space.md,
    },
    helpLink: {
      alignSelf: "flex-start",
    },
  });
};

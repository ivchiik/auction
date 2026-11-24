import { StyleSheet } from "react-native";

import { displayType, type Theme, type WindowDimensions } from "theme";

const ICON_TILE = 52;

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const isNarrow = width < theme.breakpoints.narrowWidth;
  return StyleSheet.create({
    title: {
      ...displayType(isNarrow ? 38 : 46),
    },
    list: {
      gap: theme.space.md,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.lg,
      padding: theme.space.lg,
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.color.border,
      backgroundColor: theme.color.surface,
    },
    tile: {
      width: ICON_TILE,
      height: ICON_TILE,
      borderRadius: theme.radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      flex: 1,
      gap: 2,
    },
  });
};

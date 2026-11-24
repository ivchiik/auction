import { StyleSheet } from "react-native";

import type { Theme, WindowDimensions } from "theme";

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const isNarrow = width < theme.breakpoints.narrowWidth;
  return StyleSheet.create({
    tile: {
      flex: 1,
      minHeight: 60,
      borderRadius: theme.radius.md,
      paddingHorizontal: isNarrow ? theme.space.md : theme.space.lg,
      paddingVertical: theme.space.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: isNarrow ? theme.space.sm : theme.space.md,
    },
    label: {
      flexShrink: 1,
    },
  });
};

import { StyleSheet } from "react-native";

import { displayType, type Theme, type WindowDimensions } from "theme";

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const isNarrow = width < theme.breakpoints.narrowWidth;
  return StyleSheet.create({
    title: {
      ...displayType(isNarrow ? 38 : 46),
    },
    section: {
      gap: theme.space.sm,
      paddingTop: theme.space.sm,
    },
    card: {
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.color.border,
      backgroundColor: theme.color.surface,
      paddingHorizontal: theme.space.lg,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.lg,
      minHeight: 64,
      paddingVertical: theme.space.md,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.color.border,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    links: {
      gap: theme.space.sm,
    },
    linkButton: {
      alignSelf: "stretch",
    },
  });
};

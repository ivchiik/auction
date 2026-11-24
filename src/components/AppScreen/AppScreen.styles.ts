import { StyleSheet } from "react-native";

import { CONTENT_MAX_WIDTH, type Theme, type WindowDimensions } from "theme";

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const gutter = width < theme.breakpoints.narrowWidth ? theme.space.lg : theme.space.xl;
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    fill: {
      flex: 1,
    },
    bounded: {
      width: "100%",
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: "center",
      paddingHorizontal: gutter,
    },
    content: {
      gap: theme.space.lg,
    },
    header: {
      paddingBottom: theme.space.sm,
    },
    footer: {
      paddingTop: theme.space.md,
      gap: theme.space.md,
    },
    footerRule: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.color.border,
    },
  });
};

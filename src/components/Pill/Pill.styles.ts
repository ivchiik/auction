import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    pill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: theme.space.xs + 2,
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.xs + 2,
      borderRadius: theme.radius.pill,
    },
    ivory: {
      backgroundColor: theme.color.background,
    },
    acid: {
      backgroundColor: theme.color.highlight,
    },
    forest: {
      backgroundColor: theme.color.primary,
    },
    outline: {
      borderWidth: 1,
      borderColor: theme.color.border,
    },
  });

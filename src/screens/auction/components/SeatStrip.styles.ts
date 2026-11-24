import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.space.sm,
    },
    chip: {
      flexGrow: 1,
      flexBasis: "46%",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.sm,
      padding: theme.space.sm,
      paddingRight: theme.space.md,
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.color.border,
    },
    chipActive: {
      borderColor: theme.color.primary,
      backgroundColor: theme.color.surface,
    },
    chipOut: {
      opacity: 0.55,
    },
    text: {
      flex: 1,
    },
  });

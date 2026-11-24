import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.space.md,
      padding: theme.space.lg,
      paddingRight: theme.space.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.color.highlight,
    },
    icon: {
      paddingTop: 2,
    },
    message: {
      flex: 1,
      paddingTop: 2,
    },
  });

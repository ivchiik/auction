import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.radius.lg,
      padding: theme.space.xl,
      paddingBottom: theme.space.md,
      gap: theme.space.sm,
    },
    choose: {
      gap: theme.space.sm,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.space.md,
    },
    title: {
      flex: 1,
    },
    about: {
      alignSelf: "flex-start",
      paddingHorizontal: 0,
    },
  });

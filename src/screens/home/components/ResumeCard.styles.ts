import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.radius.lg,
      borderWidth: 1.5,
      borderColor: theme.color.primary,
      padding: theme.space.lg,
      gap: theme.space.md,
      backgroundColor: theme.color.surface,
    },
    top: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
    },
    badge: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      flex: 1,
      gap: 2,
    },
    actions: {
      flexDirection: "row",
      gap: theme.space.sm,
    },
    primary: {
      flex: 1,
    },
  });

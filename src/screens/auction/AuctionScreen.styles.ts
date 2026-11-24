import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.sm,
    },
    leave: {
      marginLeft: -theme.space.md,
    },
    spacer: {
      flex: 1,
    },
    meta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: theme.space.md,
      marginTop: -theme.space.sm,
    },
    context: {
      flexShrink: 1,
      textAlign: "right",
    },
  });

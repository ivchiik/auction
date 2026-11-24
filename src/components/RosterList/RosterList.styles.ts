import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    list: {
      gap: theme.space.lg,
    },
    seat: {
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.color.border,
      padding: theme.space.lg,
      gap: theme.space.sm,
      backgroundColor: theme.color.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
      paddingBottom: theme.space.xs,
    },
    headerText: {
      flex: 1,
    },
    pick: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
      minHeight: 40,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.color.border,
      paddingTop: theme.space.sm,
    },
    pickText: {
      flex: 1,
    },
    // Wide enough for "MID" or "Driver" so names line up down a lineup.
    tag: {
      minWidth: 44,
    },
    open: {
      borderStyle: "dashed",
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: theme.radius.sm,
      minHeight: 40,
      justifyContent: "center",
      paddingHorizontal: theme.space.md,
    },
  });

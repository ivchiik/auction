import { StyleSheet } from "react-native";

import type { Theme } from "theme";

const ICON_TILE = 52;

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.lg,
      paddingVertical: theme.space.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.color.border,
    },
    tile: {
      width: ICON_TILE,
      height: ICON_TILE,
      borderRadius: theme.radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      flex: 1,
      gap: 2,
    },
    status: {
      alignItems: "flex-end",
      gap: theme.space.xs,
      maxWidth: "38%",
    },
  });

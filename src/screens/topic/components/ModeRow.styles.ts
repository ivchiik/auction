import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const ARROW_SIZE = 28;

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.color.border,
    },
    choose: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.xs,
      minHeight: theme.touchTarget,
      paddingVertical: theme.space.xl,
    },
    text: {
      flex: 1,
      gap: theme.space.xs,
    },
    /** Keeps the text clear of the About button, which floats above this gap. */
    aboutSpace: {
      width: theme.touchTarget,
    },
    /** Centred on the row, in the gap just before the arrow. */
    about: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: ARROW_SIZE + theme.space.xs,
      justifyContent: "center",
    },
  });

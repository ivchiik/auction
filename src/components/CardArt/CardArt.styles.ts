import { StyleSheet } from "react-native";

import { FONT_FAMILY, type Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    frame: {
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    fill: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    fallback: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    monogram: {
      fontFamily: FONT_FAMILY.display,
      color: theme.color.accent,
      textAlign: "center",
    },
    glyph: {
      position: "absolute",
      left: theme.space.sm,
      bottom: theme.space.sm,
    },
  });

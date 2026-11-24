import { StyleSheet } from "react-native";

import { FONT_FAMILY, type Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    circle: {
      alignItems: "center",
      justifyContent: "center",
    },
    ring: {
      borderWidth: 2,
      borderColor: theme.color.background,
    },
    number: {
      fontFamily: FONT_FAMILY.bodyBold,
      fontVariant: ["tabular-nums"],
    },
  });

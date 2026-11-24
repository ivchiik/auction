import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      color: theme.color.text,
    },
  });

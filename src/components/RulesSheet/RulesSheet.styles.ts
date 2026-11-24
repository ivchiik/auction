import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      gap: theme.space.xs,
    },
  });

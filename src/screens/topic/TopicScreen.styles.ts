import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    list: {
      flex: 1,
    },
    listContent: {
      gap: theme.space.lg,
      paddingBottom: theme.space.xxl,
    },
    intro: {
      gap: theme.space.sm,
      paddingBottom: theme.space.sm,
    },
    footer: {
      paddingTop: theme.space.xl,
    },
  });

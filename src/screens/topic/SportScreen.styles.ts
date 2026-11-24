import { StyleSheet } from "react-native";

import type { Theme } from "theme";

/** Spacing on top of AppScreen's 16 pt gap between sections. */
export const _styles = (theme: Theme) =>
  StyleSheet.create({
    intro: {
      gap: theme.space.xl,
      paddingBottom: theme.space.sm,
    },
    afterLineups: {
      paddingTop: theme.space.lg,
    },
    moreIntro: {
      gap: theme.space.xs,
      paddingTop: theme.space.xl,
    },
    footnote: {
      paddingTop: theme.space.lg,
    },
  });

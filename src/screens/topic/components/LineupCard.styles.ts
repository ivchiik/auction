import { StyleSheet } from "react-native";

import type { Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.color.primary,
      borderRadius: theme.radius.lg,
    },
    choose: {
      paddingHorizontal: theme.space.xl,
      paddingTop: theme.space.xl,
      paddingBottom: theme.space.md,
      gap: theme.space.sm,
    },
    /** The eyebrow and title share the top edge with the 48 pt About button. */
    clearOfAbout: {
      paddingRight: theme.touchTarget + theme.space.sm,
    },
    cta: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
      minHeight: theme.touchTarget,
      marginTop: theme.space.xs,
    },
    ctaText: {
      flex: 1,
    },
    about: {
      position: "absolute",
      top: theme.space.lg,
      right: theme.space.lg,
    },
  });

import { StyleSheet } from "react-native";

import { FONT_FAMILY, type Theme } from "theme";

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.color.border,
      paddingVertical: theme.space.md,
      paddingLeft: theme.space.lg,
      paddingRight: theme.space.xs,
      gap: theme.space.sm,
    },
    cardActive: {
      borderColor: theme.color.primary,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    input: {
      fontFamily: FONT_FAMILY.bodySemiBold,
      fontSize: 18,
      color: theme.color.text,
      paddingVertical: theme.space.xs,
      borderBottomWidth: 2,
      borderBottomColor: theme.color.primary,
      minHeight: 40,
    },
    picker: {
      gap: theme.space.xs,
      paddingRight: theme.space.md,
      paddingBottom: theme.space.xs,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
      minHeight: theme.touchTarget,
      paddingHorizontal: theme.space.md,
      borderRadius: theme.radius.sm,
    },
    optionSelected: {
      backgroundColor: theme.color.surfaceMuted,
    },
    optionText: {
      flex: 1,
    },
    optionBlocked: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.7,
    },
    hint: {
      paddingHorizontal: theme.space.md,
    },
  });

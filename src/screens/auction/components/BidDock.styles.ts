import { StyleSheet } from "react-native";

import { clipFreeLineHeight, FONT_FAMILY, type Theme, type WindowDimensions } from "theme";

export const _styles = (theme: Theme, { height }: WindowDimensions) => {
  const isCompact = height < theme.breakpoints.compactHeight;
  return StyleSheet.create({
    dock: {
      gap: isCompact ? theme.space.sm : theme.space.md,
    },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.md,
      minHeight: isCompact ? 52 : 60,
      paddingVertical: theme.space.xs + 2,
      paddingHorizontal: theme.space.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.color.surfaceMuted,
    },
    bannerHuman: {
      backgroundColor: theme.color.highlight,
    },
    bannerText: {
      flex: 1,
      gap: 2,
    },
    bidRow: {
      flexDirection: "row",
      gap: theme.space.sm,
    },
    bidButton: {
      flex: 1,
      minHeight: isCompact ? 50 : 54,
      borderRadius: theme.radius.md,
      backgroundColor: theme.color.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    bidLabel: {
      fontFamily: FONT_FAMILY.bodyBold,
      fontSize: 24,
      lineHeight: clipFreeLineHeight(24, "dmSans"),
      color: theme.color.onPrimary,
      fontVariant: ["tabular-nums"],
    },
    bidDisabled: {
      opacity: 0.3,
    },
    bidPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.97 }],
    },
    hint: {
      textAlign: "center",
    },
  });
};

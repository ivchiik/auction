import { StyleSheet } from "react-native";

import { displayType, FONT_FAMILY, type Theme, type WindowDimensions } from "theme";

export const lotArtSize = (theme: Theme, { contentWidth, height }: WindowDimensions) => {
  const isCompact = height < theme.breakpoints.compactHeight;
  const width = Math.round(Math.min(contentWidth * (isCompact ? 0.3 : 0.36), 150));
  return { width, height: Math.round(width * 1.25) };
};

export const _styles = (theme: Theme, dimensions: WindowDimensions) => {
  const isCompact = dimensions.height < theme.breakpoints.compactHeight;
  const isNarrow = dimensions.width < theme.breakpoints.narrowWidth;
  const nameSize = isCompact || isNarrow ? 32 : 38;
  return StyleSheet.create({
    card: {
      borderRadius: theme.radius.lg,
      padding: isCompact ? theme.space.lg : theme.space.xl,
      gap: theme.space.md,
      overflow: "hidden",
    },
    name: {
      fontFamily: FONT_FAMILY.display,
      ...displayType(nameSize),
      color: theme.color.primary,
    },
    bottom: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.space.md,
    },
    details: {
      flex: 1,
      gap: theme.space.md,
    },
    stampAnchor: {
      position: "absolute",
      top: theme.space.lg,
      right: theme.space.lg,
    },
    stamp: {
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.xs + 2,
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      transform: [{ rotate: "-6deg" }],
    },
    stampSold: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    stampForced: {
      backgroundColor: theme.color.highlight,
      borderColor: theme.color.primary,
    },
    stampGone: {
      backgroundColor: theme.color.accent,
      borderColor: theme.color.accent,
    },
  });
};

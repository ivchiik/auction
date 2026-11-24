import { StyleSheet } from "react-native";

import { displayType, type Theme, type WindowDimensions } from "theme";

const CARD_WIDTH = 86;
const CARD_HEIGHT = 112;
/** The text column needs about this much room beside the art; narrower heroes hide the art. */
const MIN_INNER_WIDTH_FOR_ART = 260;

export const _styles = (theme: Theme, { width, contentWidth }: WindowDimensions) => {
  const gutter = width < theme.breakpoints.narrowWidth ? theme.space.lg : theme.space.xl;
  const innerWidth = contentWidth - 2 * gutter - 2 * theme.space.xl;
  const showArt = innerWidth >= MIN_INNER_WIDTH_FOR_ART;
  return StyleSheet.create({
    hero: {
      backgroundColor: theme.color.primary,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.space.xl,
      paddingVertical: theme.space.lg + 2,
      gap: theme.space.md,
      overflow: "hidden",
    },
    text: {
      gap: theme.space.xs,
      paddingRight: showArt ? CARD_WIDTH + theme.space.lg : 0,
    },
    title: {
      color: theme.color.textOnDark,
      ...displayType(28),
    },
    cta: {
      alignSelf: "flex-start",
      minHeight: 48,
      paddingHorizontal: theme.space.xl,
      paddingVertical: theme.space.sm,
    },
    art: {
      position: "absolute",
      right: theme.space.lg,
      top: theme.space.xl,
      width: CARD_WIDTH + theme.space.xl,
      height: CARD_HEIGHT + theme.space.xl,
      display: showArt ? "flex" : "none",
    },
    card: {
      position: "absolute",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: theme.radius.md,
      borderWidth: 2,
      borderColor: theme.color.background,
      alignItems: "center",
      justifyContent: "center",
    },
    backCard: {
      right: 0,
      top: theme.space.md,
      backgroundColor: theme.color.accent,
      transform: [{ rotate: "14deg" }],
    },
    frontCard: {
      right: theme.space.lg,
      top: 0,
      backgroundColor: theme.color.topicCharacters,
      transform: [{ rotate: "-10deg" }],
    },
  });
};

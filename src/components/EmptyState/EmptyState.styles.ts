import { StyleSheet } from "react-native";

import type { Theme } from "theme";

const CARD_WIDTH = 92;
const CARD_HEIGHT = 120;

export const _styles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      alignItems: "center",
      gap: theme.space.lg,
      paddingVertical: theme.space.xl,
    },
    stack: {
      width: CARD_WIDTH * 2,
      height: CARD_HEIGHT + theme.space.xl,
      alignItems: "center",
      justifyContent: "center",
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
    back: {
      backgroundColor: theme.color.accent,
      transform: [{ translateX: 34 }, { rotate: "12deg" }],
    },
    middle: {
      backgroundColor: theme.color.topicSongs,
      transform: [{ translateX: -30 }, { rotate: "-10deg" }],
    },
    front: {
      backgroundColor: theme.color.topicCharacters,
      transform: [{ rotate: "-2deg" }],
    },
    text: {
      alignItems: "center",
      gap: theme.space.sm,
    },
  });

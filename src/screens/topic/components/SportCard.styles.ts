import { StyleSheet } from "react-native";

import type { Theme, WindowDimensions } from "theme";

export const _styles = (theme: Theme, { width }: WindowDimensions) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.space.lg,
      borderRadius: theme.radius.lg,
      // Narrow phones give the name the room; "Formula 1" stays on one line at 360 dp.
      paddingHorizontal: width < theme.breakpoints.narrowWidth ? theme.space.lg : theme.space.xl,
      paddingVertical: theme.space.lg + theme.space.xs,
      backgroundColor: theme.color.topicSports,
    },
    text: {
      flex: 1,
      gap: theme.space.xs,
    },
  });

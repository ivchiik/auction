import { StyleSheet } from "react-native";

import { CONTENT_MAX_WIDTH, type Theme, type WindowDimensions } from "theme";

const HANDLE_WIDTH = 40;

export const _styles = (theme: Theme, { width }: WindowDimensions) => {
  const gutter = width < theme.breakpoints.narrowWidth ? theme.space.lg : theme.space.xl;
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: theme.color.overlay,
    },
    sheet: {
      width: "100%",
      maxWidth: CONTENT_MAX_WIDTH + theme.space.xxl,
      alignSelf: "center",
      backgroundColor: theme.color.background,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingTop: theme.space.sm,
    },
    handle: {
      alignSelf: "center",
      width: HANDLE_WIDTH,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.color.border,
      marginBottom: theme.space.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.space.md,
      paddingHorizontal: gutter,
      paddingBottom: theme.space.md,
    },
    headerText: {
      flex: 1,
      gap: theme.space.xs,
      paddingTop: theme.space.xs,
    },
    scroll: {
      flexGrow: 0,
    },
    body: {
      paddingHorizontal: gutter,
      paddingBottom: theme.space.lg,
      gap: theme.space.lg,
    },
    footer: {
      paddingHorizontal: gutter,
      paddingTop: theme.space.sm,
      gap: theme.space.sm,
    },
  });
};

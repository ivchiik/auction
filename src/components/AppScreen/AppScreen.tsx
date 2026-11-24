import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHiddenBehindSheet } from "hooks";
import { useTheme } from "theme";

import { _styles } from "./AppScreen.styles";
import type { AppScreenProps } from "./AppScreen.types";

/**
 * Screen frame: real OS safe areas (no fake status bars), content capped at phone width, an
 * optional fixed header and a footer pinned above the home indicator while the content scrolls.
 * Hidden from screen readers while a sheet is open over it.
 */
export const AppScreen = ({
  children,
  scroll = true,
  header,
  footer,
  background = "background",
  statusBar = "dark",
  keyboardAware = false,
  ignoreBottomInset = false,
  scrollRef,
  testID,
}: AppScreenProps) => {
  const { styles, theme } = useTheme(_styles);
  const insets = useSafeAreaInsets();
  const behindSheet = useHiddenBehindSheet();
  const backgroundColor = theme.color[background];
  const bottomInset = ignoreBottomInset ? 0 : insets.bottom;
  const contentPadding = {
    paddingTop: header ? theme.space.sm : theme.space.lg,
    paddingBottom:
      footer || ignoreBottomInset
        ? theme.space.lg
        : Math.max(bottomInset, theme.space.lg) + theme.space.lg,
  };

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.fill}
      contentContainerStyle={[styles.bounded, styles.content, contentPadding]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, styles.bounded, styles.content, contentPadding]}>{children}</View>
  );

  const frame = (
    <>
      {header ? (
        <View style={[styles.bounded, styles.header, { paddingTop: insets.top + theme.space.sm }]}>
          {header}
        </View>
      ) : (
        // Without a header the scroll view starts below the status bar, so scrolled text never
        // runs under the clock (it did on Home, Daily, Collection and the revealed verdict).
        <View style={{ height: insets.top }} />
      )}
      {body}
      {footer ? (
        <View
          style={[
            styles.bounded,
            styles.footer,
            { paddingBottom: Math.max(bottomInset, theme.space.lg), backgroundColor },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  return (
    <View {...behindSheet} style={[styles.root, { backgroundColor }]} testID={testID}>
      <StatusBar style={statusBar} />
      {keyboardAware && Platform.OS === "ios" ? (
        <KeyboardAvoidingView style={styles.fill} behavior="padding">
          {frame}
        </KeyboardAvoidingView>
      ) : (
        frame
      )}
    </View>
  );
};

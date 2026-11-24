import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion, useRegisterOpenSheet } from "hooks";
import { TextVariant, useTheme } from "theme";

import { AppText } from "../AppText/AppText";
import { IconButton } from "../IconButton/IconButton";
import { XIcon } from "../icons/icons";
import { _styles } from "./AppSheet.styles";

export interface AppSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children?: ReactNode;
  footer?: ReactNode;
  testID?: string;
}

const SLIDE_FROM = 48;
const SLIDE_MS = 220;
const MAX_HEIGHT_SHARE = 0.9;

/**
 * Bottom sheet on a native Modal: Android back and the backdrop close it, and the slide-in is
 * skipped when motion is reduced. While it is open, AppScreen and TabBar hide the app behind it
 * from VoiceOver and TalkBack (useRegisterOpenSheet / useHiddenBehindSheet); the sheet's own
 * content stays accessible because the Modal renders outside those views.
 */
export const AppSheet = ({
  visible,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  testID,
}: AppSheetProps) => {
  const { styles, dimensions } = useTheme(_styles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isReducedMotion = useReducedMotion();
  const [offset] = useState(() => new Animated.Value(SLIDE_FROM));
  useRegisterOpenSheet(visible);

  useEffect(() => {
    if (!visible) return;
    if (isReducedMotion) {
      offset.setValue(0);
      return;
    }
    offset.setValue(SLIDE_FROM);
    Animated.timing(offset, { toValue: 0, duration: SLIDE_MS, useNativeDriver: true }).start();
  }, [visible, isReducedMotion, offset]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root} testID={testID}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              maxHeight: dimensions.height * MAX_HEIGHT_SHARE,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: offset }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              {eyebrow ? (
                <AppText variant={TextVariant.Label} color="textMuted">
                  {eyebrow}
                </AppText>
              ) : null}
              {title ? (
                <AppText variant={TextVariant.Heading} accessibilityRole="header">
                  {title}
                </AppText>
              ) : null}
            </View>
            <IconButton
              icon={XIcon}
              accessibilityLabel={t("common.close")}
              onPress={onClose}
              testID={testID ? `${testID}-close` : undefined}
            />
          </View>
          {children ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : null}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
};

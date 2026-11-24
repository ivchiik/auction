import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { TextVariant, useTheme } from "theme";

import { AppText } from "../AppText/AppText";
import { IconButton } from "../IconButton/IconButton";
import { IconButtonVariant } from "../IconButton/IconButton.types";
import { InfoIcon, XIcon } from "../icons/icons";
import { _styles } from "./NoticeBanner.styles";

export interface NoticeBannerProps {
  message: string;
  onDismiss: () => void;
  testID?: string;
}

/** A calm, dismissible note (e.g. a save that could not be restored). */
export const NoticeBanner = ({ message, onDismiss, testID }: NoticeBannerProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  return (
    <View style={styles.banner} accessibilityRole="alert" testID={testID}>
      <View style={styles.icon}>
        <InfoIcon size={20} color={theme.color.onHighlight} />
      </View>
      <AppText variant={TextVariant.Body} color="onHighlight" style={styles.message}>
        {message}
      </AppText>
      <IconButton
        icon={XIcon}
        variant={IconButtonVariant.Plain}
        accessibilityLabel={t("notices.dismiss")}
        onPress={onDismiss}
        testID={testID ? `${testID}-dismiss` : undefined}
      />
    </View>
  );
};

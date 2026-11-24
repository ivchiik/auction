import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { TextVariant, useTheme } from "theme";

import { AppText } from "../AppText/AppText";
import { IconButton } from "../IconButton/IconButton";
import { IconButtonVariant } from "../IconButton/IconButton.types";
import { ArrowLeftIcon } from "../icons/icons";
import { _styles } from "./ScreenHeader.styles";

export interface ScreenHeaderProps {
  eyebrow?: string;
  onBack?: () => void;
  right?: ReactNode;
  onDark?: boolean;
  testID?: string;
}

/** Back arrow, tracked eyebrow label and optional actions, as in the setup design. */
export const ScreenHeader = ({
  eyebrow,
  onBack,
  right,
  onDark = false,
  testID,
}: ScreenHeaderProps) => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  return (
    <View style={styles.row} testID={testID}>
      {onBack ? (
        <View style={styles.back}>
          <IconButton
            icon={ArrowLeftIcon}
            variant={onDark ? IconButtonVariant.OnDark : IconButtonVariant.Plain}
            accessibilityLabel={t("common.back")}
            onPress={onBack}
            testID={testID ? `${testID}-back` : undefined}
          />
        </View>
      ) : null}
      <View style={styles.eyebrow}>
        {eyebrow ? (
          <AppText
            variant={TextVariant.Label}
            color={onDark ? "highlight" : "textMuted"}
            numberOfLines={2}
          >
            {eyebrow}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
};

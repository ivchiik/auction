import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { MAX_FONT_SCALE, TextVariant, useTheme } from "theme";

import { _styles } from "./AppText.styles";
import type { AppTextProps } from "./AppText.types";

/**
 * The only text primitive. App copy comes in through `i18nKey`; data (names, prices, card text)
 * comes in as children, so a card called "Home" can never be mistaken for a translation key.
 */
export const AppText = ({
  variant = TextVariant.Body,
  color = "text",
  align,
  i18nKey,
  i18nValues,
  children,
  style,
  ...rest
}: AppTextProps) => {
  const { styles, theme } = useTheme(_styles);
  const { t } = useTranslation();
  const content = i18nKey ? t(i18nKey, i18nValues ?? {}) : children;

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={MAX_FONT_SCALE[variant]}
      {...rest}
      style={[
        styles.base,
        theme.text[variant],
        { color: theme.color[color], textAlign: align },
        style,
      ]}
    >
      {content}
    </Text>
  );
};

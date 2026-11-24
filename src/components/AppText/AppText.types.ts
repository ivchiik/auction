import type { ReactNode } from "react";
import type { TextProps } from "react-native";

import type { TranslationKey, TranslationValues } from "i18n";
import type { ColorToken, TextVariant } from "theme";

export interface AppTextProps extends Omit<TextProps, "children"> {
  variant?: TextVariant;
  color?: ColorToken;
  align?: "auto" | "left" | "center" | "right";
  /** Static app copy. */
  i18nKey?: TranslationKey;
  i18nValues?: TranslationValues;
  /** Dynamic content such as names, numbers and card data. Ignored when `i18nKey` is set. */
  children?: ReactNode;
}

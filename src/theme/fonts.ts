import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans/700Bold";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces/700Bold";

import { FONT_FAMILY } from "./typography";

/** Only the weights the type scale uses are bundled (per-weight imports, OFL-1.1 fonts). */
export const FONT_SOURCES = {
  [FONT_FAMILY.display]: Fraunces_700Bold,
  [FONT_FAMILY.displaySemiBold]: Fraunces_600SemiBold,
  [FONT_FAMILY.body]: DMSans_400Regular,
  [FONT_FAMILY.bodyMedium]: DMSans_500Medium,
  [FONT_FAMILY.bodySemiBold]: DMSans_600SemiBold,
  [FONT_FAMILY.bodyBold]: DMSans_700Bold,
};

import { Platform, type TextStyle } from "react-native";

import { displayType } from "./fontMetrics";

/** Family names registered by `FONT_SOURCES` (see fonts.ts). */
export const FONT_FAMILY = {
  display: "Fraunces_700Bold",
  displaySemiBold: "Fraunces_600SemiBold",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemiBold: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",
} as const;

export enum TextVariant {
  Display = "display",
  Title = "title",
  Heading = "heading",
  /** Fraunces figures for stats such as "$20 each" or "428 pts". */
  Stat = "stat",
  /** DM Sans semibold 18: names in seat rows, banner lines. */
  Subhead = "subhead",
  /** DM Sans 17: supporting lines under headlines. */
  Lead = "lead",
  Body = "body",
  BodyStrong = "bodyStrong",
  Caption = "caption",
  Label = "label",
  Numeral = "numeral",
  /** The verdict's giant score. */
  Score = "score",
}

/** Bid numerals line up digit for digit. */
const TABULAR: TextStyle["fontVariant"] = ["tabular-nums"];

/**
 * Fraunces variants take the clip-free line height for their size (`displayType`): the font's
 * line box is 1.233 em, taller than the tight 1.08–1.2 em the first layouts used, which cut
 * descenders on Android. DM Sans line heights below already exceed its 1.302 em box.
 */
export const TEXT_STYLES: Record<TextVariant, TextStyle> = {
  [TextVariant.Display]: {
    fontFamily: FONT_FAMILY.display,
    ...displayType(44),
    letterSpacing: Platform.OS === "ios" ? -0.6 : -0.3,
  },
  [TextVariant.Title]: { fontFamily: FONT_FAMILY.display, ...displayType(30) },
  [TextVariant.Heading]: { fontFamily: FONT_FAMILY.displaySemiBold, ...displayType(22) },
  [TextVariant.Stat]: {
    fontFamily: FONT_FAMILY.display,
    ...displayType(28),
    fontVariant: TABULAR,
  },
  [TextVariant.Subhead]: { fontFamily: FONT_FAMILY.bodySemiBold, fontSize: 18, lineHeight: 24 },
  [TextVariant.Lead]: { fontFamily: FONT_FAMILY.body, fontSize: 17, lineHeight: 24 },
  [TextVariant.Body]: { fontFamily: FONT_FAMILY.body, fontSize: 16, lineHeight: 22 },
  [TextVariant.BodyStrong]: { fontFamily: FONT_FAMILY.bodySemiBold, fontSize: 16, lineHeight: 22 },
  [TextVariant.Caption]: { fontFamily: FONT_FAMILY.body, fontSize: 13, lineHeight: 18 },
  [TextVariant.Label]: {
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  [TextVariant.Numeral]: {
    fontFamily: FONT_FAMILY.display,
    ...displayType(56),
    fontVariant: TABULAR,
  },
  [TextVariant.Score]: {
    fontFamily: FONT_FAMILY.display,
    ...displayType(96),
    fontVariant: TABULAR,
  },
};

/**
 * Accessible text scaling stays on, capped per variant so oversized display type cannot push
 * fixed bid controls off small screens.
 */
export const MAX_FONT_SCALE: Record<TextVariant, number> = {
  [TextVariant.Display]: 1.25,
  [TextVariant.Title]: 1.35,
  [TextVariant.Heading]: 1.5,
  [TextVariant.Stat]: 1.3,
  [TextVariant.Subhead]: 1.6,
  [TextVariant.Lead]: 1.7,
  [TextVariant.Body]: 1.8,
  [TextVariant.BodyStrong]: 1.8,
  [TextVariant.Caption]: 1.8,
  [TextVariant.Label]: 1.6,
  [TextVariant.Numeral]: 1.2,
  [TextVariant.Score]: 1.1,
};

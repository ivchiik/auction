import type { TextStyle } from "react-native";

/**
 * Vertical metrics of the bundled fonts, in font units, read from the TTFs in
 * `@expo-google-fonts` (hhea ascender/descender; the OS/2 typo metrics are identical and
 * USE_TYPO_METRICS is set). Every weight of a family shares them. Checked against the files by
 * `src/theme/__tests__/fontMetrics.test.ts`.
 */
export const FONT_METRICS = {
  fraunces: { unitsPerEm: 2000, ascender: 1956, descender: 510 },
  dmSans: { unitsPerEm: 1000, ascender: 992, descender: 310 },
} as const;

export type FontFace = keyof typeof FONT_METRICS;

/** A family's own line box (ascent + descent) as a multiple of the font size. */
export const lineBoxEm = (face: FontFace): number => {
  const metrics = FONT_METRICS[face];
  return (metrics.ascender + metrics.descender) / metrics.unitsPerEm;
};

/**
 * Smallest line height that never clips a glyph of this family. Below the font's own line box,
 * React Native trims the shortfall equally from the first line's top and the last line's bottom
 * on Android (CSS half-leading in CustomLineHeightSpan), and iOS stops centring the glyphs. The
 * Fraunces "g" reaches 490 of the 510-unit descent, so any trim cut the descenders of headlines
 * such as "Argue now.". The extra point covers Android rounding the ascent and the descent up to
 * whole pixels (less than 1 dp together at density 2 and above).
 */
export const clipFreeLineHeight = (fontSize: number, face: FontFace = "fraunces"): number =>
  Math.ceil(fontSize * lineBoxEm(face)) + 1;

/** A Fraunces size with its clip-free line height, for headline and figure overrides. */
export const displayType = (fontSize: number): Pick<TextStyle, "fontSize" | "lineHeight"> => ({
  fontSize,
  lineHeight: clipFreeLineHeight(fontSize, "fraunces"),
});

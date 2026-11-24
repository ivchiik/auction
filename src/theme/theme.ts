import { LIGHT_COLORS, type ColorTheme } from "./colors";
import { TEXT_STYLES } from "./typography";

/** Phone-proportional content never grows past this width on tablets and foldables. */
export const CONTENT_MAX_WIDTH = 480;

export interface Theme {
  color: ColorTheme;
  text: typeof TEXT_STYLES;
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  space: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  /** Minimum touch target in points (AGENTS.md: at least 48). */
  touchTarget: number;
  /** Width/height cut-offs for responsive tweaks; `compactHeight` marks short phones. */
  breakpoints: { narrowWidth: number; compactHeight: number };
}

/** Live window size handed to style factories; never read Dimensions at module load. */
export interface WindowDimensions {
  width: number;
  height: number;
  /** Width capped at CONTENT_MAX_WIDTH for phone-proportional layout. */
  contentWidth: number;
}

export const LIGHT_THEME: Theme = {
  color: LIGHT_COLORS,
  text: TEXT_STYLES,
  radius: { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  touchTarget: 48,
  breakpoints: { narrowWidth: 375, compactHeight: 700 },
};

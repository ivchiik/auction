import { useContext, useMemo } from "react";

import type { Theme, WindowDimensions } from "./theme";
import { ThemeContext } from "./ThemeProvider";

export type StyleFactory<T> = (theme: Theme, dimensions: WindowDimensions) => T;

/**
 * `const { styles, theme, dimensions } = useTheme(_styles)`. Style factories receive the live
 * window size, so rotation, split screen and foldables re-layout without a reload.
 */
export const useTheme = <T = undefined>(factory?: StyleFactory<T>) => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  const { theme, dimensions } = context;
  const styles = useMemo(
    () => (factory ? factory(theme, dimensions) : undefined) as T,
    [factory, theme, dimensions]
  );
  return { theme, dimensions, styles };
};

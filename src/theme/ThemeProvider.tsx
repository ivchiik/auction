import { createContext, useMemo, type ReactNode } from "react";
import { useWindowDimensions } from "react-native";

import { CONTENT_MAX_WIDTH, LIGHT_THEME, type Theme, type WindowDimensions } from "./theme";

export interface ThemeContextValue {
  theme: Theme;
  dimensions: WindowDimensions;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
}

/** Light editorial theme only for the pitch; the context keeps room for a dark variant. */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { width, height } = useWindowDimensions();
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: LIGHT_THEME,
      dimensions: { width, height, contentWidth: Math.min(width, CONTENT_MAX_WIDTH) },
    }),
    [width, height]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

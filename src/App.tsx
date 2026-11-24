import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAppBootstrap, useDayRollover } from "hooks";
import { FONT_SOURCES, ThemeProvider } from "theme";

import { RootNavigator } from "./navigation/RootNavigator";

// Keep the native splash up until fonts and saved data are ready (Expo: call at module scope).
SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn("[splash] could not hold the splash screen", error);
});

export const App = () => {
  const [fontsLoaded, fontError] = useFonts(FONT_SOURCES);
  const isHydrated = useAppBootstrap();
  const isReady = (fontsLoaded || fontError !== null) && isHydrated;
  useDayRollover();

  useEffect(() => {
    if (fontError) console.warn("[fonts] falling back to system fonts", fontError);
  }, [fontError]);

  useEffect(() => {
    if (isReady) SplashScreen.hide();
  }, [isReady]);

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

import {
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMemo } from "react";

import { useReducedMotion } from "hooks";
import {
  AuctionScreen,
  HistoryDetailScreen,
  MainScreen,
  SettingsScreen,
  SetupScreen,
  SportScreen,
  TopicScreen,
  VerdictScreen,
} from "screens";
import { useTheme } from "theme";

import { navigationRef } from "./navigationRef";
import { RootRoute } from "./navNames";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { theme } = useTheme();
  const isReducedMotion = useReducedMotion();
  const navigationTheme = useMemo<NavigationTheme>(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme.color.background,
        card: theme.color.background,
        text: theme.color.text,
        border: theme.color.border,
        primary: theme.color.primary,
        notification: theme.color.accent,
      },
    }),
    [theme]
  );

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={RootRoute.MAIN}
        screenOptions={{
          headerShown: false,
          animation: isReducedMotion ? "fade" : "default",
          contentStyle: { backgroundColor: theme.color.background },
        }}
      >
        <Stack.Screen name={RootRoute.MAIN} component={MainScreen} />
        <Stack.Screen name={RootRoute.TOPIC} component={TopicScreen} />
        <Stack.Screen name={RootRoute.SPORT} component={SportScreen} />
        <Stack.Screen name={RootRoute.SETUP} component={SetupScreen} />
        {/* The table and the verdict leave only through their own confirmations. */}
        <Stack.Screen
          name={RootRoute.AUCTION}
          component={AuctionScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name={RootRoute.VERDICT}
          component={VerdictScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name={RootRoute.HISTORY_DETAIL} component={HistoryDetailScreen} />
        <Stack.Screen name={RootRoute.SETTINGS} component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

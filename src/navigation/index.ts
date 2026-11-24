// RootNavigator is imported by App.tsx directly: re-exporting it here would create an import
// cycle (screens use this barrel, and the navigator renders the screens).
export { navigationRef } from "./navigationRef";
export { MainTab, RootRoute } from "./navNames";

// types
export type {
  BaseScreenParams,
  RootNavigation,
  RootScreenProps,
  RootStackParamList,
  SetupParams,
  SetupSeatParam,
} from "./types";

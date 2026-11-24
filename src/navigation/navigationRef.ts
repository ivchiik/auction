import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./types";

/** Imperative navigation for non-React code. Always check `isReady()` before using it. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

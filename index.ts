// i18n must initialise before any screen renders.
import "./src/i18n";

import { registerRootComponent } from "expo";

import { App } from "./src/App";

// registerRootComponent calls AppRegistry.registerComponent("main", () => App) and sets up the
// environment the same way in Expo Go and in native builds.
registerRootComponent(App);

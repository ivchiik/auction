import AsyncStorage from "@react-native-async-storage/async-storage";

import type { KeyValueStore } from "./keyValueStore";

/** Device storage used by the app. Everything above it goes through the never-throw helpers. */
export const asyncStorageKv: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

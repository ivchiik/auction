import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";

export const SUPPORTED_LANGUAGES = ["en"] as const;

/** The app's own i18next instance; react-i18next picks it up through `initReactI18next`. */
export const i18n = createInstance();

// Resources are bundled, so initialisation is synchronous: no wrong-language or empty first frame.
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: [...SUPPORTED_LANGUAGES],
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

import type { ParseKeys } from "i18next";

import type { TranslationResources } from "./locales/en";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: TranslationResources };
  }
}

/** Every valid translation key, checked at compile time. */
export type TranslationKey = ParseKeys<"translation">;

export type TranslationValues = Record<string, string | number>;

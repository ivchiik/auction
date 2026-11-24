import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getCatalogSummary } from "data";
import { useSystemReducedMotion } from "hooks";
import { formatLongDate } from "i18n";
import type { RootNavigation } from "navigation";
import { useGameStore, useSettingsStore } from "stores";

export enum SettingsSheet {
  Rules = "rules",
  Grades = "grades",
  Reset = "reset",
}

export const useSettings = () => {
  const navigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const shotClockEnabled = useSettingsStore((state) => state.shotClockEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion);
  const setShotClockEnabled = useSettingsStore((state) => state.setShotClockEnabled);
  const resetAll = useGameStore((state) => state.resetAll);
  const isSystemReducedMotion = useSystemReducedMotion();
  const [sheet, setSheet] = useState<SettingsSheet | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const summary = getCatalogSummary();
  const appName = t("app.name");

  return {
    appName,
    hapticsEnabled,
    reduceMotion,
    shotClockEnabled,
    isSystemReducedMotion,
    sheet,
    message,
    aboutBody: t("settings.aboutBody", { app: appName }),
    contentBody: t("settings.contentBody", {
      packs: summary.packs,
      cards: summary.cards,
      date: formatLongDate(summary.snapshotDate),
    }),
    moneyBody: t("settings.moneyBody", { app: appName }),
    handleBack: () => navigation.goBack(),
    handleToggleHaptics: setHapticsEnabled,
    handleToggleReduceMotion: setReduceMotion,
    handleToggleShotClock: setShotClockEnabled,
    handleOpenSheet: (next: SettingsSheet) => {
      setMessage(null);
      setSheet(next);
    },
    handleCloseSheet: () => setSheet(null),
    handleConfirmReset: () => {
      resetAll();
      setSheet(null);
      setMessage(t("settings.resetDone"));
    },
  };
};

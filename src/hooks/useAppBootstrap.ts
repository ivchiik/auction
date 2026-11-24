import { useEffect, useState } from "react";

import { createEmptyGameData, GameDataNotice, parseGameData } from "game";
import { loadSettings, readGameDataText, removeLegacyKeys } from "storage";
import { useGameStore, useSettingsStore } from "stores";

const isHydrated = () =>
  useGameStore.getState().isHydrated && useSettingsStore.getState().isHydrated;

/**
 * Loads settings and game data exactly once, before anything interactive renders, so no screen
 * can act on (or write over) empty startup state. Never throws: unreadable data comes back as a
 * notice for Home, and unreadable storage disables writes for the session.
 */
export const useAppBootstrap = (): boolean => {
  const [isReady, setIsReady] = useState(isHydrated);

  useEffect(() => {
    if (isHydrated()) return;
    let isCancelled = false;
    const hydrate = async () => {
      const [settings, gameText] = await Promise.all([loadSettings(), readGameDataText()]);
      useSettingsStore.getState().hydrate(settings);
      if (gameText.ok) {
        useGameStore.getState().hydrate(parseGameData(gameText.text), true);
        void removeLegacyKeys();
      } else {
        useGameStore
          .getState()
          .hydrate(
            { data: createEmptyGameData(), notice: GameDataNotice.StorageUnavailable },
            false
          );
      }
      if (!isCancelled) setIsReady(true);
    };
    void hydrate();
    return () => {
      isCancelled = true;
    };
  }, []);

  return isReady;
};

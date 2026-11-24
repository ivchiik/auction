import { create } from "zustand";

import { DEFAULT_SETTINGS, settingsWriter, type AppSettings } from "storage";

export interface SettingsState extends AppSettings {
  isHydrated: boolean;
  hydrate: (settings: AppSettings) => void;
  setHapticsEnabled: (hapticsEnabled: boolean) => void;
  setShotClockEnabled: (shotClockEnabled: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  reset: () => void;
}

const pickSettings = (state: AppSettings): AppSettings => ({
  hapticsEnabled: state.hapticsEnabled,
  shotClockEnabled: state.shotClockEnabled,
  reduceMotion: state.reduceMotion,
});

/** Small durable preferences, written through a serialised queue after hydration only. */
export const useSettingsStore = create<SettingsState>((set, get) => {
  const update = (patch: Partial<AppSettings>) => {
    set(patch);
    if (get().isHydrated) settingsWriter.schedule(pickSettings(get()));
  };
  return {
    ...DEFAULT_SETTINGS,
    isHydrated: false,
    hydrate: (settings) => {
      if (get().isHydrated) return;
      set({ ...settings, isHydrated: true });
    },
    setHapticsEnabled: (hapticsEnabled) => update({ hapticsEnabled }),
    setShotClockEnabled: (shotClockEnabled) => update({ shotClockEnabled }),
    setReduceMotion: (reduceMotion) => update({ reduceMotion }),
    reset: () => update({ ...DEFAULT_SETTINGS }),
  };
});

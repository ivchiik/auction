import { create } from "zustand";

import { toDateKey } from "engine";
import { appClock } from "utils";

const todayKey = () => toDateKey(appClock.now(), appClock.timezoneOffsetMinutes());

export interface ClockState {
  /** Today's local date (YYYY-MM-DD), refreshed on foreground and at midnight. */
  dateKey: string;
  refresh: () => void;
}

export const useClockStore = create<ClockState>((set) => ({
  dateKey: todayKey(),
  refresh: () => {
    const next = todayKey();
    set((state) => (state.dateKey === next ? state : { dateKey: next }));
  },
}));

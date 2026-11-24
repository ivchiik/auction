import { create } from "zustand";

import { MainTab } from "navigation";

export interface UIState {
  activeTab: MainTab;
  setActiveTab: (activeTab: MainTab) => void;
  /** Sheets on screen right now; above zero, the app behind them is hidden from screen readers. */
  openSheetCount: number;
  addOpenSheet: () => void;
  removeOpenSheet: () => void;
}

/** Ephemeral UI state shared across screens (not persisted). */
export const useUIStore = create<UIState>((set) => ({
  activeTab: MainTab.Play,
  setActiveTab: (activeTab) => set({ activeTab }),
  openSheetCount: 0,
  addOpenSheet: () => set((state) => ({ openSheetCount: state.openSheetCount + 1 })),
  removeOpenSheet: () =>
    set((state) => ({ openSheetCount: Math.max(0, state.openSheetCount - 1) })),
}));

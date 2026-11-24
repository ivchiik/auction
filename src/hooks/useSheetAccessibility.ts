import { useEffect } from "react";

import { useUIStore } from "stores";

// AppSheet is a transparent native Modal. The app behind it stays in the iOS accessibility tree
// (the sheet's own `accessibilityViewIsModal` did not remove it) and reachable by TalkBack, so
// each open sheet is counted and the app content hides itself with the native properties.

/** Counts the calling sheet as open while `visible`; closing or unmounting it undoes that. */
export const useRegisterOpenSheet = (visible: boolean) => {
  useEffect(() => {
    if (!visible) return;
    const { addOpenSheet, removeOpenSheet } = useUIStore.getState();
    addOpenSheet();
    return removeOpenSheet;
  }, [visible]);
};

/**
 * Spread onto the app content behind sheets (screen frame, tab bar): hidden from VoiceOver
 * (`accessibilityElementsHidden`) and TalkBack (`importantForAccessibility`) while any sheet is
 * open, and restored when the last one closes.
 */
export const useHiddenBehindSheet = () => {
  const isBehindSheet = useUIStore((state) => state.openSheetCount > 0);
  return {
    accessibilityElementsHidden: isBehindSheet,
    importantForAccessibility: isBehindSheet ? "no-hide-descendants" : "auto",
  } as const;
};

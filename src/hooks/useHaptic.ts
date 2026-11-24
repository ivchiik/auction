import { useCallback } from "react";

import { useSettingsStore } from "stores";
import { HapticKind, playHaptic } from "utils";

/** `const haptic = useHaptic(); haptic(HapticKind.Bid)`. Respects the haptics setting. */
export const useHaptic = () => {
  const isEnabled = useSettingsStore((state) => state.hapticsEnabled);
  return useCallback((kind: HapticKind) => playHaptic(kind, isEnabled), [isEnabled]);
};

export { HapticKind };

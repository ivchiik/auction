import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { useSettingsStore } from "stores";

/** The phone's own Reduce Motion setting, kept live. */
export const useSystemReducedMotion = (): boolean => {
  const [isReduced, setIsReduced] = useState(false);
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setIsReduced(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setIsReduced);
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
  return isReduced;
};

/** True when either the phone or the in-app setting asks for reduced motion. */
export const useReducedMotion = (): boolean => {
  const systemReduced = useSystemReducedMotion();
  const appReduced = useSettingsStore((state) => state.reduceMotion);
  return systemReduced || appReduced;
};

import { useCallback, useEffect, useRef } from "react";

/** Second taps inside this window are ignored, so one tap can never act twice. */
export const DOUBLE_TAP_GUARD_MS = 600;

/**
 * Wraps a press handler so rapid repeat taps are dropped. This is the per-button layer; game
 * actions are also guarded at dispatch by their step key.
 */
export const usePressGuard = (onPress: () => void, isBlocked = false) => {
  const isLockedRef = useRef(false);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    },
    []
  );

  return useCallback(() => {
    if (isBlocked || isLockedRef.current) return;
    isLockedRef.current = true;
    unlockTimerRef.current = setTimeout(() => {
      isLockedRef.current = false;
      unlockTimerRef.current = null;
    }, DOUBLE_TAP_GUARD_MS);
    onPress();
  }, [isBlocked, onPress]);
};

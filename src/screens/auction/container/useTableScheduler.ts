import { useCallback, useEffect, useRef } from "react";

import { createTableScheduler, type TableScheduler } from "game";
import { useGameStore } from "stores";
import { appClock } from "utils";

const freshDraft = () => useGameStore.getState().data.session?.draft ?? null;

/**
 * Wires the framework-free table scheduler to the game store: it always reads the freshest
 * draft, dispatches through the step-key guard, re-syncs after every store change and runs only
 * while `isActive` (screen focused, app in the foreground, no sheet open).
 */
export const useTableScheduler = ({
  isActive,
  shotClockMs,
}: {
  isActive: boolean;
  shotClockMs: number | null;
}) => {
  const schedulerRef = useRef<TableScheduler | null>(null);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    const scheduler = createTableScheduler({
      getDraft: freshDraft,
      dispatch: (stepKey, action) => {
        useGameStore.getState().dispatchForStep(stepKey, action);
      },
      timers: {
        now: appClock.monotonicNow,
        setTimeout: (callback, ms) => setTimeout(callback, ms),
        clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      },
      shotClockMs,
    });
    schedulerRef.current = scheduler;
    const unsubscribe = useGameStore.subscribe((state, previous) => {
      if (state.data.session?.draft !== previous.data.session?.draft) scheduler.sync();
    });
    scheduler.setActive(isActiveRef.current);
    scheduler.sync();
    return () => {
      unsubscribe();
      scheduler.dispose();
      schedulerRef.current = null;
    };
  }, [shotClockMs]);

  useEffect(() => {
    isActiveRef.current = isActive;
    schedulerRef.current?.setActive(isActive);
  }, [isActive]);

  /** Shot clock time left in ms (null when off); read by the countdown badge. */
  const getShotClockMs = useCallback(
    () => schedulerRef.current?.shotClockRemainingMs() ?? null,
    []
  );

  return { getShotClockMs };
};

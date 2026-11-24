import { useEffect } from "react";
import { AppState } from "react-native";

import { msUntilNextLocalMidnightAt } from "engine";
import { useClockStore } from "stores";
import { appClock } from "utils";

/** A little past midnight, so the new day has certainly begun. */
const MIDNIGHT_MARGIN_MS = 1_000;
/** Belt and braces: re-check at least this often, in case the zone or clock changes while open. */
const MAX_WAIT_MS = 15 * 60_000;

/** The device's offset at any instant, including future daylight-saving changes. */
const offsetAt = (instantMs: number) => new Date(instantMs).getTimezoneOffset();

/**
 * Keeps "today" current without a restart: re-checks when the app returns to the foreground, at
 * the next local midnight (daylight-saving aware) and at least every 15 minutes while open.
 */
export const useDayRollover = () => {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = useClockStore.getState().refresh;

    const scheduleNextCheck = () => {
      if (timer) clearTimeout(timer);
      const untilMidnight = msUntilNextLocalMidnightAt(appClock.now(), offsetAt);
      timer = setTimeout(
        () => {
          refresh();
          scheduleNextCheck();
        },
        Math.min(untilMidnight + MIDNIGHT_MARGIN_MS, MAX_WAIT_MS)
      );
    };

    refresh();
    scheduleNextCheck();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
        scheduleNextCheck();
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, []);
};

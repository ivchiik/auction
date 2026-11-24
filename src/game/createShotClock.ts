export interface ShotClockScheduler {
  now: () => number;
  setTimeout: (callback: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export interface ShotClock {
  /** Starts the clock for one decision. Starting the same turn again keeps it running. */
  start: (turnKey: string, durationMs: number) => void;
  /** App went to the background: stop counting and remember the time left. */
  pause: () => void;
  /** App is active again: continue with the time that was left. */
  resume: () => void;
  /** The turn was played or the screen went away: cancel anything pending. */
  stop: () => void;
  remainingMs: () => number;
  isRunning: () => boolean;
}

/**
 * Framework-free shot clock. `onExpire` fires at most once per turn key, never while paused and
 * never after `stop`, so a timed-out turn cannot act twice even if the screen re-renders or the
 * app resumes. Every armed timer carries a generation number, so a cancelled callback that is
 * still delivered late (an earlier turn, or before a pause) is ignored instead of expiring the
 * current turn. Pass a monotonic `now` (performance.now) so wall-clock changes cannot add or
 * remove time. React and AppState wiring live in the auction container hook.
 */
export const createShotClock = (
  scheduler: ShotClockScheduler,
  onExpire: (turnKey: string) => void
): ShotClock => {
  let turnKey: string | null = null;
  let lastExpiredKey: string | null = null;
  let deadline = 0;
  let remaining = 0;
  let paused = false;
  let handle: unknown = null;
  let generation = 0;

  /** Cancels the pending timer and invalidates any callback already in flight. */
  const cancelTimer = () => {
    generation += 1;
    if (handle !== null) scheduler.clearTimeout(handle);
    handle = null;
  };

  const fire = (armedGeneration: number) => {
    if (armedGeneration !== generation) return;
    handle = null;
    if (turnKey === null || paused) return;
    const expiredKey = turnKey;
    turnKey = null;
    lastExpiredKey = expiredKey;
    onExpire(expiredKey);
  };

  const arm = (ms: number) => {
    cancelTimer();
    const armedGeneration = generation;
    handle = scheduler.setTimeout(() => fire(armedGeneration), Math.max(0, ms));
  };

  return {
    start: (key, durationMs) => {
      if (key === turnKey || key === lastExpiredKey) return;
      turnKey = key;
      paused = false;
      remaining = durationMs;
      deadline = scheduler.now() + durationMs;
      arm(durationMs);
    },
    pause: () => {
      if (turnKey === null || paused) return;
      remaining = Math.max(0, deadline - scheduler.now());
      paused = true;
      cancelTimer();
    },
    resume: () => {
      if (turnKey === null || !paused) return;
      paused = false;
      deadline = scheduler.now() + remaining;
      arm(remaining);
    },
    stop: () => {
      cancelTimer();
      turnKey = null;
      paused = false;
      remaining = 0;
    },
    remainingMs: () => {
      if (turnKey === null) return 0;
      return paused ? remaining : Math.max(0, deadline - scheduler.now());
    },
    isRunning: () => turnKey !== null && !paused,
  };
};

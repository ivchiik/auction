import {
  botRngFor,
  chooseBotAction,
  DraftPhase,
  getStepKey,
  getTimeoutAction,
  hashString,
  SeatKind,
  type DraftAction,
  type DraftState,
} from "engine";

import { createShotClock, type ShotClockScheduler } from "./createShotClock";

/** Bots answer after 600–900 ms: quick enough to keep momentum, slow enough to follow. */
export const BOT_DELAY_MIN_MS = 600;
export const BOT_DELAY_SPREAD_MS = 300;
/** How long a sold/discarded/forced card stays on screen before the next one. */
export const RESOLVED_PAUSE_MS = 1_800;

/** Deterministic think time per decision, so a replay paces itself the same way. */
export const botDelayFor = (stepKey: string): number =>
  BOT_DELAY_MIN_MS + (hashString(stepKey) % (BOT_DELAY_SPREAD_MS + 1));

export interface TableSchedulerOptions {
  /** Must return the freshest store state on every call. */
  getDraft: () => DraftState | null;
  /** Must re-check the step key against fresh state before applying (dispatchForStep). */
  dispatch: (stepKey: string, action: DraftAction) => void;
  /** Monotonic clock plus timers. */
  timers: ShotClockScheduler;
  /** Human shot clock length, or null when off. */
  shotClockMs: number | null;
  resolvedPauseMs?: number;
  /** Called whenever the human shot clock starts, stops or expires, so the UI can refresh. */
  onClockChange?: () => void;
}

export interface TableScheduler {
  /** Look at the current step and schedule whatever should happen next. Call after changes. */
  sync: () => void;
  /** Focus, AppState and overlays: nothing fires while inactive; the shot clock pauses. */
  setActive: (active: boolean) => void;
  /** Time left on the human shot clock, or null when there is no clock. Never negative. */
  shotClockRemainingMs: () => number | null;
  dispose: () => void;
}

/**
 * Drives everything that happens without a tap: bot moves after a think delay, moving past a
 * resolved card after a short pause, and the optional human shot clock. Every callback carries
 * the step key it was scheduled for and re-reads fresh state before dispatching, and every
 * cancellation bumps a generation number, so a late timer can never act on a newer decision.
 */
export const createTableScheduler = (options: TableSchedulerOptions): TableScheduler => {
  const { getDraft, dispatch, timers, shotClockMs } = options;
  const resolvedPauseMs = options.resolvedPauseMs ?? RESOLVED_PAUSE_MS;
  let isActive = false;
  let isDisposed = false;
  let pendingKey: string | null = null;
  let pendingHandle: unknown = null;
  let generation = 0;

  const notifyClock = () => options.onClockChange?.();

  const shotClock = shotClockMs
    ? createShotClock(timers, (expiredKey) => {
        notifyClock();
        const draft = getDraft();
        if (!isActive || isDisposed || !draft || getStepKey(draft) !== expiredKey) return;
        const action = getTimeoutAction(draft);
        if (action) dispatch(expiredKey, action);
      })
    : null;

  const cancelPending = () => {
    generation += 1;
    if (pendingHandle !== null) timers.clearTimeout(pendingHandle);
    pendingHandle = null;
    pendingKey = null;
  };

  const schedule = (stepKey: string, delayMs: number, run: (fresh: DraftState) => void) => {
    if (pendingKey === stepKey && pendingHandle !== null) return;
    cancelPending();
    pendingKey = stepKey;
    const armedGeneration = generation;
    pendingHandle = timers.setTimeout(() => {
      if (armedGeneration !== generation) return;
      pendingHandle = null;
      pendingKey = null;
      const fresh = getDraft();
      if (!isActive || isDisposed || !fresh || getStepKey(fresh) !== stepKey) return;
      run(fresh);
    }, delayMs);
  };

  const sync = () => {
    if (isDisposed) return;
    const draft = getDraft();
    const stepKey = draft ? getStepKey(draft) : null;
    if (!draft || !stepKey) {
      cancelPending();
      shotClock?.stop();
      notifyClock();
      return;
    }
    if (!isActive) {
      cancelPending();
      shotClock?.pause();
      notifyClock();
      return;
    }
    if (draft.phase === DraftPhase.Resolved) {
      shotClock?.stop();
      schedule(stepKey, resolvedPauseMs, () => dispatch(stepKey, { type: "advance" }));
      notifyClock();
      return;
    }
    const turn = draft.lot?.turn ?? null;
    if (turn !== null && draft.seats[turn].kind === SeatKind.Bot) {
      shotClock?.stop();
      schedule(stepKey, botDelayFor(stepKey), (fresh) => {
        const rng = botRngFor(fresh);
        const action = rng ? chooseBotAction(fresh, rng) : null;
        if (action) dispatch(stepKey, action);
      });
      notifyClock();
      return;
    }
    // A person decides: nothing automatic except the optional shot clock.
    cancelPending();
    if (shotClock && shotClockMs) {
      shotClock.start(stepKey, shotClockMs);
      shotClock.resume();
    }
    notifyClock();
  };

  return {
    sync,
    setActive: (active) => {
      if (isDisposed || isActive === active) return;
      isActive = active;
      sync();
    },
    shotClockRemainingMs: () => (shotClock ? shotClock.remainingMs() : null),
    dispose: () => {
      isDisposed = true;
      isActive = false;
      cancelPending();
      shotClock?.stop();
    },
  };
};

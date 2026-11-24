/**
 * The only place the app reads ambient time. Engine and stores receive these readings as
 * arguments, so tests and replays can supply their own.
 */
export const appClock = {
  /** Wall clock: saved timestamps and daily dates. */
  now: (): number => Date.now(),
  /** Monotonic milliseconds for measuring elapsed time (shot clock); immune to clock changes. */
  monotonicNow: (): number => performance.now(),
  /** Minutes to add to local time to get UTC (Date#getTimezoneOffset). */
  timezoneOffsetMinutes: (): number => new Date().getTimezoneOffset(),
};

export interface LatestWriteQueue<T> {
  /** Queue the newest value. Values superseded before their turn are skipped. */
  schedule: (value: T) => void;
  /** Resolves once everything scheduled so far has been written (or failed). */
  flush: () => Promise<void>;
}

/**
 * Serialises writes and always ends on the newest value: one write in flight at a time, and
 * anything scheduled meanwhile collapses to the latest. An older snapshot can therefore never
 * land after a newer one, even when the storage layer is slow.
 */
export const createLatestWriteQueue = <T>(
  write: (value: T) => Promise<unknown>
): LatestWriteQueue<T> => {
  let pending: { value: T } | null = null;
  let running: Promise<void> | null = null;

  const drain = async () => {
    while (pending) {
      const { value } = pending;
      pending = null;
      try {
        await write(value);
      } catch (error) {
        console.warn("[storage] write failed", error);
      }
    }
    running = null;
  };

  return {
    schedule: (value) => {
      pending = { value };
      if (!running) running = drain();
    },
    flush: () => running ?? Promise.resolve(),
  };
};

/** The slice of AsyncStorage the app uses. Tests pass an in-memory implementation. */
export interface KeyValueStore {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Durable keys. Versioned so a format change can move to a new key instead of migrating.
 * Game data (active draft, reveal state, daily attempts, history) is one document under one key,
 * so a single write changes all of it together.
 */
export const STORAGE_KEYS = {
  gameData: "paddle.game.v1",
  settings: "paddle.settings.v1",
} as const;

/** `ok: false` means the device storage itself failed, which is different from "nothing saved". */
export type ReadTextResult = { ok: true; text: string | null } | { ok: false };

export const readText = async (store: KeyValueStore, key: string): Promise<ReadTextResult> => {
  try {
    return { ok: true, text: await store.getItem(key) };
  } catch (error) {
    console.warn(`[storage] could not read ${key}`, error);
    return { ok: false };
  }
};

/** Reads and parses JSON for data with safe defaults. Missing, unreadable or invalid -> null. */
export const readJson = async (store: KeyValueStore, key: string): Promise<unknown> => {
  const read = await readText(store, key);
  if (!read.ok || read.text === null) return null;
  try {
    return JSON.parse(read.text) as unknown;
  } catch (error) {
    console.warn(`[storage] ${key} is not valid JSON`, error);
    return null;
  }
};

export const writeText = async (
  store: KeyValueStore,
  key: string,
  text: string
): Promise<boolean> => {
  try {
    await store.setItem(key, text);
    return true;
  } catch (error) {
    console.warn(`[storage] could not write ${key}`, error);
    return false;
  }
};

export const writeJson = (store: KeyValueStore, key: string, value: unknown): Promise<boolean> =>
  writeText(store, key, JSON.stringify(value));

export const removeKey = async (store: KeyValueStore, key: string): Promise<boolean> => {
  try {
    await store.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[storage] could not remove ${key}`, error);
    return false;
  }
};

/** In-memory store for tests and as a last-resort fallback. */
export const createMemoryStore = (initial: Record<string, string> = {}): KeyValueStore => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
};

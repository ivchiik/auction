import { asyncStorageKv } from "./asyncStorageKv";
import {
  readJson,
  readText,
  removeKey,
  STORAGE_KEYS,
  writeJson,
  writeText,
  type ReadTextResult,
} from "./keyValueStore";
import { parseSettings, type AppSettings } from "./settings";
import { createLatestWriteQueue } from "./writeQueue";

/** Device-backed persistence used by the app's stores. */

export const loadSettings = async (): Promise<AppSettings> =>
  parseSettings(await readJson(asyncStorageKv, STORAGE_KEYS.settings));

/** Settings writes are serialised too, so fast toggling always ends on the last value. */
export const settingsWriter = createLatestWriteQueue<AppSettings>((settings) =>
  writeJson(asyncStorageKv, STORAGE_KEYS.settings, settings)
);

/** Raw text of the game data document; `ok: false` means the device storage failed. */
export const readGameDataText = (): Promise<ReadTextResult> =>
  readText(asyncStorageKv, STORAGE_KEYS.gameData);

/** One serialised writer for the whole game data document (latest snapshot wins). */
export const gameDataWriter = createLatestWriteQueue<string>((text) =>
  writeText(asyncStorageKv, STORAGE_KEYS.gameData, text)
);

/** Pre-release keys from the phase 1 build; removed once so nothing stale lingers. */
const LEGACY_KEYS = ["paddle.activeDraft.v1", "paddle.dailyRecords.v1"];

export const removeLegacyKeys = async (): Promise<void> => {
  await Promise.all(LEGACY_KEYS.map((key) => removeKey(asyncStorageKv, key)));
};

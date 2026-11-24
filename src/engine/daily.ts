import { createRng, deriveSeed } from "./rng";
import { BotPersonality } from "./types";

const DAY_MS = 86_400_000;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Bump to reshuffle every daily without touching saved history keys. */
export const DAILY_SEED_VERSION = "daily-v1";

const PERSONALITIES: readonly BotPersonality[] = [
  BotPersonality.Accountant,
  BotPersonality.Shark,
  BotPersonality.Gambler,
];

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Local calendar day (YYYY-MM-DD) for a timestamp. Pass Date#getTimezoneOffset() for the
 * device zone (UTC minus local, in minutes); the engine never reads the clock itself.
 */
export const toDateKey = (timestampMs: number, timezoneOffsetMinutes: number): string => {
  const local = new Date(timestampMs - timezoneOffsetMinutes * 60_000);
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
};

/**
 * Milliseconds until the next local midnight in a zone whose offset can change (daylight saving).
 * `offsetAt(ms)` returns Date#getTimezoneOffset() for that instant (UTC minus local, minutes); the
 * caller injects it, so the engine never reads the device zone. The midnight instant is found with
 * the offset that will be in force then, which makes 23- and 25-hour days come out right.
 */
export const msUntilNextLocalMidnightAt = (
  timestampMs: number,
  offsetAt: (instantMs: number) => number
): number => {
  const local = new Date(timestampMs - offsetAt(timestampMs) * 60_000);
  const midnightAsUtc = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + 1
  );
  const firstGuess = midnightAsUtc + offsetAt(timestampMs) * 60_000;
  const midnight = midnightAsUtc + offsetAt(firstGuess) * 60_000;
  return Math.max(1, midnight - timestampMs);
};

/** Fixed-offset form of `msUntilNextLocalMidnightAt` (no daylight-saving change ahead). */
export const msUntilNextLocalMidnight = (
  timestampMs: number,
  timezoneOffsetMinutes: number
): number => msUntilNextLocalMidnightAt(timestampMs, () => timezoneOffsetMinutes);

const dateKeyToUtcMs = (dateKey: string): number | null => {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return ms;
};

export const isDateKey = (value: unknown): value is string =>
  typeof value === "string" && dateKeyToUtcMs(value) !== null;

export const addDays = (dateKey: string, days: number): string => {
  const ms = dateKeyToUtcMs(dateKey);
  if (ms === null) return dateKey;
  const shifted = new Date(ms + days * DAY_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
};

/** Same date and topic, same seed, on every device. Not linked to the website's dailies. */
export const dailySeed = (dateKey: string, topicId: string): number =>
  deriveSeed(DAILY_SEED_VERSION, dateKey, topicId);

export interface DailyPlan {
  dateKey: string;
  topicId: string;
  seed: number;
  packId: string;
  opponent: BotPersonality;
}

/** Picks the pack and the computer opponent for one topic's daily draft. */
export const createDailyPlan = (
  dateKey: string,
  topicId: string,
  packIds: readonly string[]
): DailyPlan | null => {
  if (!isDateKey(dateKey) || packIds.length === 0) return null;
  const seed = dailySeed(dateKey, topicId);
  const rng = createRng(deriveSeed(seed, "plan"));
  const packId = [...packIds].sort()[rng.int(0, packIds.length - 1)];
  const opponent = PERSONALITIES[rng.int(0, PERSONALITIES.length - 1)];
  return { dateKey, topicId, seed, packId, opponent };
};

export interface Streak {
  current: number;
  best: number;
}

/**
 * Consecutive days with at least one finished daily. Today not being played yet does not
 * break the current streak until the day is over.
 */
export const computeStreak = (playedDateKeys: readonly string[], todayKey: string): Streak => {
  const days = [...new Set(playedDateKeys.filter(isDateKey))].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  const played = new Set(days);
  let cursor = played.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let current = 0;
  while (played.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, best };
};

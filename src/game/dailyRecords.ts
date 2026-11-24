import { isDateKey, MAX_SEATS } from "engine";

/** Local-only record of daily drafts. Never synchronised with the website. */
export enum DailyAttemptStatus {
  /** Started: the one attempt for that topic and day is used, even if abandoned. */
  InProgress = "inProgress",
  Finished = "finished",
}

export interface DailyResult {
  rank: number;
  isWinner: boolean;
  isTie: boolean;
  totalRating: number;
  moneyLeft: number;
}

export interface DailyAttempt {
  dateKey: string;
  topicId: string;
  packId: string;
  draftId: string;
  status: DailyAttemptStatus;
  startedAt: number;
  finishedAt: number | null;
  result: DailyResult | null;
}

export interface DailyRecords {
  version: 1;
  attempts: DailyAttempt[];
}

/** About three months of five dailies a day. */
export const MAX_DAILY_ATTEMPTS = 500;
/** Generous ceilings that still reject absurd stored numbers before they reach the screen. */
const MAX_TOTAL_RATING = 10_000;
const MAX_MONEY = 1_000;

export const createEmptyDailyRecords = (): DailyRecords => ({ version: 1, attempts: [] });

/** Optional catalog cross-check: an attempt must name a known pack of the same topic. */
export type PackTopicLookup = (packId: string) => string | null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isWholeInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

const isTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const parseResult = (value: unknown): DailyResult | null => {
  if (!isRecord(value)) return null;
  const { rank, isWinner, isTie, totalRating, moneyLeft } = value;
  if (!isWholeInRange(rank, 1, MAX_SEATS) || typeof isWinner !== "boolean") return null;
  if (typeof isTie !== "boolean") return null;
  if (!isWholeInRange(totalRating, 0, MAX_TOTAL_RATING)) return null;
  if (!isWholeInRange(moneyLeft, 0, MAX_MONEY)) return null;
  return { rank, isWinner, isTie, totalRating, moneyLeft };
};

const parseAttempt = (value: unknown, packTopic?: PackTopicLookup): DailyAttempt | null => {
  if (!isRecord(value)) return null;
  const { dateKey, topicId, packId, draftId, status, startedAt, finishedAt } = value;
  if (!isDateKey(dateKey) || typeof topicId !== "string" || typeof packId !== "string") return null;
  if (packTopic && packTopic(packId) !== topicId) return null;
  if (typeof draftId !== "string" || !isTimestamp(startedAt)) return null;
  if (status !== DailyAttemptStatus.InProgress && status !== DailyAttemptStatus.Finished) {
    return null;
  }
  const result = parseResult(value.result);
  if (status === DailyAttemptStatus.Finished && (!isTimestamp(finishedAt) || !result)) {
    return null;
  }
  return {
    dateKey,
    topicId,
    packId,
    draftId,
    status,
    startedAt,
    finishedAt: isTimestamp(finishedAt) ? finishedAt : null,
    result: status === DailyAttemptStatus.Finished ? result : null,
  };
};

/**
 * Keeps every well-formed attempt (first one wins per day and topic); drops the rest, so bad
 * local data can never show NaN scores or block today's attempt with a broken record.
 */
export const parseDailyRecords = (raw: unknown, packTopic?: PackTopicLookup): DailyRecords => {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.attempts)) {
    return createEmptyDailyRecords();
  }
  const seen = new Set<string>();
  const attempts: DailyAttempt[] = [];
  for (const entry of raw.attempts) {
    const attempt = parseAttempt(entry, packTopic);
    if (!attempt) continue;
    const key = `${attempt.dateKey}|${attempt.topicId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    attempts.push(attempt);
  }
  return { version: 1, attempts: attempts.slice(-MAX_DAILY_ATTEMPTS) };
};

export const findDailyAttempt = (
  records: DailyRecords,
  dateKey: string,
  topicId: string
): DailyAttempt | null =>
  records.attempts.find((entry) => entry.dateKey === dateKey && entry.topicId === topicId) ?? null;

/** Returns updated records, or null when that day's topic has already been attempted. */
export const startDailyAttempt = (
  records: DailyRecords,
  attempt: Pick<DailyAttempt, "dateKey" | "topicId" | "packId" | "draftId" | "startedAt">
): DailyRecords | null => {
  if (findDailyAttempt(records, attempt.dateKey, attempt.topicId)) return null;
  const started: DailyAttempt = {
    ...attempt,
    status: DailyAttemptStatus.InProgress,
    finishedAt: null,
    result: null,
  };
  return { version: 1, attempts: [...records.attempts, started].slice(-MAX_DAILY_ATTEMPTS) };
};

/** Idempotent start: keeps an existing attempt for that day and topic untouched. */
export const ensureDailyAttempt = (
  records: DailyRecords,
  attempt: Pick<DailyAttempt, "dateKey" | "topicId" | "packId" | "draftId" | "startedAt">
): DailyRecords => startDailyAttempt(records, attempt) ?? records;

/** Marks an attempt finished. Finishing twice keeps the first result. */
export const finishDailyAttempt = (
  records: DailyRecords,
  dateKey: string,
  topicId: string,
  finishedAt: number,
  result: DailyResult
): DailyRecords => ({
  version: 1,
  attempts: records.attempts.map((entry) =>
    entry.dateKey === dateKey &&
    entry.topicId === topicId &&
    entry.status === DailyAttemptStatus.InProgress
      ? { ...entry, status: DailyAttemptStatus.Finished, finishedAt, result }
      : entry
  ),
});

export const finishedDateKeys = (records: DailyRecords): string[] =>
  records.attempts
    .filter((entry) => entry.status === DailyAttemptStatus.Finished)
    .map((entry) => entry.dateKey);

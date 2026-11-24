import { getPack, type ContentPack } from "data";
import { DraftMode, DraftPhase, parseDraftState, type DraftState } from "engine";

import { createEmptyDailyRecords, ensureDailyAttempt, parseDailyRecords } from "./dailyRecords";
import { parseHistoryRecords } from "./history";
import { recordReveal } from "./session";
import {
  GAME_DATA_VERSION,
  GameDataNotice,
  type ActiveSession,
  type GameData,
  type SessionOptions,
} from "./types";

/** Shot clocks longer than this in a save are treated as corrupt. */
const MAX_SHOT_CLOCK_MS = 120_000;

export const createEmptyGameData = (): GameData => ({
  version: GAME_DATA_VERSION,
  session: null,
  daily: createEmptyDailyRecords(),
  history: [],
});

export interface ParsedGameData {
  data: GameData;
  notice: GameDataNotice | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseOptions = (value: unknown): SessionOptions | null => {
  if (!isRecord(value)) return null;
  const { shotClockMs } = value;
  if (shotClockMs === null) return { shotClockMs: null };
  if (
    typeof shotClockMs === "number" &&
    Number.isInteger(shotClockMs) &&
    shotClockMs > 0 &&
    shotClockMs <= MAX_SHOT_CLOCK_MS
  ) {
    return { shotClockMs };
  }
  return null;
};

/** The draft must still match the shipped pack card for card, or resuming would lie. */
const matchesShippedPack = (draft: DraftState, pack: ContentPack, packVersion: string) => {
  if (pack.version !== packVersion || draft.pool.length !== pack.cards.length) return false;
  const shipped = new Map(pack.cards.map((card) => [card.id, card]));
  return draft.pool.every((card) => {
    const current = shipped.get(card.id);
    return !!current && current.position === card.position && current.rating === card.rating;
  });
};

type SessionParse = { session: ActiveSession | null; discarded: boolean };

const parseSession = (value: unknown): SessionParse => {
  if (value === null || value === undefined) return { session: null, discarded: false };
  const discard: SessionParse = { session: null, discarded: true };
  if (!isRecord(value)) return discard;
  const { packVersion, revealed, startedAt } = value;
  const options = parseOptions(value.options);
  if (typeof packVersion !== "string" || typeof revealed !== "boolean" || !options) return discard;
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt) || startedAt <= 0) {
    return discard;
  }
  const parsed = parseDraftState(value.draft);
  if (!parsed.ok) return discard;
  const draft = parsed.value;
  const pack = getPack(draft.packId);
  if (!pack || !matchesShippedPack(draft, pack, packVersion)) return discard;
  if (revealed && draft.phase !== DraftPhase.Complete) return discard;
  if (draft.mode === DraftMode.Daily && !draft.dailyKey) return discard;
  return { session: { draft, packVersion, options, revealed, startedAt }, discarded: false };
};

/**
 * Repairs the only cross-section facts the rules depend on, in case a save was cut short or
 * edited: a daily draft always holds its attempt, and a revealed draft is always in history.
 */
const reconcile = (data: GameData): GameData => {
  const session = data.session;
  if (!session) return data;
  let next = data;
  const { draft } = session;
  const pack = getPack(draft.packId);
  if (draft.mode === DraftMode.Daily && draft.dailyKey && pack) {
    next = {
      ...next,
      daily: ensureDailyAttempt(next.daily, {
        dateKey: draft.dailyKey,
        topicId: pack.topic,
        packId: pack.id,
        draftId: draft.id,
        startedAt: session.startedAt,
      }),
    };
  }
  if (session.revealed && !next.history.some((record) => record.id === draft.id)) {
    next = recordReveal(next, draft.updatedAt);
  }
  return next;
};

/**
 * Turns stored text into trusted game data. Never throws. Unreadable data resets with a notice;
 * an untrustworthy draft is dropped with a notice while history and dailies are kept.
 */
export const parseGameData = (text: string | null): ParsedGameData => {
  if (text === null) return { data: createEmptyGameData(), notice: null };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { data: createEmptyGameData(), notice: GameDataNotice.DataReset };
  }
  if (!isRecord(raw) || raw.version !== GAME_DATA_VERSION) {
    return { data: createEmptyGameData(), notice: GameDataNotice.DataReset };
  }
  const daily = parseDailyRecords(raw.daily, (packId) => getPack(packId)?.topic ?? null);
  const history = parseHistoryRecords(raw.history);
  const { session, discarded } = parseSession(raw.session);
  const data = reconcile({ version: GAME_DATA_VERSION, session, daily, history });
  return { data, notice: discarded ? GameDataNotice.SessionDiscarded : null };
};

export const serializeGameData = (data: GameData): string => JSON.stringify(data);

import type { BotPersonality, DraftMode, DraftState, SeatKind } from "engine";

import type { DailyRecords } from "./dailyRecords";

export const GAME_DATA_VERSION = 1;
/** Completed drafts kept on the device. */
export const MAX_HISTORY = 60;
/** "Make it quick": ten seconds per human decision. */
export const SHOT_CLOCK_MS = 10_000;

export interface SessionOptions {
  /** Human shot clock length in milliseconds, or null when the clock is off. */
  shotClockMs: number | null;
}

/** The one draft in progress (or finished but not yet left). */
export interface ActiveSession {
  draft: DraftState;
  /** Content version the draft was dealt from; a changed pack invalidates the save. */
  packVersion: string;
  options: SessionOptions;
  /** True once the verdict was revealed; its result is then already in history. */
  revealed: boolean;
  startedAt: number;
}

export interface HistoryPick {
  cardId: string;
  name: string;
  subtitle: string;
  price: number;
  rating: number;
  basis: string;
}

export interface HistorySeat {
  name: string;
  kind: SeatKind;
  personality: BotPersonality | null;
  totalRating: number;
  rank: number;
  isWinner: boolean;
  grade: string;
  spent: number;
  moneyLeft: number;
  picks: HistoryPick[];
}

export interface HistoryHighlight {
  seat: number;
  cardId: string;
  name: string;
  price: number;
  rating: number;
  /** Dollars this table's spending implies the pick was worth. */
  tableValue: number;
}

/** A finished, revealed draft. Names and ratings are copied in so history outlives content. */
export interface HistoryRecord {
  id: string;
  finishedAt: number;
  packId: string;
  packTitle: string;
  packSubtitle: string;
  topicId: string;
  mode: DraftMode;
  dailyKey: string | null;
  isTie: boolean;
  seats: HistorySeat[];
  bestBuy: HistoryHighlight | null;
  biggestOverpay: HistoryHighlight | null;
}

/** Everything about play that persists, saved as one document so it changes atomically. */
export interface GameData {
  version: typeof GAME_DATA_VERSION;
  session: ActiveSession | null;
  daily: DailyRecords;
  history: HistoryRecord[];
}

export enum GameDataNotice {
  /** The saved draft could not be trusted and was cleared; history and dailies were kept. */
  SessionDiscarded = "sessionDiscarded",
  /** Saved data was unreadable and had to be reset. */
  DataReset = "dataReset",
  /** Device storage could not be read; nothing is written this session so nothing is lost. */
  StorageUnavailable = "storageUnavailable",
}

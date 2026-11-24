import { getCatalogCard as getPackCard, type ContentPack } from "data";
import {
  BotPersonality,
  computeVerdict,
  DraftMode,
  getCard,
  Grade,
  isDateKey,
  MAX_SEATS,
  MIN_SEATS,
  SeatKind,
  type DraftState,
  type PickHighlight,
} from "engine";

import {
  MAX_HISTORY,
  type HistoryHighlight,
  type HistoryPick,
  type HistoryRecord,
  type HistorySeat,
} from "./types";

const roundTenths = (value: number) => Math.round(value * 10) / 10;

/** Freezes a finished draft into a self-contained record (names and ratings copied in). */
export const buildHistoryRecord = (
  draft: DraftState,
  pack: ContentPack,
  finishedAt: number
): HistoryRecord => {
  const verdict = computeVerdict(draft);
  const describe = (cardId: string, price: number): HistoryPick => {
    const content = getPackCard(pack, cardId);
    return {
      cardId,
      name: content?.name ?? cardId,
      subtitle: content?.subtitle ?? "",
      price,
      rating: getCard(draft, cardId)?.rating ?? 0,
      basis: content?.ratingBasis ?? "",
    };
  };
  const highlight = (entry: PickHighlight | null): HistoryHighlight | null =>
    entry
      ? {
          seat: entry.seat,
          cardId: entry.cardId,
          name: getPackCard(pack, entry.cardId)?.name ?? entry.cardId,
          price: entry.price,
          rating: entry.rating,
          tableValue: roundTenths(entry.tableValue),
        }
      : null;

  return {
    id: draft.id,
    finishedAt,
    packId: pack.id,
    packTitle: pack.title,
    packSubtitle: pack.subtitle,
    topicId: pack.topic,
    mode: draft.mode,
    dailyKey: draft.dailyKey,
    isTie: verdict.isTie,
    seats: draft.seats.map((seat, index): HistorySeat => {
      const result = verdict.results[index];
      return {
        name: seat.name,
        kind: seat.kind,
        personality: seat.personality,
        totalRating: result.totalRating,
        rank: result.rank,
        isWinner: result.isWinner,
        grade: result.grade,
        spent: result.spent,
        moneyLeft: result.moneyLeft,
        picks: seat.roster.map((entry) => describe(entry.cardId, entry.price)),
      };
    }),
    bestBuy: highlight(verdict.bestBuy),
    biggestOverpay: highlight(verdict.biggestOverpay),
  };
};

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isWhole = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
const isText = (value: unknown, max = 200): value is string =>
  typeof value === "string" && value.length <= max;
const isOneOf = <T extends string>(values: Record<string, T>, value: unknown): value is T =>
  Object.values(values).includes(value as T);

const MAX_MONEY = 1_000;
const MAX_TOTAL = 10_000;
const MAX_PICKS = 20;

const parsePick = (value: unknown): HistoryPick | null => {
  if (!isRecord(value)) return null;
  const { cardId, name, subtitle, price, rating, basis } = value;
  if (!isText(cardId) || !isText(name) || !isText(subtitle) || !isText(basis, 400)) return null;
  if (!isWhole(price, 1, MAX_MONEY) || !isWhole(rating, 0, 100)) return null;
  return { cardId, name, subtitle, price, rating, basis };
};

const parseSeat = (value: unknown): HistorySeat | null => {
  if (!isRecord(value) || !isText(value.name, 60) || !isOneOf(SeatKind, value.kind)) return null;
  const personality = value.personality;
  if (personality !== null && !isOneOf(BotPersonality, personality)) return null;
  const { totalRating, rank, isWinner, grade, spent, moneyLeft } = value;
  if (!isWhole(totalRating, 0, MAX_TOTAL) || !isWhole(rank, 1, MAX_SEATS)) return null;
  if (typeof isWinner !== "boolean" || !isOneOf(Grade, grade)) return null;
  if (!isWhole(spent, 0, MAX_MONEY) || !isWhole(moneyLeft, 0, MAX_MONEY)) return null;
  if (!Array.isArray(value.picks) || value.picks.length > MAX_PICKS) return null;
  const picks = value.picks.map(parsePick);
  if (picks.some((pick) => pick === null)) return null;
  return {
    name: value.name,
    kind: value.kind,
    personality: personality as BotPersonality | null,
    totalRating,
    rank,
    isWinner,
    grade,
    spent,
    moneyLeft,
    picks: picks as HistoryPick[],
  };
};

const parseHighlight = (value: unknown, seatCount: number): HistoryHighlight | null | undefined => {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const { seat, cardId, name, price, rating, tableValue } = value;
  if (!isWhole(seat, 0, seatCount - 1) || !isText(cardId) || !isText(name)) return undefined;
  if (!isWhole(price, 1, MAX_MONEY) || !isWhole(rating, 0, 100)) return undefined;
  if (typeof tableValue !== "number" || !Number.isFinite(tableValue) || tableValue < 0) {
    return undefined;
  }
  return { seat, cardId, name, price, rating, tableValue };
};

const parseRecord = (value: unknown): HistoryRecord | null => {
  if (!isRecord(value)) return null;
  const { id, finishedAt, packId, packTitle, packSubtitle, topicId, mode, dailyKey, isTie } = value;
  if (!isText(id) || !isText(packId) || !isText(packTitle) || !isText(packSubtitle)) return null;
  if (!isText(topicId) || !isOneOf(DraftMode, mode) || typeof isTie !== "boolean") return null;
  if (typeof finishedAt !== "number" || !Number.isFinite(finishedAt) || finishedAt <= 0) {
    return null;
  }
  if (dailyKey !== null && !isDateKey(dailyKey)) return null;
  if (!Array.isArray(value.seats)) return null;
  if (value.seats.length < MIN_SEATS || value.seats.length > MAX_SEATS) return null;
  const seats = value.seats.map(parseSeat);
  if (seats.some((seat) => seat === null)) return null;
  const bestBuy = parseHighlight(value.bestBuy, seats.length);
  const biggestOverpay = parseHighlight(value.biggestOverpay, seats.length);
  if (bestBuy === undefined || biggestOverpay === undefined) return null;
  return {
    id,
    finishedAt,
    packId,
    packTitle,
    packSubtitle,
    topicId,
    mode,
    dailyKey: dailyKey as string | null,
    isTie,
    seats: seats as HistorySeat[],
    bestBuy,
    biggestOverpay,
  };
};

/** Keeps well-formed records only (first copy of each id), newest first, capped. */
export const parseHistoryRecords = (raw: unknown): HistoryRecord[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const records: HistoryRecord[] = [];
  for (const entry of raw) {
    const record = parseRecord(entry);
    if (!record || seen.has(record.id)) continue;
    seen.add(record.id);
    records.push(record);
  }
  return records.sort((a, b) => b.finishedAt - a.finishedAt).slice(0, MAX_HISTORY);
};

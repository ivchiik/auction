import { getPack } from "data";
import { DraftMode, DraftPhase, SeatKind, type DraftState } from "engine";

import { finishDailyAttempt, startDailyAttempt } from "./dailyRecords";
import { buildHistoryRecord } from "./history";
import { MAX_HISTORY, type GameData, type SessionOptions } from "./types";

export enum SessionBlock {
  /** Another draft is unfinished; the player must confirm replacing it. */
  UnfinishedSession = "unfinishedSession",
  /** Today's attempt for this topic was already used. */
  DailyAlreadyPlayed = "dailyAlreadyPlayed",
  UnknownPack = "unknownPack",
  NoSession = "noSession",
  NotComplete = "notComplete",
}

export type SessionChange = { ok: true; data: GameData } | { ok: false; reason: SessionBlock };

const block = (reason: SessionBlock): SessionChange => ({ ok: false, reason });

/** A draft that is still being played, or finished but not yet revealed. */
export const hasUnfinishedSession = (data: GameData): boolean =>
  !!data.session && !data.session.revealed;

export interface StartSessionInput {
  draft: DraftState;
  options: SessionOptions;
  now: number;
  /** Set only after the player confirmed ending the unfinished draft. */
  replaceUnfinished: boolean;
}

/**
 * Starts a draft. For a daily draft the attempt is reserved in the same change, so a crash can
 * never leave a playable daily without its attempt used. Replacing an unfinished draft abandons
 * it: if that was a daily, its attempt stays used.
 */
export const startSession = (data: GameData, input: StartSessionInput): SessionChange => {
  const pack = getPack(input.draft.packId);
  if (!pack) return block(SessionBlock.UnknownPack);
  if (hasUnfinishedSession(data) && !input.replaceUnfinished) {
    return block(SessionBlock.UnfinishedSession);
  }
  let daily = data.daily;
  if (input.draft.mode === DraftMode.Daily) {
    if (!input.draft.dailyKey) return block(SessionBlock.UnknownPack);
    const reserved = startDailyAttempt(daily, {
      dateKey: input.draft.dailyKey,
      topicId: pack.topic,
      packId: pack.id,
      draftId: input.draft.id,
      startedAt: input.now,
    });
    if (!reserved) return block(SessionBlock.DailyAlreadyPlayed);
    daily = reserved;
  }
  return {
    ok: true,
    data: {
      ...data,
      daily,
      session: {
        draft: input.draft,
        packVersion: pack.version,
        options: input.options,
        revealed: false,
        startedAt: input.now,
      },
    },
  };
};

/** Replaces the session's draft after an engine transition (ignored for any other draft). */
export const updateSessionDraft = (data: GameData, draft: DraftState): GameData => {
  const session = data.session;
  if (!session || session.revealed || session.draft.id !== draft.id) return data;
  return { ...data, session: { ...session, draft } };
};

/**
 * Marks a complete draft revealed and records its result in the same change: history gets the
 * record exactly once and a daily attempt is finished with the human's result.
 */
export const recordReveal = (data: GameData, now: number): GameData => {
  const session = data.session;
  if (!session || session.draft.phase !== DraftPhase.Complete) return data;
  const pack = getPack(session.draft.packId);
  if (!pack) return data;
  const { draft } = session;
  const record = buildHistoryRecord(draft, pack, now);
  const history = data.history.some((entry) => entry.id === record.id)
    ? data.history
    : [record, ...data.history].slice(0, MAX_HISTORY);

  let daily = data.daily;
  if (draft.mode === DraftMode.Daily && draft.dailyKey) {
    const humanIndex = Math.max(
      0,
      draft.seats.findIndex((seat) => seat.kind === SeatKind.Human)
    );
    const seat = record.seats[humanIndex];
    daily = finishDailyAttempt(daily, draft.dailyKey, pack.topic, now, {
      rank: seat.rank,
      isWinner: seat.isWinner,
      isTie: record.isTie,
      totalRating: seat.totalRating,
      moneyLeft: seat.moneyLeft,
    });
  }
  return { ...data, history, daily, session: { ...session, revealed: true } };
};

export const revealSession = (data: GameData, now: number): SessionChange => {
  if (!data.session) return block(SessionBlock.NoSession);
  if (data.session.draft.phase !== DraftPhase.Complete) return block(SessionBlock.NotComplete);
  if (data.session.revealed) return { ok: true, data };
  return { ok: true, data: recordReveal(data, now) };
};

/** Leaves a revealed draft (its result is already in history). Unfinished drafts stay. */
export const closeSession = (data: GameData): GameData =>
  data.session?.revealed ? { ...data, session: null } : data;

/** Ends the draft without a result. A daily attempt it used stays used: no fresh retry. */
export const abandonSession = (data: GameData): GameData =>
  data.session ? { ...data, session: null } : data;

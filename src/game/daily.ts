import {
  getPack,
  getPacksForTopic,
  isQuickPack,
  rulesForPack,
  toEngineCards,
  TOPIC_ORDER,
  type ContentPack,
  type TopicId,
} from "data";
import {
  computeStreak,
  createDailyPlan,
  DraftMode,
  SeatKind,
  type CreateDraftInput,
  type DailyPlan,
  type Streak,
} from "engine";

import {
  DailyAttemptStatus,
  findDailyAttempt,
  finishedDateKeys,
  type DailyAttempt,
} from "./dailyRecords";
import type { GameData } from "./types";

export enum DailyTopicState {
  Available = "available",
  /** Started and still resumable as the active draft. */
  InProgress = "inProgress",
  /** Started, then ended without a result: the attempt is used. */
  Abandoned = "abandoned",
  Completed = "completed",
  /** No pack for this topic (should not happen with the shipped catalog). */
  Unavailable = "unavailable",
}

export interface DailyTopicStatus {
  topicId: TopicId;
  state: DailyTopicState;
  plan: DailyPlan | null;
  pack: ContentPack | null;
  attempt: DailyAttempt | null;
}

export const getDailyTopicStatus = (
  data: GameData,
  dateKey: string,
  topicId: TopicId
): DailyTopicStatus => {
  // Dailies stay short: only the quick $20, five-pick packs take part, never full lineups.
  const plan = createDailyPlan(
    dateKey,
    topicId,
    getPacksForTopic(topicId)
      .filter(isQuickPack)
      .map((pack) => pack.id)
  );
  const attempt = findDailyAttempt(data.daily, dateKey, topicId);
  // An attempt keeps the pack it was played with, even if the catalog changes later.
  const pack = getPack(attempt?.packId ?? plan?.packId ?? "");
  if (!plan || !pack) return { topicId, state: DailyTopicState.Unavailable, plan, pack, attempt };
  if (!attempt) return { topicId, state: DailyTopicState.Available, plan, pack, attempt };
  if (attempt.status === DailyAttemptStatus.Finished) {
    return { topicId, state: DailyTopicState.Completed, plan, pack, attempt };
  }
  const isLive = data.session?.draft.id === attempt.draftId;
  return {
    topicId,
    state: isLive ? DailyTopicState.InProgress : DailyTopicState.Abandoned,
    plan,
    pack,
    attempt,
  };
};

export interface DailyBoard {
  dateKey: string;
  topics: DailyTopicStatus[];
  completed: number;
  total: number;
  streak: Streak;
}

export const getDailyBoard = (data: GameData, dateKey: string): DailyBoard => {
  const topics = TOPIC_ORDER.map((topic) => getDailyTopicStatus(data, dateKey, topic));
  return {
    dateKey,
    topics,
    completed: topics.filter((topic) => topic.state === DailyTopicState.Completed).length,
    total: topics.length,
    streak: computeStreak(finishedDateKeys(data.daily), dateKey),
  };
};

/**
 * The fixed daily table: one human against the seeded opponent on the seeded deck. The draft id
 * is derived from date and topic, so the same daily can never exist twice.
 */
export const buildDailyDraftInput = (
  plan: DailyPlan,
  pack: ContentPack,
  names: { you: string; opponent: string }
): Omit<CreateDraftInput, "now"> => ({
  packId: pack.id,
  rules: rulesForPack(pack),
  pool: toEngineCards(pack),
  seats: [
    { id: "you", name: names.you, kind: SeatKind.Human },
    { id: "rival", name: names.opponent, kind: SeatKind.Bot, personality: plan.opponent },
  ],
  seed: plan.seed,
  mode: DraftMode.Daily,
  dailyKey: plan.dateKey,
  draftId: `daily-${plan.dateKey}-${plan.topicId}`,
});

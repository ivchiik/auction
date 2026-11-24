import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getPack, rulesForPack, toEngineCards, TopicId, type ContentPack } from "data";
import {
  BotPersonality,
  createDailyPlan,
  createDraft,
  DraftPhase,
  runDraft,
  SeatKind,
  type DraftState,
} from "engine";

import {
  buildDailyDraftInput,
  DailyTopicState,
  getDailyBoard,
  getDailyTopicStatus,
} from "../daily";
import { DailyAttemptStatus, findDailyAttempt } from "../dailyRecords";
import { createEmptyGameData, parseGameData, serializeGameData } from "../gameData";
import {
  abandonSession,
  closeSession,
  recordReveal,
  revealSession,
  SessionBlock,
  startSession,
  updateSessionDraft,
} from "../session";
import { GameDataNotice, type GameData } from "../types";

const NOW = Date.UTC(2026, 10, 24, 20);
const TODAY = "2026-11-24";
const TOMORROW = "2026-11-25";
const OPTIONS = { shotClockMs: null };
const nfl = getPack("nfl-quarterbacks") as ContentPack;

const quickDraft = (seed = 1): DraftState => {
  const result = createDraft({
    packId: nfl.id,
    rules: rulesForPack(nfl),
    pool: toEngineCards(nfl),
    seats: [
      { id: "a", name: "You", kind: SeatKind.Human },
      { id: "b", name: "The Shark", kind: SeatKind.Bot, personality: BotPersonality.Shark },
    ],
    seed,
    now: NOW,
  });
  assert.ok(result.ok);
  return result.value;
};

const dailyDraft = (dateKey: string, topic: TopicId): DraftState => {
  const status = getDailyTopicStatus(createEmptyGameData(), dateKey, topic);
  assert.ok(status.plan && status.pack);
  const result = createDraft({
    ...buildDailyDraftInput(status.plan, status.pack, { you: "You", opponent: "Rival" }),
    now: NOW,
  });
  assert.ok(result.ok);
  return result.value;
};

const start = (data: GameData, draft: DraftState, replaceUnfinished = false): GameData => {
  const change = startSession(data, { draft, options: OPTIONS, now: NOW, replaceUnfinished });
  assert.ok(change.ok, change.ok ? "" : change.reason);
  return change.data;
};

const finish = (data: GameData): GameData => {
  assert.ok(data.session);
  const end = runDraft(data.session.draft, { now: NOW + 60_000 });
  assert.equal(end.phase, DraftPhase.Complete);
  return updateSessionDraft(data, end);
};

const roundTrip = (data: GameData) => parseGameData(serializeGameData(data));

describe("sessions", () => {
  it("never replace an unfinished draft without confirmation", () => {
    const first = start(createEmptyGameData(), quickDraft(1));
    const refused = startSession(first, {
      draft: quickDraft(2),
      options: OPTIONS,
      now: NOW,
      replaceUnfinished: false,
    });
    assert.deepEqual(refused, { ok: false, reason: SessionBlock.UnfinishedSession });
    const replaced = start(first, quickDraft(2), true);
    assert.equal(replaced.session?.draft.seed, 2);
  });

  it("reserve the daily attempt in the same change that starts the draft", () => {
    const data = start(createEmptyGameData(), dailyDraft(TODAY, TopicId.Movies));
    const attempt = findDailyAttempt(data.daily, TODAY, TopicId.Movies);
    assert.equal(attempt?.status, DailyAttemptStatus.InProgress);
    assert.equal(attempt?.draftId, data.session?.draft.id);
    assert.equal(
      getDailyTopicStatus(data, TODAY, TopicId.Movies).state,
      DailyTopicState.InProgress
    );
  });

  it("keep an abandoned daily attempt used, with no fresh retry", () => {
    const started = start(createEmptyGameData(), dailyDraft(TODAY, TopicId.Movies));
    const abandoned = abandonSession(started);
    assert.equal(abandoned.session, null);
    assert.equal(
      getDailyTopicStatus(abandoned, TODAY, TopicId.Movies).state,
      DailyTopicState.Abandoned
    );
    const retry = startSession(abandoned, {
      draft: dailyDraft(TODAY, TopicId.Movies),
      options: OPTIONS,
      now: NOW,
      replaceUnfinished: false,
    });
    assert.deepEqual(retry, { ok: false, reason: SessionBlock.DailyAlreadyPlayed });
  });

  it("treat replacing an unfinished daily as abandoning it", () => {
    const daily = start(createEmptyGameData(), dailyDraft(TODAY, TopicId.Songs));
    const replaced = start(daily, quickDraft(3), true);
    assert.equal(
      getDailyTopicStatus(replaced, TODAY, TopicId.Songs).state,
      DailyTopicState.Abandoned
    );
  });

  it("record a revealed result exactly once and finish the daily with the human's result", () => {
    const played = finish(start(createEmptyGameData(), dailyDraft(TODAY, TopicId.Cars)));
    const revealed = revealSession(played, NOW + 120_000);
    assert.ok(revealed.ok);
    const data = revealed.data;
    assert.equal(data.session?.revealed, true);
    assert.equal(data.history.length, 1);
    const attempt = findDailyAttempt(data.daily, TODAY, TopicId.Cars);
    assert.equal(attempt?.status, DailyAttemptStatus.Finished);
    assert.equal(attempt?.result?.totalRating, data.history[0].seats[0].totalRating);

    const again = revealSession(data, NOW + 180_000);
    assert.ok(again.ok);
    assert.equal(again.data.history.length, 1, "revealing twice adds nothing");
    assert.equal(recordReveal(data, NOW + 240_000).history.length, 1);

    const closed = closeSession(data);
    assert.equal(closed.session, null);
    assert.equal(closed.history.length, 1);
    assert.equal(getDailyTopicStatus(closed, TODAY, TopicId.Cars).state, DailyTopicState.Completed);
  });

  it("refuse to reveal a draft that is not finished", () => {
    const data = start(createEmptyGameData(), quickDraft());
    assert.deepEqual(revealSession(data, NOW), { ok: false, reason: SessionBlock.NotComplete });
    assert.equal(closeSession(data), data, "an unfinished draft cannot be closed as done");
  });

  it("resume a daily after midnight with its original date and seed", () => {
    const draft = dailyDraft(TODAY, TopicId.Sports);
    const plan = createDailyPlan(TODAY, TopicId.Sports, ["nfl-quarterbacks"]);
    const saved = start(createEmptyGameData(), draft);
    const { data } = roundTrip(saved);
    assert.equal(data.session?.draft.dailyKey, TODAY);
    assert.equal(data.session?.draft.seed, plan?.seed);
    assert.equal(
      getDailyTopicStatus(data, TODAY, TopicId.Sports).state,
      DailyTopicState.InProgress
    );
    assert.equal(
      getDailyTopicStatus(data, TOMORROW, TopicId.Sports).state,
      DailyTopicState.Available,
      "tomorrow's table is separate"
    );
    const revealed = revealSession(finish(data), Date.UTC(2026, 10, 25, 1));
    assert.ok(revealed.ok);
    assert.equal(
      findDailyAttempt(revealed.data.daily, TODAY, TopicId.Sports)?.status,
      DailyAttemptStatus.Finished,
      "the result is filed under the day it was dealt"
    );
  });

  it("deal the same daily table on every attempt to build it", () => {
    assert.deepEqual(
      dailyDraft(TODAY, TopicId.Movies).deck,
      dailyDraft(TODAY, TopicId.Movies).deck
    );
    assert.notDeepEqual(
      dailyDraft(TODAY, TopicId.Movies).deck,
      dailyDraft(TOMORROW, TopicId.Movies).deck
    );
  });
});

describe("daily board", () => {
  it("counts today's finished topics and the streak", () => {
    let data = createEmptyGameData();
    for (const topic of [TopicId.Movies, TopicId.Songs]) {
      const revealed = revealSession(finish(start(data, dailyDraft(TODAY, topic))), NOW);
      assert.ok(revealed.ok);
      data = closeSession(revealed.data);
    }
    const board = getDailyBoard(data, TODAY);
    assert.equal(board.total, 5);
    assert.equal(board.completed, 2);
    assert.deepEqual(board.streak, { current: 1, best: 1 });
    assert.equal(getDailyBoard(data, TOMORROW).completed, 0);
  });
});

describe("saved game data", () => {
  it("round-trips a live session, dailies and history", () => {
    const revealed = revealSession(finish(start(createEmptyGameData(), quickDraft())), NOW);
    assert.ok(revealed.ok);
    const withNext = start(closeSession(revealed.data), dailyDraft(TODAY, TopicId.Movies));
    const parsed = roundTrip(withNext);
    assert.equal(parsed.notice, null);
    assert.deepEqual(parsed.data, withNext);
  });

  it("starts fresh with a notice when the document is unreadable", () => {
    for (const text of ["{not json", "[]", JSON.stringify({ version: 9 })]) {
      const parsed = parseGameData(text);
      assert.deepEqual(parsed.data, createEmptyGameData());
      assert.equal(parsed.notice, GameDataNotice.DataReset);
    }
    assert.deepEqual(parseGameData(null), { data: createEmptyGameData(), notice: null });
  });

  it("drops an untrustworthy draft but keeps history and dailies", () => {
    const revealed = revealSession(finish(start(createEmptyGameData(), quickDraft())), NOW);
    assert.ok(revealed.ok);
    const live = start(closeSession(revealed.data), quickDraft(7));
    const tamperings: [string, (doc: any) => void][] = [
      ["tampered money", (doc) => (doc.session.draft.seats[0].money += 5)],
      ["content updated", (doc) => (doc.session.packVersion = "2020-01-01.1")],
      ["unknown pack", (doc) => (doc.session.draft.packId = "gone")],
      ["rating changed", (doc) => (doc.session.draft.pool[0].rating -= 1)],
      ["revealed while unfinished", (doc) => (doc.session.revealed = true)],
      ["absurd shot clock", (doc) => (doc.session.options.shotClockMs = 10_000_000)],
      ["draft missing", (doc) => delete doc.session.draft],
    ];
    for (const [label, tamper] of tamperings) {
      const doc = JSON.parse(serializeGameData(live));
      tamper(doc);
      const parsed = parseGameData(JSON.stringify(doc));
      assert.equal(parsed.notice, GameDataNotice.SessionDiscarded, label);
      assert.equal(parsed.data.session, null, label);
      assert.equal(parsed.data.history.length, 1, `${label}: history kept`);
    }
  });

  it("repairs a daily session saved without its attempt, and a reveal saved without history", () => {
    const daily = start(createEmptyGameData(), dailyDraft(TODAY, TopicId.Characters));
    const missingAttempt = { ...daily, daily: { version: 1 as const, attempts: [] } };
    const repaired = roundTrip(missingAttempt).data;
    assert.equal(
      findDailyAttempt(repaired.daily, TODAY, TopicId.Characters)?.status,
      DailyAttemptStatus.InProgress
    );

    const revealed = revealSession(finish(daily), NOW);
    assert.ok(revealed.ok);
    const missingHistory = { ...revealed.data, history: [] };
    const restored = roundTrip(missingHistory).data;
    assert.equal(restored.history.length, 1);
    assert.equal(restored.history[0].id, revealed.data.session?.draft.id);
  });

  it("ignores malformed history and daily entries instead of failing", () => {
    const revealed = revealSession(finish(start(createEmptyGameData(), quickDraft())), NOW);
    assert.ok(revealed.ok);
    const doc = JSON.parse(serializeGameData(closeSession(revealed.data)));
    doc.history.push({ id: "broken" }, null, "junk");
    doc.history[0].seats[0].totalRating = 1e400;
    doc.daily.attempts.push({ dateKey: "nope" });
    const parsed = parseGameData(JSON.stringify(doc));
    assert.equal(parsed.notice, null);
    assert.deepEqual(parsed.data.history, []);
    assert.deepEqual(parsed.data.daily.attempts, []);
  });
});

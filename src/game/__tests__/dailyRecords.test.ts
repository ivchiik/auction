import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getPack } from "data";
import { computeStreak } from "engine";

import {
  createEmptyDailyRecords,
  DailyAttemptStatus,
  ensureDailyAttempt,
  findDailyAttempt,
  finishDailyAttempt,
  finishedDateKeys,
  parseDailyRecords,
  startDailyAttempt,
} from "../dailyRecords";

const NOW = Date.UTC(2026, 10, 24, 18);
const start = { dateKey: "2026-11-24", topicId: "movies", packId: "scifi-80s", startedAt: NOW };
const result = { rank: 1, isWinner: true, isTie: false, totalRating: 440, moneyLeft: 2 };

describe("daily records", () => {
  it("allow one attempt per topic per day", () => {
    const first = startDailyAttempt(createEmptyDailyRecords(), { ...start, draftId: "d1" });
    assert.ok(first);
    assert.equal(startDailyAttempt(first, { ...start, draftId: "d2" }), null);
    assert.ok(startDailyAttempt(first, { ...start, topicId: "songs", draftId: "d3" }));
    assert.ok(startDailyAttempt(first, { ...start, dateKey: "2026-11-25", draftId: "d4" }));
    assert.equal(
      findDailyAttempt(first, "2026-11-24", "movies")?.status,
      DailyAttemptStatus.InProgress
    );
    assert.equal(ensureDailyAttempt(first, { ...start, draftId: "d5" }), first, "idempotent");
  });

  it("record the first finish only and feed the streak", () => {
    let records = startDailyAttempt(createEmptyDailyRecords(), { ...start, draftId: "d1" });
    assert.ok(records);
    records = finishDailyAttempt(records, "2026-11-24", "movies", NOW + 60_000, result);
    records = finishDailyAttempt(records, "2026-11-24", "movies", NOW + 90_000, {
      ...result,
      rank: 2,
    });
    const attempt = findDailyAttempt(records, "2026-11-24", "movies");
    assert.equal(attempt?.status, DailyAttemptStatus.Finished);
    assert.equal(attempt?.result?.rank, 1);
    assert.equal(attempt?.finishedAt, NOW + 60_000);
    assert.deepEqual(computeStreak(finishedDateKeys(records), "2026-11-25"), {
      current: 1,
      best: 1,
    });
  });

  it("survive malformed storage by keeping only well-formed attempts", () => {
    const good = { ...start, draftId: "d1", status: "finished", finishedAt: NOW, result };
    const parsed = parseDailyRecords({
      version: 1,
      attempts: [
        good,
        { ...good, draftId: "duplicate" },
        { ...good, dateKey: "2026-02-30" },
        { ...good, status: "finished", result: null },
        "junk",
        null,
      ],
    });
    assert.equal(parsed.attempts.length, 1);
    assert.equal(parsed.attempts[0].draftId, "d1");
    for (const raw of [null, "x", { version: 2, attempts: [] }, { version: 1 }]) {
      assert.deepEqual(parseDailyRecords(raw), createEmptyDailyRecords());
    }
  });

  it("drop results that could show impossible numbers", () => {
    const good = { ...start, draftId: "d1", status: "finished", finishedAt: NOW, result };
    // JSON.parse turns 1e400 into Infinity, so corrupted text can produce non-finite numbers.
    const corrupted = JSON.parse(
      '{"version":1,"attempts":[{"dateKey":"2026-11-24","topicId":"movies","packId":"scifi-80s",' +
        '"draftId":"x","status":"finished","startedAt":1,"finishedAt":2,' +
        '"result":{"rank":1,"isWinner":true,"isTie":false,"totalRating":1e400,"moneyLeft":0}}]}'
    );
    assert.deepEqual(parseDailyRecords(corrupted).attempts, []);
    const badResults = [
      { ...result, rank: 0 },
      { ...result, rank: 9 },
      { ...result, rank: 1.5 },
      { ...result, totalRating: -5 },
      { ...result, moneyLeft: -1 },
      { ...result, moneyLeft: 0.5 },
    ];
    for (const bad of badResults) {
      const parsed = parseDailyRecords({ version: 1, attempts: [{ ...good, result: bad }] });
      assert.deepEqual(parsed.attempts, [], JSON.stringify(bad));
    }
  });

  it("cross-check each attempt against the catalog's pack and topic", () => {
    const attempt = { ...start, draftId: "d1", status: "inProgress", finishedAt: null };
    const packTopic = (packId: string) => getPack(packId)?.topic ?? null;
    const keep = parseDailyRecords({ version: 1, attempts: [attempt] }, packTopic);
    assert.equal(keep.attempts.length, 1);
    const wrongTopic = { ...attempt, topicId: "songs" };
    const unknownPack = { ...attempt, packId: "gone" };
    const dropped = parseDailyRecords(
      { version: 1, attempts: [wrongTopic, unknownPack] },
      packTopic
    );
    assert.deepEqual(dropped.attempts, []);
  });
});

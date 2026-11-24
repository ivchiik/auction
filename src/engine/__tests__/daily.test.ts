import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addDays,
  computeStreak,
  createDailyPlan,
  dailySeed,
  isDateKey,
  msUntilNextLocalMidnight,
  msUntilNextLocalMidnightAt,
  toDateKey,
} from "../daily";
import { createDraft } from "../draft";
import { createSinglePositionRules } from "../rules";
import { BotPersonality, DraftMode } from "../types";
import { makePool, makeSeats, NOW } from "./helpers";

const LATE_EVENING_UTC = Date.UTC(2026, 10, 24, 23, 30);

describe("daily calendar", () => {
  it("uses the device's local day, not UTC", () => {
    assert.equal(toDateKey(LATE_EVENING_UTC, 0), "2026-11-24");
    assert.equal(toDateKey(LATE_EVENING_UTC, -240), "2026-11-25", "UTC+4 is already tomorrow");
    assert.equal(toDateKey(LATE_EVENING_UTC, 300), "2026-11-24", "UTC-5 is still today");
  });

  it("knows how long until the local day rolls over, so the board updates while open", () => {
    const minute = 60_000;
    // 23:30 UTC: 30 minutes left in UTC, 23.5 hours left at UTC+4 (already 03:30 tomorrow).
    assert.equal(msUntilNextLocalMidnight(LATE_EVENING_UTC, 0), 30 * minute);
    assert.equal(msUntilNextLocalMidnight(LATE_EVENING_UTC, -240), 20.5 * 60 * minute);
    const atMidnight = Date.UTC(2026, 10, 25, 0, 0);
    assert.equal(msUntilNextLocalMidnight(atMidnight, 0), 24 * 60 * minute, "a full day ahead");
    const after = LATE_EVENING_UTC + msUntilNextLocalMidnight(LATE_EVENING_UTC, 300);
    assert.equal(toDateKey(after, 300), "2026-11-25");
    assert.equal(toDateKey(after - 1, 300), "2026-11-24");
  });

  it("rolls over at the real local midnight across daylight-saving changes", () => {
    const hour = 3_600_000;
    // New York rules for 2026, injected: EDT (240) from Mar 8 07:00Z until Nov 1 06:00Z, else EST.
    const newYorkOffsetAt = (instant: number) =>
      instant >= Date.UTC(2026, 2, 8, 7) && instant < Date.UTC(2026, 10, 1, 6) ? 240 : 300;
    const springMidnight = Date.UTC(2026, 2, 8, 5); // Mar 8 00:00 EST
    assert.equal(msUntilNextLocalMidnightAt(springMidnight, newYorkOffsetAt), 23 * hour);
    const fallMidnight = Date.UTC(2026, 10, 1, 4); // Nov 1 00:00 EDT
    assert.equal(msUntilNextLocalMidnightAt(fallMidnight, newYorkOffsetAt), 25 * hour);
    const springNight = Date.UTC(2026, 2, 8, 6, 30); // Mar 8 01:30 EST
    const wait = msUntilNextLocalMidnightAt(springNight, newYorkOffsetAt);
    assert.equal(wait, 21.5 * hour);
    const rollover = springNight + wait;
    assert.equal(toDateKey(rollover, newYorkOffsetAt(rollover)), "2026-03-09");
    assert.equal(toDateKey(rollover - 1, newYorkOffsetAt(rollover - 1)), "2026-03-08");
  });

  it("validates and steps calendar days across months, years and leap days", () => {
    assert.ok(isDateKey("2028-02-29"));
    assert.ok(!isDateKey("2026-02-29"));
    assert.ok(!isDateKey("2026-2-3"));
    assert.ok(!isDateKey(20261124));
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2028-03-01", -1), "2028-02-29");
  });
});

describe("daily seeds", () => {
  it("are stable for a date and topic and differ across either", () => {
    assert.equal(dailySeed("2026-11-24", "movies"), dailySeed("2026-11-24", "movies"));
    assert.notEqual(dailySeed("2026-11-24", "movies"), dailySeed("2026-11-25", "movies"));
    assert.notEqual(dailySeed("2026-11-24", "movies"), dailySeed("2026-11-24", "songs"));
  });

  it("plan the same pack, opponent and deck on every device", () => {
    const plan = createDailyPlan("2026-11-24", "sports", ["nfl-qb", "nba-guards"]);
    const again = createDailyPlan("2026-11-24", "sports", ["nba-guards", "nfl-qb"]);
    assert.ok(plan);
    assert.deepEqual(again, plan, "pack order in the catalog does not matter");
    assert.ok(Object.values(BotPersonality).includes(plan.opponent));
    assert.equal(createDailyPlan("2026-13-01", "sports", ["nfl-qb"]), null);

    const draftFor = () =>
      createDraft({
        packId: plan.packId,
        rules: createSinglePositionRules(["pick"]),
        seats: makeSeats(["human", plan.opponent]),
        pool: makePool(20),
        seed: plan.seed,
        now: NOW,
        mode: DraftMode.Daily,
        dailyKey: plan.dateKey,
      });
    const first = draftFor();
    const second = draftFor();
    assert.ok(first.ok && second.ok);
    assert.deepEqual(first.value.deck, second.value.deck);
    assert.equal(first.value.lot?.opener, second.value.lot?.opener);
    assert.equal(first.value.dailyKey, "2026-11-24");
  });
});

describe("streaks", () => {
  it("count consecutive played days and keep the best run", () => {
    assert.deepEqual(computeStreak([], "2026-11-24"), { current: 0, best: 0 });
    assert.deepEqual(computeStreak(["2026-11-24"], "2026-11-24"), { current: 1, best: 1 });
    assert.deepEqual(
      computeStreak(["2026-11-22", "2026-11-23"], "2026-11-24"),
      { current: 2, best: 2 },
      "today not played yet keeps yesterday's streak alive"
    );
    assert.deepEqual(computeStreak(["2026-11-21", "2026-11-22"], "2026-11-24"), {
      current: 0,
      best: 2,
    });
    assert.deepEqual(
      computeStreak(
        [
          "2026-11-01",
          "2026-11-02",
          "2026-11-03",
          "2026-11-23",
          "2026-11-24",
          "2026-11-24",
          "junk",
        ],
        "2026-11-24"
      ),
      { current: 2, best: 3 }
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getPack, rulesForPack, toEngineCards, type ContentPack } from "data";
import {
  applyActionForStep,
  BotPersonality,
  createDraft,
  DraftPhase,
  getStepKey,
  SeatKind,
  type DraftAction,
  type DraftState,
  type SeatConfig,
} from "engine";

import type { ShotClockScheduler } from "../createShotClock";
import {
  BOT_DELAY_MIN_MS,
  BOT_DELAY_SPREAD_MS,
  botDelayFor,
  createTableScheduler,
  RESOLVED_PAUSE_MS,
} from "../tableScheduler";

const pack = getPack("scifi-80s") as ContentPack;

const createFakeTimers = () => {
  let time = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const everyCallback = new Map<number, () => void>();
  const scheduler: ShotClockScheduler = {
    now: () => time,
    setTimeout: (callback, ms) => {
      const id = nextId;
      nextId += 1;
      timers.set(id, { at: time + ms, callback });
      everyCallback.set(id, callback);
      return id;
    },
    clearTimeout: (handle) => {
      timers.delete(handle as number);
    },
  };
  const advance = (ms: number) => {
    const target = time + ms;
    for (;;) {
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      time = due[1].at;
      due[1].callback();
    }
    time = target;
  };
  return {
    scheduler,
    advance,
    now: () => time,
    lastTimerId: () => nextId - 1,
    deliverLate: (id: number) => everyCallback.get(id)?.(),
  };
};

const bot = (index: number, personality: BotPersonality): SeatConfig => ({
  id: `bot-${index}`,
  name: `Bot ${index}`,
  kind: SeatKind.Bot,
  personality,
});
const human = (index: number): SeatConfig => ({
  id: `human-${index}`,
  name: `Player ${index}`,
  kind: SeatKind.Human,
});

const createHarness = (seats: SeatConfig[], shotClockMs: number | null = null, seed = 3) => {
  const timers = createFakeTimers();
  const created = createDraft({
    packId: pack.id,
    rules: rulesForPack(pack),
    pool: toEngineCards(pack),
    seats,
    seed,
    now: 0,
  });
  assert.ok(created.ok);
  let draft: DraftState = created.value;
  const dispatched: { key: string; action: DraftAction; ok: boolean; at: number }[] = [];
  const scheduler = createTableScheduler({
    getDraft: () => draft,
    dispatch: (key, action) => {
      const result = applyActionForStep(draft, key, action, timers.now());
      dispatched.push({ key, action, ok: result.ok, at: timers.now() });
      if (result.ok) {
        draft = result.value;
        scheduler.sync();
      }
    },
    timers: timers.scheduler,
    shotClockMs,
  });
  return {
    timers,
    scheduler,
    dispatched,
    getDraft: () => draft,
    /** Simulates a person's tap going through the same guarded dispatch. */
    tap: (action: DraftAction) => {
      const key = getStepKey(draft);
      assert.ok(key);
      const result = applyActionForStep(draft, key, action, timers.now());
      assert.ok(result.ok, result.ok ? "" : result.error.message);
      draft = result.value;
      scheduler.sync();
    },
    replaceDraft: (next: DraftState) => {
      draft = next;
    },
  };
};

const ALL_BOTS = [
  bot(0, BotPersonality.Accountant),
  bot(1, BotPersonality.Shark),
  bot(2, BotPersonality.Gambler),
  bot(3, BotPersonality.Shark),
];

describe("table scheduler", () => {
  it("paces bot thinking between 600 and 900 ms, deterministically per decision", () => {
    for (const key of ["a:1:0:0:0", "a:1:1:0:1", "b:9:3:1:2"]) {
      const delay = botDelayFor(key);
      assert.ok(delay >= BOT_DELAY_MIN_MS && delay <= BOT_DELAY_MIN_MS + BOT_DELAY_SPREAD_MS);
      assert.equal(botDelayFor(key), delay);
    }
    const table = createHarness(ALL_BOTS);
    table.scheduler.setActive(true);
    const key = getStepKey(table.getDraft());
    assert.ok(key);
    table.timers.advance(botDelayFor(key) - 1);
    assert.equal(table.dispatched.length, 0);
    table.timers.advance(1);
    assert.equal(table.dispatched.length, 1);
    assert.ok(table.dispatched[0].ok);
  });

  it("plays a whole bot table to the end with one accepted action per step", () => {
    const table = createHarness(ALL_BOTS);
    table.scheduler.setActive(true);
    for (let tick = 0; tick < 2_000 && table.getDraft().phase !== DraftPhase.Complete; tick += 1) {
      table.timers.advance(500);
    }
    assert.equal(table.getDraft().phase, DraftPhase.Complete);
    assert.ok(
      table.dispatched.every((entry) => entry.ok),
      "no stale or illegal dispatch"
    );
    const keys = table.dispatched.map((entry) => entry.key);
    assert.equal(new Set(keys).size, keys.length, "every step acted on exactly once");
    assert.ok(table.getDraft().seats.every((seat) => seat.roster.length === 5));
  });

  it("holds a resolved card on screen before moving on", () => {
    const table = createHarness([human(0), human(1)]);
    table.scheduler.setActive(true);
    const opener = table.getDraft().lot?.turn ?? 0;
    table.tap({ type: "bid", seat: opener, amount: 1 });
    table.tap({ type: "pass", seat: (opener + 1) % 2 });
    assert.equal(table.getDraft().phase, DraftPhase.Resolved);
    table.timers.advance(RESOLVED_PAUSE_MS - 1);
    assert.equal(table.getDraft().phase, DraftPhase.Resolved);
    table.timers.advance(1);
    assert.equal(table.getDraft().phase, DraftPhase.Bidding);
  });

  it("does nothing while inactive and starts a fresh think time on resume", () => {
    const table = createHarness(ALL_BOTS);
    table.scheduler.setActive(true);
    table.timers.advance(300);
    table.scheduler.setActive(false);
    table.timers.advance(60_000);
    assert.equal(table.dispatched.length, 0, "no bot moves under a sheet or in the background");
    table.scheduler.setActive(true);
    table.timers.advance(BOT_DELAY_MIN_MS - 1);
    assert.equal(table.dispatched.length, 0);
    table.timers.advance(BOT_DELAY_SPREAD_MS + 1);
    assert.equal(table.dispatched.length, 1);
  });

  it("ignores a cancelled bot timer that is delivered late", () => {
    const table = createHarness(ALL_BOTS);
    table.scheduler.setActive(true);
    const firstTimer = table.timers.lastTimerId();
    table.scheduler.setActive(false);
    table.scheduler.setActive(true);
    table.timers.deliverLate(firstTimer);
    assert.equal(table.dispatched.length, 0);
    table.timers.advance(BOT_DELAY_MIN_MS + BOT_DELAY_SPREAD_MS);
    assert.equal(table.dispatched.length, 1);
  });

  it("re-reads fresh state, so a step that already moved on is never acted on", () => {
    const table = createHarness(ALL_BOTS);
    table.scheduler.setActive(true);
    const before = table.getDraft();
    const key = getStepKey(before);
    assert.ok(key);
    const turn = before.lot?.turn ?? 0;
    // Someone else (another screen, a restored save) moved the table on without telling us.
    const moved = applyActionForStep(before, key, { type: "bid", seat: turn, amount: 1 }, 0);
    assert.ok(moved.ok);
    table.replaceDraft(moved.value);
    table.timers.advance(BOT_DELAY_MIN_MS + BOT_DELAY_SPREAD_MS);
    assert.equal(table.dispatched.length, 0);
  });

  it("leaves people alone when the shot clock is off", () => {
    const table = createHarness([human(0), human(1)]);
    table.scheduler.setActive(true);
    table.timers.advance(10 * 60_000);
    assert.equal(table.dispatched.length, 0);
    assert.equal(table.scheduler.shotClockRemainingMs(), null);
  });

  it("times a person out once, pauses in the background and keeps the time left", () => {
    const table = createHarness([human(0), human(1)], 10_000);
    table.scheduler.setActive(true);
    table.timers.advance(4_000);
    assert.equal(table.scheduler.shotClockRemainingMs(), 6_000);
    table.scheduler.setActive(false);
    table.timers.advance(60_000);
    assert.equal(table.dispatched.length, 0);
    assert.equal(table.scheduler.shotClockRemainingMs(), 6_000);
    table.scheduler.setActive(true);
    table.timers.advance(5_999);
    assert.equal(table.dispatched.length, 0);
    table.timers.advance(1);
    assert.equal(table.dispatched.length, 1);
    assert.equal(table.dispatched[0].action.type, "pass", "the clock passes when it may");
    assert.ok(table.dispatched[0].ok);
    // The next person gets a fresh ten seconds; the expired turn never fires again.
    assert.equal(table.scheduler.shotClockRemainingMs(), 10_000);
    table.timers.advance(9_999);
    assert.equal(table.dispatched.length, 1);
  });

  it("stops everything on dispose", () => {
    const table = createHarness(ALL_BOTS, 10_000);
    table.scheduler.setActive(true);
    table.scheduler.dispose();
    table.timers.advance(60_000);
    assert.equal(table.dispatched.length, 0);
  });
});

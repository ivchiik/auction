import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createShotClock, type ShotClockScheduler } from "../createShotClock";

/**
 * Manual clock: time only moves when the test says so. Every callback ever scheduled is kept so
 * a test can deliver a cancelled one late, like a timer that already sat in the event queue.
 */
const createFakeScheduler = () => {
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
  const deliverLate = (id: number) => everyCallback.get(id)?.();
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
  return { scheduler, advance, deliverLate, pending: () => timers.size };
};

describe("shot clock", () => {
  it("expires once, with the turn it was started for", () => {
    const fake = createFakeScheduler();
    const expired: string[] = [];
    const clock = createShotClock(fake.scheduler, (key) => expired.push(key));
    clock.start("turn-1", 10_000);
    fake.advance(9_999);
    assert.deepEqual(expired, []);
    assert.equal(clock.remainingMs(), 1);
    fake.advance(1);
    assert.deepEqual(expired, ["turn-1"]);
    clock.start("turn-1", 10_000);
    fake.advance(20_000);
    assert.deepEqual(expired, ["turn-1"], "a timed-out turn never acts twice");
  });

  it("keeps running when the same turn is started again, restarts for a new turn", () => {
    const fake = createFakeScheduler();
    const expired: string[] = [];
    const clock = createShotClock(fake.scheduler, (key) => expired.push(key));
    clock.start("turn-1", 10_000);
    fake.advance(6_000);
    clock.start("turn-1", 10_000);
    assert.equal(clock.remainingMs(), 4_000);
    clock.start("turn-2", 10_000);
    fake.advance(9_000);
    assert.deepEqual(expired, []);
    fake.advance(1_000);
    assert.deepEqual(expired, ["turn-2"]);
  });

  it("does not run while the app is in the background", () => {
    const fake = createFakeScheduler();
    const expired: string[] = [];
    const clock = createShotClock(fake.scheduler, (key) => expired.push(key));
    clock.start("turn-1", 10_000);
    fake.advance(7_000);
    clock.pause();
    assert.equal(fake.pending(), 0, "no timer survives a pause");
    fake.advance(60_000);
    assert.deepEqual(expired, []);
    assert.equal(clock.remainingMs(), 3_000);
    clock.resume();
    fake.advance(2_999);
    assert.deepEqual(expired, []);
    fake.advance(1);
    assert.deepEqual(expired, ["turn-1"]);
  });

  it("ignores a cancelled callback from an earlier turn delivered after a new turn starts", () => {
    const fake = createFakeScheduler();
    const expired: string[] = [];
    const clock = createShotClock(fake.scheduler, (key) => expired.push(key));
    clock.start("turn-A", 10_000); // timer id 1
    fake.advance(100);
    clock.start("turn-B", 10_000); // cancels id 1, schedules id 2
    fake.deliverLate(1);
    assert.deepEqual(expired, [], "turn B must not expire early");
    assert.equal(clock.remainingMs(), 10_000);
    fake.advance(9_999);
    assert.deepEqual(expired, []);
    fake.advance(1);
    assert.deepEqual(expired, ["turn-B"]);
  });

  it("ignores a callback cancelled by a pause even after resuming", () => {
    const fake = createFakeScheduler();
    const expired: string[] = [];
    const clock = createShotClock(fake.scheduler, (key) => expired.push(key));
    clock.start("turn-A", 10_000); // timer id 1
    fake.advance(3_000);
    clock.pause(); // cancels id 1
    fake.advance(2_000);
    clock.resume(); // schedules id 2 for the 7,000ms left
    fake.deliverLate(1);
    assert.deepEqual(expired, []);
    assert.equal(clock.remainingMs(), 7_000);
    fake.advance(7_000);
    assert.deepEqual(expired, ["turn-A"]);
  });

  it("cancels cleanly when the turn is played or the screen unmounts", () => {
    const fake = createFakeScheduler();
    const expired: string[] = [];
    const clock = createShotClock(fake.scheduler, (key) => expired.push(key));
    clock.start("turn-1", 10_000);
    clock.stop();
    assert.equal(fake.pending(), 0);
    clock.resume();
    fake.advance(30_000);
    assert.deepEqual(expired, []);
    assert.equal(clock.isRunning(), false);
  });
});

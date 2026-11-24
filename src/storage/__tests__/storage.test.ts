import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createMemoryStore,
  readJson,
  readText,
  writeText,
  type KeyValueStore,
} from "../keyValueStore";
import { DEFAULT_SETTINGS, parseSettings } from "../settings";
import { createLatestWriteQueue } from "../writeQueue";

const failingStore = (): KeyValueStore => ({
  getItem: async () => {
    throw new Error("disk unavailable");
  },
  setItem: async () => {
    throw new Error("disk full");
  },
  removeItem: async () => {
    throw new Error("disk unavailable");
  },
});

/** A write we can finish by hand, to force interleavings. */
const createControlledWrites = () => {
  const started: string[] = [];
  const finishers: (() => void)[] = [];
  const write = (value: string) =>
    new Promise<void>((resolve) => {
      started.push(value);
      finishers.push(resolve);
    });
  const finishNext = async () => {
    finishers.shift()?.();
    // Let the queue's await continuation run.
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { started, write, finishNext };
};

describe("key-value helpers", () => {
  it("tell a storage failure apart from a missing key", async () => {
    assert.deepEqual(await readText(createMemoryStore(), "k"), { ok: true, text: null });
    assert.deepEqual(await readText(failingStore(), "k"), { ok: false });
    assert.equal(await writeText(failingStore(), "k", "v"), false);
  });

  it("read invalid JSON as nothing, without throwing", async () => {
    const store = createMemoryStore({ k: "{oops" });
    assert.equal(await readJson(store, "k"), null);
  });
});

describe("latest write queue", () => {
  it("never lets an older snapshot land after a newer one", async () => {
    const controlled = createControlledWrites();
    const queue = createLatestWriteQueue(controlled.write);
    queue.schedule("A");
    queue.schedule("B");
    queue.schedule("C");
    assert.deepEqual(controlled.started, ["A"], "one write at a time");
    await controlled.finishNext();
    assert.deepEqual(controlled.started, ["A", "C"], "B was superseded before its turn");
    await controlled.finishNext();
    await queue.flush();
    assert.deepEqual(controlled.started, ["A", "C"]);
  });

  it("keeps going after a failed write and still ends on the newest value", async () => {
    const written: string[] = [];
    let failNext = true;
    const queue = createLatestWriteQueue(async (value: string) => {
      if (failNext) {
        failNext = false;
        throw new Error("disk full");
      }
      written.push(value);
    });
    queue.schedule("first");
    queue.schedule("second");
    await queue.flush();
    assert.deepEqual(written, ["second"]);
  });

  it("writes into a real store in order", async () => {
    const store = createMemoryStore();
    const queue = createLatestWriteQueue((text: string) => writeText(store, "doc", text));
    for (let index = 0; index < 20; index += 1) queue.schedule(`v${index}`);
    await queue.flush();
    assert.equal(await store.getItem("doc"), "v19");
  });
});

describe("settings", () => {
  it("fall back per field", () => {
    assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
    assert.deepEqual(parseSettings({ hapticsEnabled: false, reduceMotion: "yes" }), {
      ...DEFAULT_SETTINGS,
      hapticsEnabled: false,
    });
  });
});

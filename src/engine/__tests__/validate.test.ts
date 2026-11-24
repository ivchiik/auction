import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createRng } from "../rng";
import { runDraft } from "../simulate";
import { BotPersonality, DraftPhase, type DraftState } from "../types";
import { parseDraftState } from "../validate";
import { bidMin, makePool, NOW, pass, startDraft } from "./helpers";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const roundTrip = (state: DraftState): Json => JSON.parse(JSON.stringify(state)) as Json;

/** A three-seat draft with an opening bid on the table, as plain JSON ready to be tampered with. */
const midLotSave = (): any => {
  const state = bidMin(startDraft({ seats: ["human", BotPersonality.Accountant, "human"] }));
  return roundTrip(state);
};

const collectPaths = (value: Json, prefix: (string | number)[] = []): (string | number)[][] => {
  if (value === null || typeof value !== "object") return [prefix];
  const entries = Array.isArray(value)
    ? value.map((child, index) => [index, child] as const)
    : Object.entries(value);
  return [prefix, ...entries.flatMap(([key, child]) => collectPaths(child, [...prefix, key]))];
};

const setPath = (root: any, path: (string | number)[], value: unknown, remove: boolean) => {
  if (path.length === 0) return value;
  let cursor = root;
  for (const key of path.slice(0, -1)) cursor = cursor[key];
  const last = path[path.length - 1];
  if (remove && !Array.isArray(cursor)) delete cursor[last];
  else cursor[last] = value;
  return root;
};

describe("parseDraftState", () => {
  it("accepts every state of a real draft after a JSON round trip", () => {
    for (let seed = 0; seed < 15; seed += 1) {
      const start = startDraft({
        seats: ["human", BotPersonality.Shark, BotPersonality.Gambler, "human"],
        seed,
        pool: makePool(30),
      });
      runDraft(start, {
        now: NOW,
        onStep: (state) => {
          const parsed = parseDraftState(roundTrip(state));
          assert.ok(parsed.ok, parsed.ok ? "" : parsed.error.message);
          assert.deepEqual(parsed.value, state);
        },
      });
    }
  });

  it("rejects things that are not drafts", () => {
    for (const input of [null, undefined, 42, "draft", [], {}, { schemaVersion: 2 }]) {
      assert.equal(parseDraftState(input).ok, false);
    }
  });

  it("rejects tampered or corrupted saves", () => {
    const tamperings: [string, (save: any) => void][] = [
      ["unknown schema version", (save) => (save.schemaVersion = 99)],
      ["extra money", (save) => (save.seats[0].money += 1)],
      ["negative money", (save) => (save.seats[1].money = -1)],
      ["too many skips", (save) => (save.seats[0].skipsLeft = 3)],
      ["unknown personality", (save) => (save.seats[1].personality = "oracle")],
      ["human with a personality", (save) => (save.seats[0].personality = "shark")],
      ["bot without a personality", (save) => (save.seats[1].personality = null)],
      ["missing rating", (save) => (save.pool[0].rating = null)],
      ["unknown phase", (save) => (save.phase = "overtime")],
      ["turn handed to a passed seat", (save) => save.lot.passed.push(save.lot.turn)],
      ["lot card swapped", (save) => (save.lot.cardId = save.deck[save.deck.length - 1])],
      ["deck cut short", (save) => (save.deck = save.deck.slice(0, save.nextDeckIndex))],
      ["deck repeats a card", (save) => (save.deck[save.deck.length - 1] = save.deck[0])],
      ["high bid beyond the reserve", (save) => (save.lot.highBid = save.lot.bids[0].amount = 17)],
      [
        "claimed complete with empty rosters",
        (save) => ((save.phase = "complete"), (save.lot = null)),
      ],
      [
        "card awarded without a sale",
        (save) => {
          save.seats[0].roster.push({
            cardId: save.deck[5],
            slotId: "pick",
            price: 1,
            lotNumber: 1,
          });
          save.seats[0].money -= 1;
        },
      ],
      ["too few seats", (save) => (save.seats = save.seats.slice(0, 1))],
    ];
    for (const [label, tamper] of tamperings) {
      const save = midLotSave();
      tamper(save);
      const parsed = parseDraftState(save);
      assert.equal(parsed.ok, false, `accepted a save with ${label}`);
    }
  });

  it("rejects a resolved sale that the rosters do not show", () => {
    const state = pass(bidMin(startDraft()));
    assert.equal(state.phase, DraftPhase.Resolved);
    const save: any = roundTrip(state);
    const winner = save.lot.outcome.seat;
    save.seats[winner].roster = [];
    save.seats[winner].money = 20;
    assert.equal(parseDraftState(save).ok, false);
  });

  it("never throws on random corruption, and anything it accepts can still be finished", () => {
    const rng = createRng(2026);
    const garbage = [null, -1, 0, 1, 2, 999, 1.5, "x", "", true, [], {}];
    let accepted = 0;
    for (let trial = 0; trial < 400; trial += 1) {
      const save: any = midLotSave();
      const paths = collectPaths(save).filter((path) => path.length > 0);
      const path = paths[rng.int(0, paths.length - 1)];
      const corrupted = setPath(
        save,
        path,
        garbage[rng.int(0, garbage.length - 1)],
        rng.next() < 0.2
      );
      const parsed = parseDraftState(corrupted);
      if (!parsed.ok) continue;
      accepted += 1;
      const finished = runDraft(parsed.value, { now: NOW });
      assert.equal(finished.phase, DraftPhase.Complete);
    }
    assert.ok(accepted < 400, "most corruption must be caught");
  });
});

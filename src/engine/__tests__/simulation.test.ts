import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyAction, createDraft } from "../draft";
import { createRng, deriveSeed } from "../rng";
import { createSinglePositionRules, maxBidFor, minSpotPrice, openSpots } from "../rules";
import { getTurnOptions } from "../selectors";
import { runDraft } from "../simulate";
import {
  BotPersonality,
  DraftPhase,
  LotOutcomeKind,
  type DraftAction,
  type DraftState,
  type EngineCard,
  type RuleSet,
} from "../types";
import { checkDraftInvariants } from "../validate";
import { makePool, makeSeats, NOW, type SeatSpec } from "./helpers";

const SPECS: readonly SeatSpec[] = [
  "human",
  BotPersonality.Accountant,
  BotPersonality.Shark,
  BotPersonality.Gambler,
];
const SEEDS_PER_TABLE_SIZE = 150;

/** Actions that must be refused in the current state; each one probes a different rule. */
const illegalActionsFor = (state: DraftState): DraftAction[] => {
  const options = getTurnOptions(state);
  if (!options) return [{ type: "pass", seat: 0 }];
  const seatCount = state.seats.length;
  const someoneElse = (options.seat + 1) % seatCount;
  const highBid = state.lot?.highBid ?? 0;
  const probes: DraftAction[] = [
    { type: "bid", seat: options.seat, amount: options.maxBid + 1 },
    { type: "bid", seat: options.seat, amount: highBid },
    { type: "bid", seat: options.seat, amount: highBid + 4 },
    { type: "bid", seat: someoneElse, amount: options.bids[0] ?? highBid + 1 },
    { type: "pass", seat: someoneElse },
    { type: "advance" },
  ];
  if (!options.canPass) probes.push({ type: "pass", seat: options.seat });
  return probes;
};

interface TableAudit {
  bids: number;
  overLimitBids: number;
  forcedPasses: number;
}

const playAudited = (
  start: DraftState,
  policySeed: number
): { end: DraftState; audit: TableAudit } => {
  const audit: TableAudit = { bids: 0, overLimitBids: 0, forcedPasses: 0 };
  let previous = start;
  const end = runDraft(start, {
    now: NOW,
    policySeed,
    onStep: (state, action) => {
      // Every applied action was legal in the state it was applied to.
      if (action.type === "bid") {
        audit.bids += 1;
        const seat = previous.seats[action.seat];
        if (action.amount > maxBidFor(seat, previous.rules)) audit.overLimitBids += 1;
      }
      if (action.type === "pass" && getTurnOptions(previous)?.canPass === false) {
        audit.forcedPasses += 1;
      }
      const problems = checkDraftInvariants(state);
      assert.deepEqual(problems, [], `invariants broken after ${JSON.stringify(action)}`);
      for (const seat of state.seats) {
        assert.ok(seat.money >= openSpots(seat, state.rules) * minSpotPrice(state.rules));
      }
      // Illegal actions are refused and leave the state untouched.
      const before = JSON.stringify(state);
      for (const probe of illegalActionsFor(state)) {
        if (state.phase === DraftPhase.Resolved && probe.type === "advance") continue;
        assert.equal(applyAction(state, probe, NOW).ok, false, `accepted ${JSON.stringify(probe)}`);
      }
      assert.equal(JSON.stringify(state), before);
      previous = state;
    },
  });
  return { end, audit };
};

const assertFinishedCleanly = (end: DraftState, label: string) => {
  assert.equal(end.phase, DraftPhase.Complete, `${label}: not complete`);
  const awarded = end.seats.flatMap((seat) => seat.roster.map((entry) => entry.cardId));
  assert.equal(new Set(awarded).size, awarded.length, `${label}: a card was awarded twice`);
  for (const seat of end.seats) {
    assert.equal(openSpots(seat, end.rules), 0, `${label}: roster left open`);
    assert.ok(seat.money >= 0, `${label}: negative money`);
    const spent = seat.roster.reduce((total, entry) => total + entry.price, 0);
    assert.equal(seat.money + spent, end.rules.budget, `${label}: money does not balance`);
  }
  const sales = end.history.filter(
    (record) => record.kind === LotOutcomeKind.Sold || record.kind === LotOutcomeKind.ForcedFill
  );
  assert.equal(sales.length, awarded.length, `${label}: history and rosters disagree`);
};

describe("randomized drafts", () => {
  for (const seatCount of [2, 3, 4]) {
    it(`always finish with full, balanced rosters at a ${seatCount}-seat table`, () => {
      let discarded = 0;
      let forcedFills = 0;
      for (let seed = 0; seed < SEEDS_PER_TABLE_SIZE; seed += 1) {
        const rng = createRng(deriveSeed("table", seatCount, seed));
        const specs = Array.from({ length: seatCount }, () => SPECS[rng.int(0, SPECS.length - 1)]);
        const required = seatCount * 5;
        const result = createDraft({
          packId: "sim",
          rules: createSinglePositionRules(["pick"]),
          seats: makeSeats(specs),
          pool: makePool(rng.int(required, required * 2), "pick", rng.int(60, 99)),
          seed,
          now: NOW,
        });
        assert.ok(result.ok);
        const label = `seats=${seatCount} seed=${seed} specs=${specs.join(",")}`;
        const { end, audit } = playAudited(result.value, seed);
        assertFinishedCleanly(end, label);
        assert.equal(audit.overLimitBids, 0, `${label}: a bid broke the reserve`);
        assert.equal(audit.forcedPasses, 0, `${label}: someone passed while forced to bid`);
        discarded += end.history.filter(
          (record) => record.kind === LotOutcomeKind.Discarded
        ).length;
        forcedFills += end.history.filter(
          (record) => record.kind === LotOutcomeKind.ForcedFill
        ).length;
      }
      assert.ok(discarded > 0, "skips and discards were exercised");
      assert.ok(forcedFills > 0, "forced fills were exercised");
    });
  }

  it("replay identically from the same seed and differ across seeds", () => {
    const play = (seed: number) => {
      const result = createDraft({
        packId: "sim",
        rules: createSinglePositionRules(["pick"]),
        seats: makeSeats([BotPersonality.Gambler, "human", BotPersonality.Shark, "human"]),
        pool: makePool(30),
        seed,
        now: NOW,
      });
      assert.ok(result.ok);
      const actions: DraftAction[] = [];
      const end = runDraft(result.value, { now: NOW, onStep: (_, action) => actions.push(action) });
      return { end, actions };
    };
    const first = play(77);
    const again = play(77);
    assert.deepEqual(again.end, first.end);
    assert.deepEqual(again.actions, first.actions);
    assert.notDeepEqual(play(78).actions, first.actions);
  });

  it("handle mixed-position lineups with separate slot kinds", () => {
    const rules: RuleSet = {
      ...createSinglePositionRules(["hero"]),
      slots: [
        { id: "heroes", count: 3, accepts: ["hero"] },
        { id: "villains", count: 2, accepts: ["villain", "rival"] },
      ],
    };
    for (let seed = 0; seed < 80; seed += 1) {
      const rng = createRng(deriveSeed("mixed", seed));
      const seatCount = rng.int(2, 4);
      const pool: EngineCard[] = [
        ...makePool(seatCount * 3 + rng.int(0, 6), "hero", 95),
        ...makePool(seatCount + rng.int(0, 4), "villain", 90),
        ...makePool(seatCount + rng.int(0, 4), "rival", 85),
      ];
      const specs = Array.from({ length: seatCount }, () => SPECS[rng.int(0, SPECS.length - 1)]);
      const result = createDraft({
        packId: "mixed",
        rules,
        seats: makeSeats(specs),
        pool,
        seed,
        now: NOW,
      });
      assert.ok(result.ok, result.ok ? "" : result.error.message);
      const { end } = playAudited(result.value, seed);
      assertFinishedCleanly(end, `mixed seed=${seed}`);
      for (const seat of end.seats) {
        assert.equal(seat.roster.filter((entry) => entry.slotId === "heroes").length, 3);
        assert.equal(seat.roster.filter((entry) => entry.slotId === "villains").length, 2);
      }
    }
  });
});

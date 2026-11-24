import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyAction, applyActionForStep, applyActionForTurn, createDraft } from "../draft";
import { createRng } from "../rng";
import { createSinglePositionRules } from "../rules";
import { getStepKey, getTurnKey, getTurnOptions } from "../selectors";
import { randomLegalAction } from "../simulate";
import {
  DraftPhase,
  EngineErrorCode,
  type DraftAction,
  type DraftState,
  type EngineResult,
} from "../types";
import { checkDraftInvariants, parseDraftState } from "../validate";
import { makePool, makeSeats, type SeatSpec } from "./helpers";

/** Injected clock readings only: the device clock is never touched. */
const CREATED_AT = 10_000;
const NON_FINITE = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
const TWO_PEOPLE: readonly SeatSpec[] = ["human", "human"];

const draftInput = (now: number, seats: readonly SeatSpec[] = TWO_PEOPLE, seed = 42) => ({
  packId: "test-pack",
  rules: createSinglePositionRules(["pick"]),
  seats: makeSeats(seats),
  pool: makePool(seats.length * 8),
  seed,
  now,
});

const createAt = (now: number, seats: readonly SeatSpec[] = TWO_PEOPLE, seed = 42) => {
  const result = createDraft(draftInput(now, seats, seed));
  assert.ok(result.ok, result.ok ? "" : result.error.message);
  return result.value;
};

const expectOk = (result: EngineResult<DraftState>): DraftState => {
  assert.ok(result.ok, result.ok ? "" : `${result.error.code}: ${result.error.message}`);
  return result.value;
};

const errorCode = (result: EngineResult<DraftState>) => (result.ok ? null : result.error.code);

/** The smallest legal bid for whoever has the turn. */
const minBid = (state: DraftState): Extract<DraftAction, { type: "bid" }> => {
  const options = getTurnOptions(state);
  assert.ok(options && options.bids.length > 0, "expected a legal bid");
  return { type: "bid", seat: options.seat, amount: options.bids[0] };
};

const passTurn = (state: DraftState): DraftAction => {
  const options = getTurnOptions(state);
  assert.ok(options?.canPass, "expected a legal pass");
  return { type: "pass", seat: options.seat };
};

/** What the next launch sees: the draft serialized, parsed back and validated. */
const reload = (state: DraftState): DraftState => {
  const parsed = parseDraftState(JSON.parse(JSON.stringify(state)));
  assert.ok(parsed.ok, parsed.ok ? "" : parsed.error.message);
  assert.deepEqual(parsed.value, state);
  return parsed.value;
};

/** A two-person table whose first card was just sold: the next step is `advance`. */
const resolvedAt = (soldAt: number): DraftState => {
  const opened = createAt(CREATED_AT);
  const bid = expectOk(applyAction(opened, minBid(opened), soldAt));
  const sold = expectOk(applyAction(bid, passTurn(bid), soldAt));
  assert.equal(sold.phase, DraftPhase.Resolved);
  return sold;
};

describe("engine timestamps across clock corrections", () => {
  it("keeps a legal bid made after the clock moved back, and its save still loads", () => {
    // Codex's reproduction: created at 10,000, then a legal bid stamped 9,000.
    const created = createAt(CREATED_AT);
    const bid = minBid(created);
    const after = expectOk(applyAction(created, bid, 9_000));

    assert.deepEqual(after.lot?.bids, [{ seat: bid.seat, amount: bid.amount }]);
    assert.equal(after.createdAt, CREATED_AT);
    assert.equal(after.updatedAt, CREATED_AT);
    assert.deepEqual(checkDraftInvariants(after), []);
    reload(after);
  });

  it("follows the clock forward again after a backward correction", () => {
    let state = createAt(CREATED_AT);
    state = expectOk(applyAction(state, minBid(state), 9_000));
    assert.equal(state.updatedAt, CREATED_AT);

    state = expectOk(applyAction(state, passTurn(state), 12_500));
    assert.equal(state.updatedAt, 12_500);
    reload(state);

    state = expectOk(applyAction(state, { type: "advance" }, 11_000));
    assert.equal(state.updatedAt, 12_500);
    state = expectOk(applyAction(state, minBid(state), 15_000));
    assert.equal(state.updatedAt, 15_000);
    reload(state);
  });

  it("advances past a resolved card at an earlier reading without moving time back", () => {
    const sold = resolvedAt(20_000);
    assert.equal(sold.updatedAt, 20_000);

    const earlier = expectOk(applyAction(sold, { type: "advance" }, 5_000));
    assert.equal(earlier.phase, DraftPhase.Bidding);
    assert.equal(earlier.updatedAt, 20_000);
    reload(earlier);

    const later = expectOk(applyAction(sold, { type: "advance" }, 25_000));
    assert.equal(later.updatedAt, 25_000);
    // The reading only affects the stamp, never the rules or the turn keys.
    assert.deepEqual({ ...later, updatedAt: 0 }, { ...earlier, updatedAt: 0 });
    assert.equal(getStepKey(later), getStepKey(earlier));
  });

  it("stamps whole drafts on a jittery clock with the latest reading so far", () => {
    const tables: readonly SeatSpec[][] = [
      ["human", "human"],
      ["human", "human", "human"],
      ["human", "human", "human", "human"],
    ];
    for (const seats of tables) {
      for (const seed of [3, 17, 2_024]) {
        const rng = createRng(seed);
        let state = createAt(CREATED_AT, seats, seed);
        let latest = CREATED_AT;
        let steps = 0;
        while (state.phase !== DraftPhase.Complete) {
          // Small drift either way, sometimes an hour back (readings can even go below zero).
          const now = rng.next() < 0.1 ? latest - 3_600_000 : latest + rng.int(-2_000, 3_000);
          const action =
            state.phase === DraftPhase.Resolved
              ? { type: "advance" as const }
              : randomLegalAction(state, rng);
          assert.ok(action, "expected a legal action");
          state = expectOk(applyAction(state, action, now));
          latest = Math.max(latest, now);
          assert.equal(state.updatedAt, latest);
          assert.equal(state.createdAt, CREATED_AT);
          reload(state);
          steps += 1;
          assert.ok(steps < 2_000, "draft did not finish");
        }
        assert.ok(steps > 20, `${seats.length} seats, seed ${seed}`);
      }
    }
  });

  it("rejects non-finite readings through the result type and leaves the draft untouched", () => {
    const bidding = createAt(CREATED_AT);
    const sold = resolvedAt(12_000);
    const requests: [DraftState, DraftAction][] = [
      [bidding, minBid(bidding)],
      [bidding, passTurn(bidding)],
      [sold, { type: "advance" }],
    ];

    for (const [state, action] of requests) {
      const before = structuredClone(state);
      const stepKey = getStepKey(state);
      assert.ok(stepKey);
      for (const now of NON_FINITE) {
        assert.equal(errorCode(applyAction(state, action, now)), EngineErrorCode.InvalidAction);
        assert.equal(
          errorCode(applyActionForStep(state, stepKey, action, now)),
          EngineErrorCode.InvalidAction
        );
        const turnKey = getTurnKey(state);
        if (turnKey) {
          assert.equal(
            errorCode(applyActionForTurn(state, turnKey, action, now)),
            EngineErrorCode.InvalidAction
          );
        }
        assert.deepEqual(state, before, `${action.type} at ${now} changed its input`);
      }
      // The same request with a real reading still goes through.
      assert.equal(expectOk(applyAction(state, action, 13_000)).updatedAt, 13_000);
    }

    for (const now of NON_FINITE) {
      assert.equal(errorCode(createDraft(draftInput(now))), EngineErrorCode.InvalidConfig);
    }
  });

  it("leaves the draft untouched when a request is refused at a backward reading", () => {
    const state = createAt(CREATED_AT);
    const options = getTurnOptions(state);
    assert.ok(options);
    const before = structuredClone(state);
    const other = (options.seat + 1) % state.seats.length;

    assert.deepEqual(
      [
        applyAction(state, { type: "bid", seat: other, amount: 1 }, 9_000),
        applyAction(state, { type: "bid", seat: options.seat, amount: options.maxBid + 1 }, 9_000),
        applyAction(state, { type: "advance" }, 9_000),
      ].map(errorCode),
      [EngineErrorCode.NotYourTurn, EngineErrorCode.BidOverLimit, EngineErrorCode.NotResolved]
    );
    assert.deepEqual(state, before);
  });

  it("keeps the stale-turn and stale-step guards whatever the clock says", () => {
    const state = createAt(CREATED_AT);
    const turnKey = getTurnKey(state);
    const stepKey = getStepKey(state);
    assert.ok(turnKey && stepKey);
    const action = minBid(state);
    const moved = expectOk(applyActionForStep(state, stepKey, action, 9_000));
    assert.equal(moved.updatedAt, CREATED_AT);

    // A late timer or double tap carrying the old keys is refused before the clock is read.
    for (const now of [8_000, 20_000, ...NON_FINITE]) {
      assert.equal(
        errorCode(applyActionForStep(moved, stepKey, action, now)),
        EngineErrorCode.StaleTurn
      );
      assert.equal(
        errorCode(applyActionForTurn(moved, turnKey, action, now)),
        EngineErrorCode.StaleTurn
      );
    }
  });

  it("treats zero, like any finite reading, as a valid time", () => {
    let state = createAt(0);
    assert.equal(state.createdAt, 0);
    state = expectOk(applyAction(state, minBid(state), 0));
    assert.equal(state.updatedAt, 0);
    state = expectOk(applyAction(state, passTurn(state), -250));
    assert.equal(state.updatedAt, 0);
    reload(state);
    state = expectOk(applyAction(state, { type: "advance" }, 1));
    assert.equal(state.updatedAt, 1);
    reload(state);
  });
});

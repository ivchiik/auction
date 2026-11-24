import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyAction, applyActionForStep, applyActionForTurn, createDraft } from "../draft";
import { createSinglePositionRules, maxBidFor, openSpots } from "../rules";
import { getStepKey, getTimeoutAction, getTurnKey, getTurnOptions } from "../selectors";
import {
  BotPersonality,
  DraftPhase,
  EngineErrorCode,
  LotOutcomeKind,
  PassBlockReason,
  SeatKind,
} from "../types";
import { checkDraftInvariants, parseDraftState } from "../validate";
import {
  act,
  advance,
  bidMin,
  makePool,
  makeSeats,
  NOW,
  pass,
  playLotForWinner,
  startDraft,
  toNextDecision,
  turnOf,
} from "./helpers";

describe("createDraft", () => {
  const base = {
    packId: "p",
    rules: createSinglePositionRules(["pick"]),
    pool: makePool(20),
    seed: 7,
    now: NOW,
  };

  it("starts every seat with the budget, two skips and an empty roster", () => {
    const state = startDraft({ seats: ["human", BotPersonality.Shark, "human"] });
    assert.equal(state.phase, DraftPhase.Bidding);
    for (const seat of state.seats) {
      assert.equal(seat.money, 20);
      assert.equal(seat.skipsLeft, 2);
      assert.deepEqual(seat.roster, []);
    }
    assert.equal(state.lot?.turn, state.lot?.opener);
    assert.deepEqual(checkDraftInvariants(state), []);
  });

  it("rejects tables outside 2-4 seats, duplicate ids and bots without a personality", () => {
    const cases = [
      makeSeats(["human"]),
      makeSeats(["human", "human", "human", "human", "human"]),
      [...makeSeats(["human"]), ...makeSeats(["human"])],
      [
        { id: "a", name: "A", kind: SeatKind.Human },
        { id: "b", name: "B", kind: SeatKind.Bot },
      ],
      [{ id: "a", name: "  ", kind: SeatKind.Human }, ...makeSeats(["human"]).slice(0, 1)],
    ];
    for (const seats of cases) {
      const result = createDraft({ ...base, seats });
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.error.code, EngineErrorCode.InvalidConfig);
    }
  });

  it("rejects packs too small to fill every roster, bad rules and bad seeds", () => {
    const seats = makeSeats(["human", "human"]);
    const tooSmall = createDraft({ ...base, seats, pool: makePool(9) });
    assert.equal(tooSmall.ok, false);
    const brokeRules = createDraft({
      ...base,
      seats,
      rules: { ...base.rules, budget: 4 },
    });
    assert.equal(brokeRules.ok, false);
    const strayCard = createDraft({ ...base, seats, pool: [...makePool(12), ...makePool(1, "x")] });
    assert.equal(strayCard.ok, false);
    for (const seed of [-1, 1.5, 2 ** 32]) {
      assert.equal(createDraft({ ...base, seats, seed }).ok, false);
    }
  });
});

describe("bidding", () => {
  it("opens at $1, $2 or $3 and then allows raises of $1, $2 or $3", () => {
    const state = startDraft({ seats: ["human", "human", "human"] });
    const opening = getTurnOptions(state);
    assert.ok(opening);
    assert.deepEqual(opening.bids, [1, 2, 3]);
    assert.equal(opening.canPass, true);
    assert.equal(opening.passCostsSkip, true);

    const afterOpen = bidMin(state);
    const reply = getTurnOptions(afterOpen);
    assert.ok(reply);
    assert.equal(reply.seat, (opening.seat + 1) % 3);
    assert.deepEqual(reply.bids, [2, 3, 4]);
    assert.equal(reply.passCostsSkip, false);

    const jumpOpen = act(state, { type: "bid", seat: opening.seat, amount: 3 });
    assert.equal(jumpOpen.lot?.highBid, 3);
    assert.deepEqual(getTurnOptions(jumpOpen)?.bids, [4, 5, 6]);
  });

  it("rejects illegal bids and out-of-turn actions without touching state", () => {
    const state = startDraft();
    const snapshot = JSON.stringify(state);
    const options = getTurnOptions(state);
    assert.ok(options);
    const other = (options.seat + 1) % 2;
    const attempts = [
      {
        action: { type: "bid", seat: options.seat, amount: 4 },
        code: EngineErrorCode.BidNotAllowed,
      },
      {
        action: { type: "bid", seat: options.seat, amount: 0 },
        code: EngineErrorCode.BidNotAllowed,
      },
      {
        action: { type: "bid", seat: options.seat, amount: 1.5 },
        code: EngineErrorCode.BidNotAllowed,
      },
      {
        action: { type: "bid", seat: options.seat, amount: 17 },
        code: EngineErrorCode.BidOverLimit,
      },
      { action: { type: "bid", seat: other, amount: 1 }, code: EngineErrorCode.NotYourTurn },
      { action: { type: "pass", seat: other }, code: EngineErrorCode.NotYourTurn },
      { action: { type: "advance" }, code: EngineErrorCode.NotResolved },
    ] as const;
    for (const { action, code } of attempts) {
      const result = applyAction(state, action, NOW);
      assert.equal(result.ok, false, JSON.stringify(action));
      if (!result.ok) assert.equal(result.error.code, code, JSON.stringify(action));
    }
    assert.equal(JSON.stringify(state), snapshot);
  });

  it("eliminates passing seats and sells to the last bidder standing at the current price", () => {
    let state = startDraft({ seats: ["human", "human", "human"] });
    const a = turnOf(state);
    const b = (a + 1) % 3;
    const c = (a + 2) % 3;
    state = act(state, { type: "bid", seat: a, amount: 1 });
    state = act(state, { type: "bid", seat: b, amount: 4 });
    state = act(state, { type: "pass", seat: c });
    assert.equal(turnOf(state), a, "turn returns to the opener, skipping nobody");
    state = act(state, { type: "pass", seat: a });

    assert.equal(state.phase, DraftPhase.Resolved);
    assert.deepEqual(state.lot?.outcome, { kind: LotOutcomeKind.Sold, seat: b, price: 4 });
    assert.equal(state.seats[b].money, 16);
    assert.equal(state.seats[b].roster[0].cardId, state.lot?.cardId);
    assert.equal(state.seats[a].skipsLeft, 2, "passing on a bid is free");
    assert.equal(state.seats[c].skipsLeft, 2, "passing on a bid is free");
    assert.equal(state.history.at(-1)?.kind, LotOutcomeKind.Sold);
  });

  it("never gives a passed seat the turn again on the same card", () => {
    let state = startDraft({ seats: ["human", "human", "human"] });
    const a = turnOf(state);
    const b = (a + 1) % 3;
    const c = (a + 2) % 3;
    state = act(state, { type: "bid", seat: a, amount: 1 });
    state = act(state, { type: "pass", seat: b });
    state = act(state, { type: "bid", seat: c, amount: 2 });
    assert.equal(turnOf(state), a);
    state = act(state, { type: "bid", seat: a, amount: 3 });
    assert.equal(turnOf(state), c, "b passed, so the turn skips straight to c");
    const blocked = applyAction(state, { type: "bid", seat: b, amount: 4 }, NOW);
    assert.equal(blocked.ok, false);
  });

  it("charges a skip for an opening pass and discards a card nobody opens", () => {
    let state = startDraft();
    const cardId = state.lot?.cardId;
    state = pass(state);
    state = pass(state);
    assert.equal(state.phase, DraftPhase.Resolved);
    assert.equal(state.lot?.outcome?.kind, LotOutcomeKind.Discarded);
    assert.deepEqual(
      state.seats.map((seat) => seat.skipsLeft),
      [1, 1]
    );
    assert.ok(state.seats.every((seat) => seat.roster.length === 0));
    state = advance(state);
    assert.notEqual(state.lot?.cardId, cardId, "a discarded card is gone for good");
  });

  it("forces a seat with no skips left to open the bidding", () => {
    let state = startDraft({ pool: makePool(16) });
    for (let discard = 0; discard < 2; discard += 1) {
      state = pass(state);
      state = pass(state);
      state = advance(state);
    }
    const options = getTurnOptions(state);
    assert.ok(options);
    assert.equal(options.canPass, false);
    assert.equal(options.passBlockedBy, PassBlockReason.NoSkipsLeft);
    const refused = applyAction(state, { type: "pass", seat: options.seat }, NOW);
    assert.equal(refused.ok, false);
    if (!refused.ok) assert.equal(refused.error.code, EngineErrorCode.PassNotAllowed);

    state = bidMin(state);
    const reply = getTurnOptions(state);
    assert.ok(reply?.canPass, "passing on someone else's bid stays free without skips");
  });

  it("caps every bid so $1 stays reserved for each other open spot", () => {
    let state = startDraft();
    const x = turnOf(state);
    const y = (x + 1) % 2;
    state = act(state, { type: "bid", seat: x, amount: 1 });
    for (const [seat, amount] of [
      [y, 4],
      [x, 7],
      [y, 10],
      [x, 13],
      [y, 16],
    ] as const) {
      state = act(state, { type: "bid", seat, amount });
    }
    const capped = getTurnOptions(state);
    assert.ok(capped);
    assert.equal(capped.seat, x);
    assert.equal(capped.maxBid, 16, "$20 with five spots open leaves a $16 ceiling");
    assert.deepEqual(capped.bids, []);
    assert.equal(capped.raiseBlockedByReserve, true);
    state = pass(state);
    assert.equal(state.seats[y].money, 4);
    assert.equal(maxBidFor(state.seats[y], state.rules), 1, "$4 for four spots leaves $1 bids");

    state = toNextDecision(advance(state));
    if (turnOf(state) === y) {
      assert.deepEqual(getTurnOptions(state)?.bids, [1], "openings are reserve-limited too");
      state = bidMin(state);
      state = bidMin(state);
    } else {
      state = bidMin(state);
    }
    const squeezed = getTurnOptions(state);
    assert.ok(squeezed);
    assert.equal(squeezed.seat, y);
    assert.deepEqual(squeezed.bids, []);
    const overLimit = applyAction(
      state,
      { type: "bid", seat: y, amount: state.lot!.highBid + 1 },
      NOW
    );
    assert.equal(overLimit.ok, false);
    if (!overLimit.ok) assert.equal(overLimit.error.code, EngineErrorCode.BidOverLimit);
  });

  it("sells immediately when the only contender left opens, at the floor only", () => {
    let state = startDraft({ seats: ["human", "human", "human"] });
    state = pass(state);
    state = pass(state);
    const last = turnOf(state);
    assert.deepEqual(getTurnOptions(state)?.bids, [1], "nobody left to outbid: no $2/$3 openings");
    const jump = applyAction(state, { type: "bid", seat: last, amount: 3 }, NOW);
    assert.equal(jump.ok, false);
    state = bidMin(state);
    assert.equal(state.phase, DraftPhase.Resolved);
    assert.deepEqual(state.lot?.outcome, { kind: LotOutcomeKind.Sold, seat: last, price: 1 });
  });
});

describe("table flow", () => {
  it("rotates the opening seat around the table", () => {
    let state = startDraft({ seats: ["human", "human", "human"], pool: makePool(24) });
    const openers: number[] = [];
    for (let lot = 0; lot < 6; lot += 1) {
      openers.push(state.lot!.opener);
      state = bidMin(state);
      state = pass(state);
      state = pass(state);
      state = toNextDecision(advance(state));
    }
    const first = openers[0];
    assert.deepEqual(
      openers,
      [0, 1, 2, 3, 4, 5].map((offset) => (first + offset) % 3)
    );
  });

  it("drops a full roster out of the auction while the others keep drafting", () => {
    let state = startDraft({ seats: ["human", "human", "human"], pool: makePool(24) });
    const champion = turnOf(state);
    while (state.seats[champion].roster.length < 5) {
      state = toNextDecision(playLotForWinner(state, champion));
      if (state.phase === DraftPhase.Resolved) state = toNextDecision(advance(state));
    }
    assert.equal(openSpots(state.seats[champion], state.rules), 0);
    for (let lot = 0; lot < 4 && state.phase === DraftPhase.Bidding; lot += 1) {
      assert.ok(!state.lot!.eligible.includes(champion), "a full roster is not eligible");
      assert.notEqual(turnOf(state), champion);
      state = bidMin(state);
      state = pass(state);
      state = toNextDecision(advance(state));
    }
  });

  it("makes the last seat with open spots take every remaining card at $1", () => {
    let state = startDraft();
    const champion = turnOf(state);
    const other = (champion + 1) % 2;
    for (;;) {
      state = playLotForWinner(state, champion);
      if (state.seats[champion].roster.length === 5) break;
      state = advance(state);
    }
    const moneyBefore = state.seats[other].money;
    const spotsBefore = openSpots(state.seats[other], state.rules);
    // Opening the next card resolves it straight away: nobody else has room.
    state = advance(state);
    let forced = 0;
    while (state.phase !== DraftPhase.Complete) {
      assert.equal(state.phase, DraftPhase.Resolved, "the lone seat never has to decide");
      assert.equal(getTurnOptions(state), null);
      assert.deepEqual(state.lot?.outcome, {
        kind: LotOutcomeKind.ForcedFill,
        seat: other,
        price: 1,
      });
      forced += 1;
      state = advance(state);
    }
    assert.equal(forced, spotsBefore);
    assert.equal(state.seats[other].money, moneyBefore - spotsBefore);
    assert.ok(state.seats.every((seat) => openSpots(seat, state.rules) === 0));
  });

  it("locks the opening pass when cards left equal the open spots for them", () => {
    let state = startDraft({ pool: makePool(10) });
    const options = getTurnOptions(state);
    assert.ok(options);
    assert.equal(state.lot?.skipLocked, true);
    assert.equal(options.canPass, false);
    assert.equal(options.passBlockedBy, PassBlockReason.LastCardsForSlot);
    assert.equal(state.seats[options.seat].skipsLeft, 2, "the lock applies even with skips left");
    state = bidMin(state);
    assert.equal(getTurnOptions(state)?.canPass, true, "after an opening bid passing is free");
  });

  it("refuses to end a draft whose deck ran out with spots still open", () => {
    const sold = pass(bidMin(startDraft()));
    assert.equal(sold.phase, DraftPhase.Resolved);
    const exhausted = { ...sold, deck: sold.deck.slice(0, sold.nextDeckIndex) };
    const result = applyAction(exhausted, { type: "advance" }, NOW);
    assert.equal(result.ok, false, "must not report a complete draft with empty spots");
    if (!result.ok) assert.equal(result.error.code, EngineErrorCode.DeckExhausted);
    assert.equal(parseDraftState(JSON.parse(JSON.stringify(exhausted))).ok, false);
  });

  it("engages the lock once discards use up the spare cards, regardless of skips", () => {
    const rules = { ...createSinglePositionRules(["pick"]), skipsPerSeat: 5 };
    let state = startDraft({ pool: makePool(12), rules });
    for (let discard = 0; discard < 2; discard += 1) {
      assert.equal(state.lot?.skipLocked, false);
      state = pass(state);
      state = pass(state);
      state = advance(state);
    }
    const options = getTurnOptions(state);
    assert.ok(options);
    assert.equal(state.seats[options.seat].skipsLeft, 3);
    assert.equal(options.passBlockedBy, PassBlockReason.LastCardsForSlot);
  });
});

describe("shot clock helpers", () => {
  it("times out to a pass when allowed and to the minimum bid when not", () => {
    const state = startDraft({ pool: makePool(16) });
    assert.deepEqual(getTimeoutAction(state), { type: "pass", seat: turnOf(state) });
    const locked = startDraft({ pool: makePool(10) });
    assert.deepEqual(getTimeoutAction(locked), { type: "bid", seat: turnOf(locked), amount: 1 });
  });

  it("lets a scheduled action through only for the decision it was scheduled for", () => {
    const state = startDraft({ seats: ["human", "human", "human"] });
    const key = getTurnKey(state);
    assert.ok(key);
    const timeout = getTimeoutAction(state);
    assert.ok(timeout);
    const afterTimeout = applyActionForTurn(state, key, timeout, NOW);
    assert.ok(afterTimeout.ok);
    // The same timer firing again (late callback, resume, double render) is refused untouched.
    const replay = applyActionForTurn(afterTimeout.value, key, timeout, NOW);
    assert.equal(replay.ok, false);
    if (!replay.ok) assert.equal(replay.error.code, EngineErrorCode.StaleTurn);
  });

  it("guards every tap and timer by step, including moving past a resolved card", () => {
    let state = startDraft({ seats: ["human", "human"] });
    const opener = turnOf(state);
    const bidKey = getStepKey(state);
    assert.ok(bidKey);
    state = act(state, { type: "bid", seat: opener, amount: 1 });
    // A second tap rendered for the same step (double tap, stale render) is refused untouched.
    const doubleTap = applyActionForStep(
      state,
      bidKey,
      { type: "bid", seat: opener, amount: 1 },
      NOW
    );
    assert.equal(doubleTap.ok, false);
    if (!doubleTap.ok) assert.equal(doubleTap.error.code, EngineErrorCode.StaleTurn);

    state = pass(state);
    assert.equal(state.phase, DraftPhase.Resolved);
    const resolvedKey = getStepKey(state);
    assert.ok(resolvedKey && resolvedKey !== bidKey);
    const moved = applyActionForStep(state, resolvedKey, { type: "advance" }, NOW);
    assert.ok(moved.ok);
    // "Next card" tapped twice, or the auto-advance timer firing after the tap: refused.
    const again = applyActionForStep(moved.value, resolvedKey, { type: "advance" }, NOW);
    assert.equal(again.ok, false);
    assert.equal(getStepKey(moved.value), getTurnKey(moved.value));
  });

  it("gives every decision point a distinct turn key", () => {
    let state = startDraft({ seats: ["human", "human", "human"] });
    const keys = new Set<string>();
    for (let step = 0; step < 12 && state.phase !== DraftPhase.Complete; step += 1) {
      const key = getTurnKey(state);
      if (key) {
        assert.ok(!keys.has(key), `turn key ${key} repeated`);
        keys.add(key);
        state =
          step % 3 === 0
            ? bidMin(state)
            : getTurnOptions(state)!.canPass
              ? pass(state)
              : bidMin(state);
      } else {
        assert.equal(getTimeoutAction(state), null);
        state = advance(state);
      }
    }
    assert.ok(keys.size >= 6);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyAction, createDraft } from "../draft";
import {
  createSinglePositionRules,
  maxBidFor,
  openSpots,
  openSpotsForSlot,
  rosterSize,
} from "../rules";
import { computeReferenceHauls, computeVerdict, Grade } from "../scoring";
import { countOpenForSlot, countRemainingForSlot, getCard, getTurnOptions } from "../selectors";
import { runDraft } from "../simulate";
import {
  BotPersonality,
  DRAFT_SCHEMA_VERSION,
  DraftMode,
  DraftPhase,
  LotOutcomeKind,
  PassBlockReason,
  SeatKind,
  type DraftAction,
  type DraftState,
  type EngineCard,
  type LotRecord,
  type RuleSet,
  type SlotRule,
} from "../types";
import { checkDraftInvariants, parseDraftState } from "../validate";
import { makePool, makeSeats, NOW, type SeatSpec } from "./helpers";

/** The Starting XI: $40 for a keeper, two centre-backs, two full-backs, three mids, two wingers, a striker. */
const XI_SLOTS: SlotRule[] = [
  { id: "gk", count: 1, accepts: ["gk"] },
  { id: "cb", count: 2, accepts: ["cb"] },
  { id: "fb", count: 2, accepts: ["fb"] },
  { id: "mid", count: 3, accepts: ["mid"] },
  { id: "w", count: 2, accepts: ["w"] },
  { id: "st", count: 1, accepts: ["st"] },
];
/** A $30 lineup whose slots differ in size, like the NFL full lineup. */
const NFL_SLOTS: SlotRule[] = [
  { id: "qb", count: 1, accepts: ["qb"] },
  { id: "rb", count: 2, accepts: ["rb"] },
  { id: "wr", count: 2, accepts: ["wr"] },
  { id: "te", count: 1, accepts: ["te"] },
  { id: "def", count: 1, accepts: ["def"] },
];

const lineupRules = (slots: SlotRule[], budget: number): RuleSet => ({
  ...createSinglePositionRules(["unused"]),
  budget,
  slots,
});

/**
 * Cards for every slot. "deep" deals the usual half again; "tight" has exactly one card per spot
 * at the table, so every card must be bought and nobody may ever skip.
 */
const lineupPool = (slots: SlotRule[], seatCount: number, supply: "deep" | "tight") =>
  slots.flatMap((slot, slotIndex) => {
    const needed = slot.count * seatCount;
    const count = supply === "tight" ? needed : needed + Math.ceil(needed * 0.5) + 2;
    return Array.from({ length: count }, (_, index): EngineCard => ({
      id: `${slot.id}-${index + 1}`,
      position: slot.accepts[0],
      rating: 96 - ((index * 7 + slotIndex * 5) % 45),
    }));
  });

const TABLES: Record<number, SeatSpec[][]> = {
  2: [
    ["human", BotPersonality.Shark],
    [BotPersonality.Accountant, BotPersonality.Gambler],
  ],
  3: [["human", BotPersonality.Accountant, BotPersonality.Gambler]],
  4: [
    ["human", BotPersonality.Shark, BotPersonality.Accountant, BotPersonality.Gambler],
    ["human", "human", BotPersonality.Shark, BotPersonality.Accountant],
  ],
};

/** Applies one action, insisting it is legal and leaves a valid draft. */
const step = (state: DraftState, action: DraftAction): DraftState => {
  const result = applyAction(state, action, NOW);
  assert.ok(result.ok, result.ok ? "" : `${result.error.code}: ${result.error.message}`);
  assert.deepEqual(checkDraftInvariants(result.value), []);
  return result.value;
};

const startLineup = (
  slots: SlotRule[],
  budget: number,
  specs: SeatSpec[],
  supply: "deep" | "tight",
  seed: number
): DraftState => {
  const result = createDraft({
    packId: "lineup-test",
    rules: lineupRules(slots, budget),
    seats: makeSeats(specs),
    pool: lineupPool(slots, specs.length, supply),
    seed,
    now: NOW,
  });
  assert.ok(result.ok, result.ok ? "" : result.error.message);
  return result.value;
};

interface Observed {
  soleEligibleWhileOthersDraft: number;
  forcedFills: number;
  unplaceable: number;
  skipLockedLots: number;
}

/** Checks the position rules at every step of a draft and counts the situations it went through. */
const checkLineupStep = (state: DraftState, seen: Set<number>, observed: Observed) => {
  assert.deepEqual(checkDraftInvariants(state), [], "draft invariants");
  const lot = state.lot;
  if (!lot) return;
  const slot = state.rules.slots.find((entry) => entry.id === lot.slotId);
  assert.ok(slot && slot.accepts.includes(getCard(state, lot.cardId)?.position ?? ""));

  if (state.phase === DraftPhase.Bidding && lot.bids.length === 0 && lot.passed.length === 0) {
    if (!seen.has(lot.number)) {
      seen.add(lot.number);
      // Only seats with an open spot of this card's position take part.
      const withRoom = state.seats.flatMap((seat, index) =>
        openSpotsForSlot(seat, slot) > 0 ? [index] : []
      );
      assert.deepEqual(lot.eligible, withRoom);
      // Skipping locks per position, when its cards only just cover its open spots.
      assert.equal(
        lot.skipLocked,
        countRemainingForSlot(state, slot.id, lot.deckIndex) <= countOpenForSlot(state, slot.id)
      );
      if (lot.skipLocked) observed.skipLockedLots += 1;
      const drafting = state.seats.filter((seat) => openSpots(seat, state.rules) > 0).length;
      if (lot.eligible.length === 1 && drafting > 1) {
        observed.soleEligibleWhileOthersDraft += 1;
        const options = getTurnOptions(state);
        assert.ok(options);
        // Nobody can outbid the only seat with room: it may take the card at $1 or skip it.
        assert.deepEqual(options.bids, [state.rules.openingBid]);
        assert.equal(options.canPass, !lot.skipLocked && state.seats[options.seat].skipsLeft > 0);
      }
    }
  }
  if (state.phase === DraftPhase.Bidding && lot.turn !== null) {
    const seat = state.seats[lot.turn];
    const options = getTurnOptions(state);
    assert.ok(options);
    // The reserve keeps $1 for every other open spot, whatever position it is.
    assert.equal(options.maxBid, seat.money - (openSpots(seat, state.rules) - 1));
    assert.equal(maxBidFor(seat, state.rules), options.maxBid);
  }
};

const countOutcomes = (state: DraftState, observed: Observed) => {
  for (const record of state.history) {
    if (record.kind === LotOutcomeKind.ForcedFill) {
      observed.forcedFills += 1;
      assert.equal(record.price, state.rules.forcedFillPrice);
    }
    if (record.kind === LotOutcomeKind.Unplaceable) observed.unplaceable += 1;
  }
};

const assertCompleteLineup = (state: DraftState, label: string) => {
  assert.equal(state.phase, DraftPhase.Complete, label);
  for (const seat of state.seats) {
    assert.equal(seat.roster.length, rosterSize(state.rules), label);
    for (const slot of state.rules.slots) {
      const entries = seat.roster.filter((entry) => entry.slotId === slot.id);
      assert.equal(entries.length, slot.count, `${label} ${slot.id}`);
      for (const entry of entries) {
        assert.ok(slot.accepts.includes(getCard(state, entry.cardId)?.position ?? ""), label);
      }
    }
    const spent = seat.roster.reduce((total, entry) => total + entry.price, 0);
    assert.equal(spent + seat.money, state.rules.budget, label);
    assert.ok(seat.money >= 0, label);
  }
};

describe("lineup drafts", () => {
  it("fill every position exactly at 2, 3 and 4 seats, deep or tight supply", () => {
    const observed: Observed = {
      soleEligibleWhileOthersDraft: 0,
      forcedFills: 0,
      unplaceable: 0,
      skipLockedLots: 0,
    };
    for (const [slots, budget] of [
      [XI_SLOTS, 40],
      [NFL_SLOTS, 30],
    ] as const) {
      for (const seatCount of [2, 3, 4]) {
        for (const specs of TABLES[seatCount]) {
          for (const supply of ["deep", "tight"] as const) {
            for (let seed = 1; seed <= 6; seed += 1) {
              const label = `${slots.length} slots, ${seatCount} seats, ${supply}, seed ${seed}`;
              const seen = new Set<number>();
              const start = startLineup([...slots], budget, specs, supply, seed);
              checkLineupStep(start, seen, observed);
              const end = runDraft(start, {
                now: NOW,
                policySeed: seed,
                onStep: (state) => checkLineupStep(state, seen, observed),
              });
              assertCompleteLineup(end, label);
              countOutcomes(end, observed);
              if (supply === "tight") {
                // Every card is needed, so none can be skipped away.
                assert.ok(end.history.every((record) => record.kind !== LotOutcomeKind.Discarded));
              }
            }
          }
        }
      }
    }
    // The position-specific situations really happened, so the checks above were exercised.
    assert.ok(observed.soleEligibleWhileOthersDraft > 0, "a lone seat with room for a position");
    assert.ok(observed.forcedFills > 0, "forced $1 fills");
    assert.ok(observed.unplaceable > 0, "cards skipped because nobody had room");
    assert.ok(observed.skipLockedLots > 0, "position skip locks");
  });

  it("starts an eleven-spot table with $30 to spend on the first card", () => {
    const state = startLineup(XI_SLOTS, 40, ["human", "human"], "deep", 3);
    const options = getTurnOptions(state);
    assert.ok(options);
    assert.equal(options.maxBid, 40 - 10);
    assert.equal(rosterSize(state.rules), 11);
  });

  it("spends opening skips across positions and blocks them when none are left", () => {
    let state = startLineup(XI_SLOTS, 40, ["human", "human"], "deep", 5);
    let skipped = 0;
    // Pass on every unopened card that allows it, by whoever opens, until the skips run out.
    while (skipped < 4 && state.phase !== DraftPhase.Complete) {
      if (state.phase === DraftPhase.Resolved) {
        state = step(state, { type: "advance" });
        continue;
      }
      const options = getTurnOptions(state);
      assert.ok(options);
      const hasBid = state.lot?.highBidder !== null;
      if (!hasBid && options.canPass) {
        const before = state.seats[options.seat].skipsLeft;
        state = step(state, { type: "pass", seat: options.seat });
        assert.equal(state.seats[options.seat].skipsLeft, before - 1);
        skipped += 1;
      } else if (!hasBid && options.passBlockedBy === PassBlockReason.NoSkipsLeft) {
        assert.equal(state.seats[options.seat].skipsLeft, 0);
        state = step(state, { type: "bid", seat: options.seat, amount: options.bids[0] });
      } else {
        state = step(state, { type: "bid", seat: options.seat, amount: options.bids[0] });
      }
    }
    assert.equal(skipped, 4);
    assert.ok(state.seats.every((seat) => seat.skipsLeft === 0));
  });

  it("resumes a saved lineup mid-auction and finishes exactly like the uninterrupted draft", () => {
    for (const seed of [2, 9, 21]) {
      const bots: SeatSpec[] = [
        BotPersonality.Shark,
        BotPersonality.Accountant,
        BotPersonality.Gambler,
        BotPersonality.Accountant,
      ];
      const start = startLineup(XI_SLOTS, 40, bots, "deep", seed);
      let saved: DraftState | null = null;
      let steps = 0;
      const straight = runDraft(start, {
        now: NOW,
        onStep: (state) => {
          steps += 1;
          if (steps === 40) saved = state;
        },
      });
      assert.ok(saved, "the draft ran past the save point");
      const reloaded = parseDraftState(JSON.parse(JSON.stringify(saved)));
      assert.ok(reloaded.ok, reloaded.ok ? "" : reloaded.error.message);
      const resumed = runDraft(reloaded.value, { now: NOW });
      assert.deepEqual(resumed, straight);
      assertCompleteLineup(resumed, `resume seed ${seed}`);
    }
  });
});

/** A finished two-slot draft built by hand: one keeper and one striker per seat. */
const finishedKeeperStrikerDraft = (): DraftState => {
  const cards: (EngineCard & { slotId: string })[] = [
    { id: "gk-a", position: "gk", rating: 60, slotId: "gk" },
    { id: "gk-b", position: "gk", rating: 50, slotId: "gk" },
    { id: "st-a", position: "st", rating: 99, slotId: "st" },
    { id: "st-b", position: "st", rating: 98, slotId: "st" },
  ];
  const owner: Record<string, number> = { "gk-a": 0, "st-a": 0, "gk-b": 1, "st-b": 1 };
  const history: LotRecord[] = cards.map((card, index) => ({
    number: index + 1,
    deckIndex: index,
    cardId: card.id,
    slotId: card.slotId,
    kind: LotOutcomeKind.Sold,
    seat: owner[card.id],
    price: 2,
    opener: 0,
    bidCount: 1,
  }));
  const seat = (index: number) => ({
    id: `seat-${index}`,
    name: `Seat ${index + 1}`,
    kind: SeatKind.Human,
    personality: null,
    money: 6,
    skipsLeft: 2,
    roster: cards
      .filter((card) => owner[card.id] === index)
      .map((card) => ({
        cardId: card.id,
        slotId: card.slotId,
        price: 2,
        lotNumber: cards.indexOf(card) + 1,
      })),
  });
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    id: "keeper-striker",
    packId: "lineup-test",
    mode: DraftMode.Quick,
    dailyKey: null,
    seed: 1,
    createdAt: NOW,
    updatedAt: NOW,
    rules: lineupRules(
      [
        { id: "gk", count: 1, accepts: ["gk"] },
        { id: "st", count: 1, accepts: ["st"] },
      ],
      10
    ),
    pool: cards.map(({ id, position, rating }) => ({ id, position, rating })),
    deck: cards.map((card) => card.id),
    nextDeckIndex: cards.length,
    nextOpener: 0,
    seats: [seat(0), seat(1)],
    lot: null,
    history,
    phase: DraftPhase.Complete,
  };
};

describe("lineup grading", () => {
  it("measures a lineup against the best and worst legal lineups, position by position", () => {
    const state = finishedKeeperStrikerDraft();
    assert.deepEqual(checkDraftInvariants(state), []);
    // Pooling every shown card would call 99 + 98 (two strikers) the best possible roster.
    assert.deepEqual(computeReferenceHauls(state), { best: 60 + 99, worst: 50 + 98 });
    const verdict = computeVerdict(state);
    // Seat 1 took the better keeper and the better striker: the best legal lineup, an A+.
    assert.equal(verdict.results[0].totalRating, 159);
    assert.equal(verdict.results[0].haulShare, 1);
    assert.equal(verdict.results[0].grade, Grade.APlus);
    assert.equal(verdict.results[1].haulShare, 0);
    assert.equal(verdict.results[1].grade, Grade.F);
  });

  it("grades one-slot packs exactly as before (top and bottom of everything shown)", () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const result = createDraft({
        packId: "single",
        rules: createSinglePositionRules(["pick"]),
        seats: makeSeats(["human", BotPersonality.Shark, BotPersonality.Gambler]),
        pool: makePool(30),
        seed,
        now: NOW,
      });
      assert.ok(result.ok);
      const end = runDraft(result.value, { now: NOW, policySeed: seed });
      const shown = end.history
        .filter((record) => record.kind !== LotOutcomeKind.Unplaceable)
        .map((record) => getCard(end, record.cardId)?.rating ?? 0)
        .sort((a, b) => b - a);
      const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
      assert.deepEqual(computeReferenceHauls(end), {
        best: sum(shown.slice(0, 5)),
        worst: sum(shown.slice(-5)),
      });
    }
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSinglePositionRules } from "../rules";
import { computeVerdict, Grade, gradeForShare } from "../scoring";
import { runDraft } from "../simulate";
import {
  BotPersonality,
  DRAFT_SCHEMA_VERSION,
  DraftMode,
  DraftPhase,
  LotOutcomeKind,
  SeatKind,
  type DraftState,
  type EngineCard,
  type LotRecord,
} from "../types";
import { makePool, NOW, startDraft } from "./helpers";

interface Pick {
  rating: number;
  price: number;
}

/** A finished draft built by hand so the verdict maths can be checked exactly. */
const finishedDraft = (rosters: Pick[][], discardedRatings: number[] = []): DraftState => {
  const pool: EngineCard[] = [];
  const history: LotRecord[] = [];
  const addCard = (rating: number, kind: LotOutcomeKind, seat: number | null, price: number) => {
    const id = `card-${pool.length}`;
    pool.push({ id, position: "pick", rating });
    history.push({
      number: history.length + 1,
      deckIndex: history.length,
      cardId: id,
      slotId: "pick",
      kind,
      seat,
      price,
      opener: 0,
      bidCount: 1,
    });
    return id;
  };
  const seats = rosters.map((picks, seat) => ({
    id: `seat-${seat}`,
    name: `Seat ${seat + 1}`,
    kind: SeatKind.Human,
    personality: null,
    skipsLeft: 0,
    money: 20 - picks.reduce((total, pick) => total + pick.price, 0),
    roster: picks.map((pick) => ({
      cardId: addCard(pick.rating, LotOutcomeKind.Sold, seat, pick.price),
      slotId: "pick",
      price: pick.price,
      lotNumber: history.length,
    })),
  }));
  for (const rating of discardedRatings) addCard(rating, LotOutcomeKind.Discarded, null, 0);
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    id: "hand-built",
    packId: "test",
    mode: DraftMode.Quick,
    dailyKey: null,
    seed: 1,
    createdAt: NOW,
    updatedAt: NOW,
    rules: createSinglePositionRules(["pick"], { count: rosters[0].length }),
    pool,
    deck: pool.map((card) => card.id),
    nextDeckIndex: pool.length,
    nextOpener: 0,
    seats,
    lot: null,
    history,
    phase: DraftPhase.Complete,
  };
};

describe("verdict", () => {
  it("declares co-winners when totals tie", () => {
    const verdict = computeVerdict(
      finishedDraft(
        [
          [
            { rating: 90, price: 5 },
            { rating: 60, price: 1 },
          ],
          [
            { rating: 80, price: 3 },
            { rating: 70, price: 2 },
          ],
        ],
        [50]
      )
    );
    assert.deepEqual(
      verdict.results.map((result) => result.totalRating),
      [150, 150]
    );
    assert.deepEqual(
      verdict.results.map((result) => result.rank),
      [1, 1]
    );
    assert.deepEqual(verdict.winners, [0, 1]);
    assert.equal(verdict.isTie, true);
  });

  it("ranks with shared places and a single winner when one total is highest", () => {
    const verdict = computeVerdict(
      finishedDraft([
        [{ rating: 90, price: 4 }],
        [{ rating: 95, price: 6 }],
        [{ rating: 90, price: 2 }],
      ])
    );
    assert.deepEqual(
      verdict.results.map((result) => result.rank),
      [2, 1, 2]
    );
    assert.deepEqual(verdict.standings, [1, 0, 2]);
    assert.deepEqual(verdict.winners, [1]);
    assert.equal(verdict.isTie, false);
  });

  it("finds the best buy and the biggest overpay from what the table spent", () => {
    const state = finishedDraft(
      [
        [
          { rating: 90, price: 5 },
          { rating: 60, price: 1 },
        ],
        [
          { rating: 80, price: 3 },
          { rating: 70, price: 2 },
        ],
      ],
      [50]
    );
    const verdict = computeVerdict(state);
    const ratingOf = (cardId: string | undefined) =>
      state.pool.find((card) => card.id === cardId)?.rating;
    // Weights over the weakest shown card (50): 41, 11, 31, 21 of 104; spend $11.
    assert.equal(ratingOf(verdict.bestBuy?.cardId), 80);
    assert.equal(verdict.bestBuy?.seat, 1);
    assert.ok(Math.abs((verdict.bestBuy?.margin ?? 0) - (11 * 31) / 104 + 3) < 1e-9);
    assert.equal(ratingOf(verdict.biggestOverpay?.cardId), 90);
    assert.ok((verdict.biggestOverpay?.margin ?? 0) < 0);
  });

  it("grades rosters by their share of the best possible haul", () => {
    const verdict = computeVerdict(
      finishedDraft(
        [
          [
            { rating: 90, price: 5 },
            { rating: 60, price: 1 },
          ],
          [
            { rating: 80, price: 3 },
            { rating: 70, price: 2 },
          ],
        ],
        [50]
      )
    );
    // Best two shown: 170, worst two: 110, so 150 sits at two thirds.
    assert.ok(Math.abs(verdict.results[0].haulShare - 2 / 3) < 1e-9);
    assert.equal(verdict.results[0].grade, Grade.B);
    assert.equal(gradeForShare(1), Grade.APlus);
    assert.equal(gradeForShare(0.75), Grade.A);
    assert.equal(gradeForShare(0.3), Grade.D);
    assert.equal(gradeForShare(0), Grade.F);
  });

  it("adds up a simulated draft exactly", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const end = runDraft(
        startDraft({
          seats: [BotPersonality.Accountant, BotPersonality.Shark, BotPersonality.Gambler],
          seed,
          pool: makePool(24),
        }),
        { now: NOW }
      );
      const verdict = computeVerdict(end);
      verdict.results.forEach((result, seat) => {
        const roster = end.seats[seat].roster;
        const ratings = roster.map(
          (entry) => end.pool.find((card) => card.id === entry.cardId)?.rating ?? NaN
        );
        assert.equal(
          result.totalRating,
          ratings.reduce((total, rating) => total + rating, 0)
        );
        assert.equal(result.spent + result.moneyLeft, end.rules.budget);
        assert.ok(result.haulShare >= 0 && result.haulShare <= 1);
      });
      assert.deepEqual([...verdict.standings].sort(), [0, 1, 2]);
      assert.ok(verdict.winners.length >= 1);
    }
  });
});

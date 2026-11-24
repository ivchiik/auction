import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { botRngFor, chooseBotAction, GAMBLER_MISREAD_POINTS, valueCurrentCard } from "../bots";
import { createRng } from "../rng";
import { getTurnOptions } from "../selectors";
import { runDraft } from "../simulate";
import { BotPersonality, DraftPhase, type DraftAction, type DraftState } from "../types";
import { act, advance, makePool, NOW, startDraft } from "./helpers";

const ALL_BOTS = [BotPersonality.Accountant, BotPersonality.Shark, BotPersonality.Gambler];

/** Same multiset of upcoming cards, different order: what a bot must not be able to tell apart. */
const withUpcomingCardsReordered = (state: DraftState): DraftState => {
  const revealed = state.deck.slice(0, state.nextDeckIndex);
  const upcoming = [...state.deck.slice(state.nextDeckIndex)].reverse();
  return { ...state, deck: [...revealed, ...upcoming] };
};

const botMove = (state: DraftState): DraftAction => {
  const rng = botRngFor(state);
  assert.ok(rng, "expected a pending bot turn");
  const action = chooseBotAction(state, rng);
  assert.ok(action, "expected the bot to act");
  return action;
};

describe("bots", () => {
  it("only act for bot seats", () => {
    const state = startDraft({ seats: ["human", "human"] });
    assert.equal(chooseBotAction(state, createRng(1)), null);
  });

  it("always choose an action the rules allow", () => {
    for (const personality of ALL_BOTS) {
      for (let seed = 0; seed < 40; seed += 1) {
        let state = startDraft({ seats: [personality, personality, personality], seed });
        while (state.phase !== DraftPhase.Complete) {
          if (state.phase === DraftPhase.Resolved) {
            state = advance(state);
            continue;
          }
          const options = getTurnOptions(state);
          assert.ok(options);
          const action = botMove(state);
          if (action.type === "bid") {
            assert.ok(options.bids.includes(action.amount), `${personality} made an illegal bid`);
          } else {
            assert.equal(action.type, "pass");
            assert.ok(options.canPass, `${personality} passed while forced to bid`);
          }
          state = act(state, action);
        }
      }
    }
  });

  it("never peek at the order of the deck", () => {
    for (let seed = 0; seed < 30; seed += 1) {
      let state = startDraft({
        seats: [BotPersonality.Accountant, BotPersonality.Shark, BotPersonality.Gambler],
        seed,
        pool: makePool(24),
      });
      for (let step = 0; step < 25 && state.phase !== DraftPhase.Complete; step += 1) {
        if (state.phase !== DraftPhase.Bidding) {
          state = advance(state);
          continue;
        }
        const twin = withUpcomingCardsReordered(state);
        const seat = state.lot?.turn ?? -1;
        assert.deepEqual(valueCurrentCard(twin, seat), valueCurrentCard(state, seat));
        assert.deepEqual(botMove(twin), botMove(state));
        state = act(state, botMove(state));
      }
    }
  });

  it("make the same decision every time for the same table", () => {
    const state = startDraft({ seats: [BotPersonality.Gambler, BotPersonality.Gambler], seed: 3 });
    const first = botMove(state);
    for (let repeat = 0; repeat < 5; repeat += 1) assert.deepEqual(botMove(state), first);
  });

  it("let the Gambler misread a card by a bounded, stable amount", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const state = startDraft({ seats: [BotPersonality.Gambler, "human"], seed });
      const card = state.pool.find((entry) => entry.id === state.lot?.cardId);
      const reading = valueCurrentCard(state, 0);
      const honest = valueCurrentCard(state, 1);
      assert.ok(card && reading && honest);
      assert.ok(Math.abs(reading.perceivedRating - card.rating) <= GAMBLER_MISREAD_POINTS);
      assert.equal(valueCurrentCard(state, 0)?.perceivedRating, reading.perceivedRating);
      assert.equal(honest.perceivedRating, card.rating, "everyone else reads the card straight");
    }
  });

  it("let the Shark skip ordinary cards while spare cards remain and open on stars", () => {
    const pool = [...makePool(3, "pick", 99), ...makePool(17, "pick", 60)].map((card, index) => ({
      ...card,
      id: `card-${index}`,
    }));
    let sawSkip = false;
    let sawStarOpen = false;
    for (let seed = 0; seed < 60; seed += 1) {
      const state = startDraft({ seats: [BotPersonality.Shark, BotPersonality.Shark], seed, pool });
      const valuation = valueCurrentCard(state, state.lot?.turn ?? -1);
      assert.ok(valuation);
      const action = botMove(state);
      if (valuation.isStar) {
        assert.equal(action.type, "bid", "a Shark opens on a star");
        sawStarOpen = true;
      } else {
        assert.equal(action.type, "pass", "a Shark lets an ordinary card go when it can");
        sawSkip = true;
      }
    }
    assert.ok(sawSkip && sawStarOpen, "both branches were exercised");
  });

  it("finish full bot tables with every roster filled", () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const start = startDraft({
        seats: [...ALL_BOTS, BotPersonality.Shark],
        seed,
        pool: makePool(30),
      });
      const end = runDraft(start, { now: NOW });
      assert.equal(end.phase, DraftPhase.Complete);
      assert.ok(end.seats.every((seat) => seat.roster.length === 5));
    }
  });
});

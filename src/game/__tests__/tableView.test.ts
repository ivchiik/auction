import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PACKS, rulesForPack, toEngineCards } from "data";
import { BotPersonality, createDraft, DraftPhase, runDraft, SeatKind } from "engine";

import { buildTableView } from "../tableView";

const HIDDEN_KEYS = /"(rating|ratingBasis|ratingSource|sourceIndex)"\s*:/;

describe("table view", () => {
  it("never carries a rating, a rating basis or a rating source before the reveal", () => {
    for (const pack of PACKS) {
      const bases = pack.cards.map((card) => card.ratingBasis);
      const created = createDraft({
        packId: pack.id,
        rules: rulesForPack(pack),
        pool: toEngineCards(pack),
        seats: [
          { id: "a", name: "You", kind: SeatKind.Human },
          { id: "b", name: "Shark", kind: SeatKind.Bot, personality: BotPersonality.Shark },
          { id: "c", name: "Gambler", kind: SeatKind.Bot, personality: BotPersonality.Gambler },
        ],
        seed: 4,
        now: 1,
      });
      assert.ok(created.ok);
      let checked = 0;
      runDraft(created.value, {
        now: 1,
        onStep: (state) => {
          const text = JSON.stringify(buildTableView(state, pack));
          assert.doesNotMatch(text, HIDDEN_KEYS, `${pack.id}: hidden field in view`);
          for (const basis of bases) {
            assert.ok(!text.includes(basis), `${pack.id}: basis "${basis}" leaked`);
          }
          checked += 1;
        },
      });
      assert.ok(checked > 10);
    }
  });

  it("describes seats, the lot on the block and the turn options", () => {
    const pack = PACKS[0];
    const created = createDraft({
      packId: pack.id,
      rules: rulesForPack(pack),
      pool: toEngineCards(pack),
      seats: [
        { id: "a", name: "Ana", kind: SeatKind.Human },
        { id: "b", name: "Ben", kind: SeatKind.Human },
      ],
      seed: 9,
      now: 1,
    });
    assert.ok(created.ok);
    const view = buildTableView(created.value, pack);
    assert.equal(view.phase, DraftPhase.Bidding);
    assert.equal(view.seats.length, 2);
    assert.ok(view.seats.every((seat) => seat.money === 20 && seat.openSpots === 5));
    assert.equal(view.seats.filter((seat) => seat.isTurn).length, 1);
    assert.ok(view.lot && view.lot.card.name.length > 0);
    assert.deepEqual(view.turn?.bids, [1, 2, 3]);
    assert.ok(view.stepKey);
  });
});

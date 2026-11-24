import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BENCH_SHARE, buildDeck, findDeckShortfall, planDeck } from "../deck";
import { createRng, deriveSeed, shuffle } from "../rng";
import { createSinglePositionRules } from "../rules";
import type { RuleSet } from "../types";
import { makePool } from "./helpers";

const rules = createSinglePositionRules(["pick"]);

describe("deck", () => {
  it("grows with the table and never exceeds the pack", () => {
    const pool = makePool(30);
    const sizes = [2, 3, 4].map((seats) => buildDeck(rules, pool, seats, createRng(1)).length);
    assert.deepEqual(sizes, [15, 23, 30]);
    assert.equal(buildDeck(rules, makePool(27), 4, createRng(1)).length, 27);
  });

  it("reports a shortfall when a pack cannot fill every roster", () => {
    assert.equal(findDeckShortfall(planDeck(rules, makePool(19), 4))?.required, 20);
    assert.equal(findDeckShortfall(planDeck(rules, makePool(20), 4)), null);
  });

  it("deals unique cards from the pack and saves the bench for last", () => {
    const pool = makePool(30);
    const ratingOf = new Map(pool.map((card) => [card.id, card.rating]));
    for (let seed = 0; seed < 50; seed += 1) {
      const deck = buildDeck(rules, pool, 3, createRng(seed));
      assert.equal(new Set(deck).size, deck.length);
      assert.ok(deck.every((id) => ratingOf.has(id)));
      const benchCount = Math.round(deck.length * BENCH_SHARE);
      const starters = deck.slice(0, deck.length - benchCount).map((id) => ratingOf.get(id)!);
      const bench = deck.slice(deck.length - benchCount).map((id) => ratingOf.get(id)!);
      assert.ok(
        Math.max(...bench) < Math.min(...starters),
        `seed ${seed}: bench outranks a starter`
      );
    }
  });

  it("is a pure function of the seed", () => {
    const pool = makePool(30);
    const first = buildDeck(rules, pool, 4, createRng(deriveSeed(99, "deck")));
    const again = buildDeck(rules, pool, 4, createRng(deriveSeed(99, "deck")));
    const other = buildDeck(rules, pool, 4, createRng(deriveSeed(100, "deck")));
    assert.deepEqual(first, again);
    assert.notDeepEqual(first, other);
  });

  it("deals every slot kind of a mixed lineup in proportion", () => {
    const mixed: RuleSet = {
      ...rules,
      budget: 20,
      slots: [
        { id: "hero", count: 3, accepts: ["hero"] },
        { id: "villain", count: 2, accepts: ["villain"] },
      ],
    };
    const pool = [...makePool(12, "hero"), ...makePool(12, "villain")];
    const deck = buildDeck(mixed, pool, 2, createRng(5));
    const heroes = deck.filter((id) => id.startsWith("hero")).length;
    const villains = deck.filter((id) => id.startsWith("villain")).length;
    assert.equal(heroes, 9, "6 hero spots + 50% spare");
    assert.equal(villains, 6, "4 villain spots + 50% spare");
  });
});

describe("rng", () => {
  it("repeats exactly for the same seed and stays in range", () => {
    const a = createRng(123);
    const b = createRng(123);
    for (let index = 0; index < 1000; index += 1) {
      const value = a.next();
      assert.equal(value, b.next());
      assert.ok(value >= 0 && value < 1);
    }
    const dice = createRng(9);
    for (let index = 0; index < 1000; index += 1) {
      const roll = dice.int(1, 3);
      assert.ok(roll >= 1 && roll <= 3 && Number.isInteger(roll));
    }
  });

  it("shuffles without losing, duplicating or mutating items", () => {
    const items = Array.from({ length: 40 }, (_, index) => index);
    const shuffled = shuffle(items, createRng(4));
    assert.deepEqual(
      [...shuffled].sort((x, y) => x - y),
      items
    );
    assert.notDeepEqual(shuffled, items);
    assert.deepEqual(
      items,
      Array.from({ length: 40 }, (_, index) => index)
    );
  });
});

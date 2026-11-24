import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PACKS, toPublicCard } from "data";

/** Names of the rating sources; seeing one on a card would hint at the hidden number. */
const SOURCE_TERMS = /\b(OVR|Metacritic|Letterboxd|Spotify)\b/i;

const numbersIn = (text: string) =>
  (text.match(/\d[\d,.]*/g) ?? []).map((value) => value.replace(/[,.]+$/, "").replace(/,/g, ""));

/**
 * Checked by hand (docs/SPORTS-CATALOG.md): the source text holds the card's rating only inside a
 * career span or a team name. Exact card and text, so any other appearance of a rating still fails.
 */
const KNOWN_COINCIDENCES = new Map([
  ["soccer-attackers-alltime--marco-van-basten", "Ajax · AC Milan, 1981-95"],
  ["soccer-starting-xi-alltime--marco-van-basten", "Ajax · AC Milan, 1981-95"],
  ["soccer-defenders-alltime--franco-baresi", "AC Milan, 1977-97"],
  ["soccer-starting-xi-alltime--franco-baresi", "AC Milan, 1977-97"],
  ["nba-bigs-current--dean-wade", "Philadelphia 76ers · PF"],
]);

describe("card text shown during the auction", () => {
  it("never states the card's own hidden rating, its basis or a rating source", () => {
    const exempted = new Set<string>();
    for (const pack of PACKS) {
      for (const card of pack.cards) {
        const visible = toPublicCard(card);
        assert.ok(!("sourceIndex" in visible), `${card.id}: source order can hint at the rating`);
        for (const text of [visible.name, visible.subtitle, visible.note]) {
          if (numbersIn(text).includes(String(card.rating))) {
            assert.equal(
              KNOWN_COINCIDENCES.get(card.id),
              text,
              `${card.id}: "${text}" contains its rating ${card.rating}`
            );
            exempted.add(card.id);
          }
          assert.doesNotMatch(text, SOURCE_TERMS, `${card.id}: "${text}" names a rating source`);
          assert.ok(!text.includes(card.ratingBasis), `${card.id}: shows its basis`);
        }
      }
    }
    // Every pinned exception is still real, so the list cannot quietly outgrow the content.
    assert.deepEqual([...exempted].sort(), [...KNOWN_COINCIDENCES.keys()].sort());
  });
});

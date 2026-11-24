import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { i18n, type TranslationKey, type TranslationValues } from "i18n";

import { parseHistoryRecords } from "../history";
import { averageRatingOf, formatAverage } from "../results";
import { buildShareText } from "../shareText";

const translate = (key: TranslationKey, values?: TranslationValues) => i18n.t(key, values ?? {});

const pick = (cardId: string, rating: number, price = 2) => ({
  cardId,
  name: cardId,
  subtitle: "",
  price,
  rating,
  basis: "editorial",
});

/**
 * A result exactly as earlier versions saved it: totals and picks, no average and no positions.
 * Averages must come from the picks, so these records still show and share one.
 */
const SAVED_BEFORE_AVERAGES = [
  {
    id: "quick-1",
    finishedAt: Date.UTC(2026, 10, 24, 18),
    packId: "nfl-quarterbacks",
    packTitle: "Quarterbacks",
    packSubtitle: "NFL · Current players",
    topicId: "sports",
    mode: "quick",
    dailyKey: null,
    isTie: false,
    seats: [
      {
        name: "The Shark",
        kind: "bot",
        personality: "shark",
        totalRating: 439,
        rank: 1,
        isWinner: true,
        grade: "A",
        spent: 9,
        moneyLeft: 11,
        picks: [91, 90, 88, 86, 84].map((rating, index) => pick(`s${index}`, rating)),
      },
      {
        name: "You",
        kind: "human",
        personality: null,
        totalRating: 423,
        rank: 2,
        isWinner: false,
        grade: "B",
        spent: 8,
        moneyLeft: 12,
        picks: [89, 87, 85, 82, 80].map((rating, index) => pick(`y${index}`, rating)),
      },
    ],
    bestBuy: null,
    biggestOverpay: null,
  },
];

describe("roster averages", () => {
  it("come from the picks, to one decimal place", () => {
    assert.equal(averageRatingOf([{ rating: 89 }, { rating: 87 }, { rating: 85 }]), 87);
    assert.equal(formatAverage(averageRatingOf([{ rating: 89 }, { rating: 80 }])), "84.5");
    assert.equal(formatAverage(423 / 5), "84.6");
    assert.equal(formatAverage(86), "86.0");
    // Eleven picks over 1,000 points still average to a rating.
    const lineup = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89].map((rating) => ({ rating }));
    assert.equal(formatAverage(averageRatingOf(lineup)), "94.0");
    assert.equal(averageRatingOf([]), 0);
  });

  it("appear for results saved before averages were shown, and in the share text", () => {
    const [record] = parseHistoryRecords(JSON.parse(JSON.stringify(SAVED_BEFORE_AVERAGES)));
    assert.ok(record, "the old record still parses");
    const text = buildShareText(record, translate, (dateKey) => dateKey);
    const lines = text.split("\n");
    assert.equal(lines[0], "Auction · Quarterbacks (NFL · Current players)");
    assert.ok(lines.includes("The Shark: 439 pts · avg 87.8"), text);
    assert.ok(lines.includes("You: 423 pts · avg 84.6"), text);
    assert.ok(lines.includes("Winner: The Shark"), text);
    assert.equal(lines[lines.length - 1], "Play money only.");
    assert.doesNotMatch(text, /paddle/i);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getCatalogSummary,
  getPack,
  getPacksForTopic,
  isQuickPack,
  PACKS,
  RatingSource,
  rulesForPack,
  TopicId,
  toEngineCards,
  toPublicCard,
  TOPIC_ORDER,
} from "data";
import {
  BotPersonality,
  createDailyPlan,
  createDraft,
  DraftPhase,
  findDeckShortfall,
  planDeck,
  rosterSize,
  runDraft,
  SeatKind,
  validateRuleSet,
} from "engine";

import { SPORTS_PACKS } from "../sportsCatalog";

/** Image hosts linked by the source, each with the only path it may serve from. */
const KNOWN_IMAGE_SOURCES = new Map([
  ["a.espncdn.com", "/i/headshots/"],
  ["m.media-amazon.com", "/images/M/"],
  ["upload.wikimedia.org", "/wikipedia/"],
  ["r2.thesportsdb.com", "/images/media/player/"],
  ["www.thesportsdb.com", "/images/media/player/"],
  ["raw.githubusercontent.com", "/PokeAPI/sprites/"],
]);
/** Phase-1 packs: saved drafts, history and daily attempts may reference these exact versions. */
const ORIGINAL_PACKS = [
  ["nfl-quarterbacks", "2026-11-24.1"],
  ["scifi-80s", "2026-11-24.1"],
  ["looney-tunes", "2026-11-24.1"],
  ["pop-80s", "2026-11-24.1"],
  ["supercars-80s", "2026-11-24.1"],
];
const NOW = Date.UTC(2026, 10, 24, 12);

describe("catalog", () => {
  it("keeps the twenty first packs and appends the sports modes after them", () => {
    assert.equal(TOPIC_ORDER.length, 5);
    const firstTwenty = PACKS.slice(0, 20);
    assert.equal(
      firstTwenty.reduce((total, pack) => total + pack.cards.length, 0),
      664
    );
    for (const topic of TOPIC_ORDER) {
      const count = firstTwenty.filter((pack) => pack.topic === topic).length;
      assert.equal(count, 4, topic);
    }
    assert.deepEqual(
      PACKS.slice(20).map((pack) => pack.id),
      SPORTS_PACKS.map((pack) => pack.id)
    );
    assert.ok(SPORTS_PACKS.every((pack) => pack.topic === TopicId.Sports));
    assert.equal(getPacksForTopic(TopicId.Sports).length, 4 + SPORTS_PACKS.length);
    assert.deepEqual(getCatalogSummary(), {
      topics: 5,
      packs: PACKS.length,
      cards: PACKS.reduce((total, pack) => total + pack.cards.length, 0),
      snapshotDate: "2026-11-24",
    });
  });

  it("keeps the phase-1 packs first with their ids and versions", () => {
    assert.deepEqual(
      PACKS.slice(0, ORIGINAL_PACKS.length).map((pack) => [pack.id, pack.version]),
      ORIGINAL_PACKS
    );
  });

  it("has unique ids and enough unique cards for a four-seat table in every pack", () => {
    const allIds = PACKS.flatMap((pack) => pack.cards.map((card) => card.id));
    assert.equal(new Set(allIds).size, allIds.length);
    assert.equal(new Set(PACKS.map((pack) => pack.id)).size, PACKS.length);
    for (const pack of PACKS) {
      const rules = rulesForPack(pack);
      assert.ok(pack.cards.length >= 4 * rosterSize(rules), `${pack.id} cannot seat four players`);
      assert.deepEqual(validateRuleSet(rules), [], pack.id);
      assert.equal(getPack(pack.id), pack);
      // Every slot of a lineup needs enough cards of its own positions, not just enough cards.
      for (const seatCount of [2, 3, 4]) {
        const plan = planDeck(rules, toEngineCards(pack), seatCount);
        assert.equal(findDeckShortfall(plan), null, `${pack.id} at ${seatCount} seats`);
      }
    }
  });

  it("keeps exact published ratings and basis lines with provenance", () => {
    for (const pack of PACKS) {
      const { provenance } = pack;
      assert.match(provenance.snapshotDate, /^\d{4}-\d{2}-\d{2}$/);
      // Runtime provenance is neutral: the exact source mapping lives in docs and scripts only.
      assert.equal(provenance.publisher, "Licensed game catalog", pack.id);
      assert.equal(provenance.siteUrl, "", pack.id);
      assert.equal(provenance.dataUrl, "", pack.id);
      assert.ok(provenance.poolPath && provenance.siteMode && provenance.ratingMethod);
      assert.ok(provenance.selection.includes(`${pack.cards.length} of`));
      for (const card of pack.cards) {
        assert.ok(Number.isInteger(card.rating) && card.rating >= 40 && card.rating <= 99, card.id);
        assert.ok(card.name.trim() && card.note.trim() && card.ratingBasis.trim(), card.id);
        assert.ok(
          pack.slots.some((slot) => slot.accepts.includes(card.position)),
          card.id
        );
        // The site marks its own judgement calls: "editorial…" or a hand-set "set by hand…".
        const saysEditorial = /^(editorial|set by hand)/i.test(card.ratingBasis);
        assert.equal(card.ratingSource === RatingSource.Editorial, saysEditorial, card.id);
        if (card.image) {
          const url = new URL(card.image.uri);
          assert.equal(url.protocol, "https:", card.id);
          assert.equal(card.image.host, url.hostname, card.id);
          const path = KNOWN_IMAGE_SOURCES.get(url.hostname);
          assert.ok(path && url.pathname.startsWith(path), `${card.id}: ${card.image.uri}`);
        }
        assert.ok(card.sourceIndex >= 0 && card.sourceIndex < provenance.sourceEntryCount);
      }
    }
  });

  it("never exposes ratings or their basis before the verdict", () => {
    for (const pack of PACKS) {
      for (const card of pack.cards) {
        const visible = toPublicCard(card) as Record<string, unknown>;
        for (const hidden of ["rating", "ratingBasis", "ratingSource"]) {
          assert.ok(!(hidden in visible), `${card.id} leaks ${hidden}`);
        }
        assert.ok(
          !JSON.stringify(visible).includes(card.ratingBasis),
          `${card.id} leaks its basis`
        );
      }
    }
  });

  it("plays a full four-seat bot draft with every pack", () => {
    for (const pack of PACKS) {
      const result = createDraft({
        packId: pack.id,
        rules: rulesForPack(pack),
        seats: [
          BotPersonality.Accountant,
          BotPersonality.Shark,
          BotPersonality.Gambler,
          BotPersonality.Accountant,
        ].map((personality, index) => ({
          id: `bot-${index}`,
          name: `Bot ${index + 1}`,
          kind: SeatKind.Bot,
          personality,
        })),
        pool: toEngineCards(pack),
        seed: 11,
        now: NOW,
      });
      assert.ok(result.ok, result.ok ? "" : result.error.message);
      const end = runDraft(result.value, { now: NOW });
      assert.equal(end.phase, DraftPhase.Complete, pack.id);
      for (const seat of end.seats) {
        assert.equal(seat.roster.length, rosterSize(end.rules), pack.id);
        for (const slot of end.rules.slots) {
          const filled = seat.roster.filter((entry) => entry.slotId === slot.id).length;
          assert.equal(filled, slot.count, `${pack.id} ${slot.id}`);
        }
        assert.ok(seat.money >= 0, pack.id);
      }
    }
  });

  it("plans a daily draft for every topic from that topic's quick packs only", () => {
    for (const topic of TOPIC_ORDER) {
      const quick = getPacksForTopic(topic).filter(isQuickPack);
      assert.ok(quick.length > 0, topic);
      const packIds = quick.map((pack) => pack.id);
      for (const dateKey of ["2026-11-24", "2026-11-25", "2026-12-31"]) {
        const plan = createDailyPlan(dateKey, topic, packIds);
        assert.ok(plan && packIds.includes(plan.packId), topic);
        const pack = getPack(plan.packId);
        assert.ok(pack && pack.budget === 20 && rosterSize(rulesForPack(pack)) === 5, plan.packId);
      }
    }
    // Lineups never become a daily: the Starting XI and full lineups are quick-play only.
    for (const lineupId of ["soccer-starting-xi-current", "nfl-full-lineup-current"]) {
      const lineup = getPack(lineupId);
      assert.ok(lineup && !isQuickPack(lineup), lineupId);
    }
  });
});

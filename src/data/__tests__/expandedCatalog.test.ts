import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  PACKS,
  RatingSource,
  rulesForPack,
  toEngineCards,
  toPublicCard,
  TOPIC_ORDER,
  TopicId,
  type ContentPack,
} from "data";
import {
  BotPersonality,
  checkDraftInvariants,
  computeVerdict,
  createDraft,
  DraftPhase,
  findDeckShortfall,
  getTurnOptions,
  LotOutcomeKind,
  openSpots,
  planDeck,
  runDraft,
  SeatKind,
  validateRuleSet,
  type DraftState,
  type SeatConfig,
  type SeatPolicy,
} from "engine";
import { buildTableView } from "game";

import { EXPANDED_PACKS } from "../expandedCatalog";

const NOW = Date.UTC(2026, 10, 24, 12);
const SEEDS = [1, 7, 42, 2_026, 65_537, 4_000_000_000];
const PERSONALITIES = [BotPersonality.Accountant, BotPersonality.Shark, BotPersonality.Gambler];
const ORIGINAL_PACK_IDS = [
  "nfl-quarterbacks",
  "scifi-80s",
  "looney-tunes",
  "pop-80s",
  "supercars-80s",
];
const IMAGE_HOSTS = new Set([
  "a.espncdn.com",
  "r2.thesportsdb.com",
  "m.media-amazon.com",
  "upload.wikimedia.org",
  "raw.githubusercontent.com",
]);
const HIDDEN_KEYS = /"(rating|ratingBasis|ratingSource)"\s*:/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The fifteen pools from docs/CATALOG-EXPANSION.md; `top` marks the curated top-N packs. */
const BRIEF: readonly {
  id: string;
  topic: TopicId;
  poolPath: string;
  poolSize: number;
  top?: number;
}[] = [
  {
    id: "nba-point-guards",
    topic: TopicId.Sports,
    poolPath: "nba.pg.current",
    poolSize: 76,
    top: 32,
  },
  {
    id: "soccer-strikers",
    topic: TopicId.Sports,
    poolPath: "soccer.st.current",
    poolSize: 43,
    top: 30,
  },
  { id: "f1-drivers", topic: TopicId.Sports, poolPath: "f1.drv.current", poolSize: 22 },
  { id: "action-all-time", topic: TopicId.Movies, poolPath: "action.best.all", poolSize: 40 },
  { id: "comedy-all-time", topic: TopicId.Movies, poolPath: "comedy.best.all", poolSize: 40 },
  { id: "horror-all-time", topic: TopicId.Movies, poolPath: "horror.best.all", poolSize: 40 },
  { id: "dragon-ball", topic: TopicId.Characters, poolPath: "anime.dbz.all", poolSize: 35 },
  { id: "naruto", topic: TopicId.Characters, poolPath: "anime.naruto.all", poolSize: 33 },
  {
    id: "nintendo",
    topic: TopicId.Characters,
    poolPath: "games.nintendo.all",
    poolSize: 63,
    top: 40,
  },
  { id: "pop-20s", topic: TopicId.Songs, poolPath: "pop.20s.all", poolSize: 30 },
  { id: "rock-all-time", topic: TopicId.Songs, poolPath: "rock.best.all", poolSize: 40 },
  { id: "hip-hop-10s", topic: TopicId.Songs, poolPath: "hiphop.10s.all", poolSize: 30 },
  { id: "hypercars-all-time", topic: TopicId.Cars, poolPath: "hyper.best.all", poolSize: 40 },
  { id: "sports-cars-20s", topic: TopicId.Cars, poolPath: "sportscar.20s.all", poolSize: 24 },
  { id: "off-roaders-all-time", topic: TopicId.Cars, poolPath: "offroad.best.all", poolSize: 40 },
];

const seatsFor = (count: number, variant: number): SeatConfig[] =>
  Array.from({ length: count }, (_, index) => {
    const pick = (index + variant) % 4;
    return pick === 3
      ? { id: `seat-${index}`, name: `Person ${index + 1}`, kind: SeatKind.Human }
      : {
          id: `seat-${index}`,
          name: `Bot ${index + 1}`,
          kind: SeatKind.Bot,
          personality: PERSONALITIES[pick],
        };
  });

const startDraft = (pack: ContentPack, seats: SeatConfig[], seed: number): DraftState => {
  const created = createDraft({
    packId: pack.id,
    rules: rulesForPack(pack),
    seats,
    pool: toEngineCards(pack),
    seed,
    now: NOW,
  });
  assert.ok(created.ok, created.ok ? "" : `${pack.id}: ${created.error.message}`);
  return created.value;
};

/**
 * Spends every skip it can: the most cards a table can throw away unsold. With two skips per seat
 * that is two cards, so only a pack with two or fewer spare cards reaches the last-cards lock.
 */
const skipWheneverAllowed: SeatPolicy = (state) => {
  const options = getTurnOptions(state);
  if (!options) return null;
  return options.canPass
    ? { type: "pass", seat: options.seat }
    : { type: "bid", seat: options.seat, amount: options.bids[0] };
};

/**
 * Plays to the end, checking every rule invariant and the $1-per-open-spot reserve after each
 * action. Human seats make uniformly random legal moves unless a policy is given.
 */
const playChecked = (
  pack: ContentPack,
  seats: SeatConfig[],
  seed: number,
  humanPolicy?: SeatPolicy,
  onStep?: (state: DraftState) => void
): DraftState =>
  runDraft(startDraft(pack, seats, seed), {
    now: NOW,
    humanPolicy,
    onStep: (state) => {
      onStep?.(state);
      assert.deepEqual(checkDraftInvariants(state), [], `${pack.id} seed ${seed}`);
      for (const seat of state.seats) {
        assert.ok(
          seat.money >= openSpots(seat, state.rules),
          `${pack.id} seed ${seed}: ${seat.id} gave up the $1 reserve per open spot`
        );
      }
    },
  });

const ratingsById = (pack: ContentPack) =>
  new Map(pack.cards.map((card) => [card.id, card.rating]));

describe("expanded catalog", () => {
  it("adds exactly the fifteen briefed pools, three per topic, next to the original five", () => {
    assert.deepEqual(
      EXPANDED_PACKS.map((pack) => [
        pack.id,
        pack.topic,
        pack.provenance.poolPath,
        pack.cards.length,
        pack.provenance.sourceEntryCount,
      ]),
      BRIEF.map((entry) => [
        entry.id,
        entry.topic,
        entry.poolPath,
        entry.top ?? entry.poolSize,
        entry.poolSize,
      ])
    );
    for (const topic of TOPIC_ORDER) {
      assert.equal(EXPANDED_PACKS.filter((pack) => pack.topic === topic).length, 3, topic);
    }
    for (const id of ORIGINAL_PACK_IDS) {
      assert.ok(
        PACKS.some((pack) => pack.id === id),
        `${id} must stay resolvable for saved drafts`
      );
    }
  });

  it("keeps pack and card ids unique across the live catalog and the expansion", () => {
    // Works before and after integration: packs registered in PACKS are counted once.
    const library = [...PACKS, ...EXPANDED_PACKS.filter((pack) => !PACKS.includes(pack))];
    const packIds = library.map((pack) => pack.id);
    assert.equal(new Set(packIds).size, packIds.length);
    const cardIds = library.flatMap((pack) => pack.cards.map((card) => card.id));
    assert.equal(new Set(cardIds).size, cardIds.length);
    for (const pack of EXPANDED_PACKS) {
      assert.match(pack.id, SLUG);
      for (const card of pack.cards) {
        assert.ok(card.id.startsWith(`${pack.id}--`), card.id);
        assert.match(card.id.slice(pack.id.length + 2), SLUG, card.id);
      }
    }
  });

  it("uses the $20 five-pick single-position format with enough cards for two to four seats", () => {
    for (const pack of EXPANDED_PACKS) {
      const rules = rulesForPack(pack);
      const [slot] = pack.slots;
      assert.equal(pack.budget, 20, pack.id);
      assert.equal(pack.slots.length, 1, pack.id);
      assert.equal(slot.count, 5, pack.id);
      assert.deepEqual(slot.accepts, [slot.id], pack.id);
      assert.ok(
        pack.cards.every((card) => card.position === slot.id),
        pack.id
      );
      assert.deepEqual(validateRuleSet(rules), [], pack.id);
      assert.match(pack.version, /^\d{4}-\d{2}-\d{2}\.\d+$/);
      for (const seatCount of [2, 3, 4]) {
        const plan = planDeck(rules, toEngineCards(pack), seatCount);
        assert.equal(findDeckShortfall(plan), null, `${pack.id} at ${seatCount} seats`);
      }
    }
  });

  it("records provenance, source order and the published fields of every card", () => {
    for (const pack of EXPANDED_PACKS) {
      const { provenance } = pack;
      const brief = BRIEF.find((entry) => entry.id === pack.id);
      assert.equal(provenance.publisher, "Licensed game catalog");
      assert.equal(provenance.siteUrl, "");
      assert.equal(provenance.dataUrl, "");
      assert.match(provenance.snapshotDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(provenance.siteMode && provenance.ratingMethod && provenance.permission, pack.id);
      assert.ok(pack.title && pack.subtitle && pack.noun && pack.ratingLabel, pack.id);
      assert.ok(
        provenance.selection.endsWith(
          `${pack.cards.length} of ${provenance.sourceEntryCount} entries.`
        ),
        pack.id
      );
      assert.ok(
        provenance.selection.startsWith(
          brief?.top ? `Curated subset: the ${brief.top} highest` : "The complete pool"
        ),
        pack.id
      );

      const indexes = pack.cards.map((card) => card.sourceIndex);
      assert.ok(
        indexes.every((index, order) => order === 0 || index > indexes[order - 1]),
        `${pack.id} cards must stay in source order`
      );
      assert.ok(indexes.every((index) => index >= 0 && index < provenance.sourceEntryCount));
      if (!brief?.top) {
        assert.deepEqual(indexes, [...indexes.keys()], `${pack.id} must keep the whole pool`);
      }

      for (const card of pack.cards) {
        assert.ok(Number.isInteger(card.rating) && card.rating >= 40 && card.rating <= 99, card.id);
        assert.ok(card.name.trim() && card.note.trim() && card.ratingBasis.trim(), card.id);
        const saysEditorial = /^(editorial|set by hand)/i.test(card.ratingBasis);
        assert.equal(card.ratingSource === RatingSource.Editorial, saysEditorial, card.id);
        assert.ok(card.accentColor === null || /^#[0-9A-F]{6}$/.test(card.accentColor), card.id);
        if (card.image) {
          const url = new URL(card.image.uri);
          assert.equal(url.protocol, "https:", card.id);
          assert.equal(card.image.host, url.hostname, card.id);
          assert.ok(IMAGE_HOSTS.has(card.image.host), `${card.id}: ${card.image.host}`);
          assert.ok(card.image.credit.trim(), card.id);
        }
        const isCharacterPack = pack.topic === TopicId.Characters;
        assert.equal(card.side !== null, isCharacterPack, `${card.id} side ${card.side}`);
      }
    }
  });

  it("never shows a rating, a basis or a rating source before the verdict", () => {
    for (const pack of EXPANDED_PACKS) {
      const bases = pack.cards.map((card) => card.ratingBasis);
      for (const card of pack.cards) {
        const visible = toPublicCard(card);
        const text = JSON.stringify(visible);
        assert.doesNotMatch(text, HIDDEN_KEYS, card.id);
        assert.ok(!text.includes(card.ratingBasis), `${card.id} leaks its basis`);
        // Name, subtitle and note are shown on the block: none may state the card's own rating.
        for (const field of [visible.name, visible.subtitle, visible.note]) {
          const numbers = (field.match(/\d[\d,.]*/g) ?? []).map((token) =>
            token.replace(/,/g, "").replace(/\.$/, "")
          );
          assert.ok(!numbers.includes(String(card.rating)), `${card.id} states its rating`);
        }
      }

      // The table view the auction screen renders, at every step of a three-seat draft.
      let steps = 0;
      runDraft(startDraft(pack, seatsFor(3, 1), 3), {
        now: NOW,
        onStep: (state) => {
          const text = JSON.stringify(buildTableView(state, pack));
          assert.doesNotMatch(text, HIDDEN_KEYS, `${pack.id}: hidden field in table view`);
          for (const basis of bases) assert.ok(!text.includes(basis), `${pack.id}: ${basis}`);
          steps += 1;
        },
      });
      assert.ok(steps > 10, pack.id);
    }
  });

  it("completes 2-, 3- and 4-seat drafts for every pack and seed with full rosters", () => {
    for (const pack of EXPANDED_PACKS) {
      const cardIds = new Set(pack.cards.map((card) => card.id));
      const ratings = ratingsById(pack);
      for (const seatCount of [2, 3, 4]) {
        const decks = new Set<string>();
        SEEDS.forEach((seed, variant) => {
          // Random human moves exercise skips, discards and forced fills.
          const label = `${pack.id} ${seatCount} seats seed ${seed}`;
          const end = playChecked(pack, seatsFor(seatCount, variant), seed);
          decks.add(end.deck.join(","));
          assert.equal(end.phase, DraftPhase.Complete, label);

          const awarded = end.seats.flatMap((seat) => seat.roster.map((entry) => entry.cardId));
          assert.equal(awarded.length, seatCount * 5, label);
          assert.equal(new Set(awarded).size, awarded.length, `${label}: card awarded twice`);
          assert.ok(
            awarded.every((cardId) => cardIds.has(cardId)),
            label
          );
          const sales = end.history.filter(
            (record) =>
              record.kind === LotOutcomeKind.Sold || record.kind === LotOutcomeKind.ForcedFill
          );
          assert.equal(sales.length, awarded.length, label);

          const verdict = computeVerdict(end);
          assert.ok(verdict.winners.length >= 1, label);
          end.seats.forEach((seat, index) => {
            const spent = seat.roster.reduce((total, entry) => total + entry.price, 0);
            assert.equal(seat.roster.length, 5, label);
            assert.equal(seat.money + spent, pack.budget, label);
            assert.ok(seat.money >= 0, label);
            const total = seat.roster.reduce(
              (sum, entry) => sum + (ratings.get(entry.cardId) ?? Number.NaN),
              0
            );
            assert.equal(verdict.results[index].totalRating, total, label);
          });
        });
        assert.ok(
          decks.size > 1,
          `${pack.id} ${seatCount} seats: seeds should deal different decks`
        );
      }
    }
  });

  it("replays the same seed and seats to the identical draft and verdict", () => {
    for (const pack of EXPANDED_PACKS) {
      for (const seatCount of [2, 3, 4]) {
        const seed = SEEDS[seatCount];
        const first = playChecked(pack, seatsFor(seatCount, seatCount), seed);
        const again = playChecked(pack, seatsFor(seatCount, seatCount), seed);
        assert.deepEqual(again, first, `${pack.id} ${seatCount} seats`);
        assert.deepEqual(computeVerdict(again), computeVerdict(first), pack.id);
      }
    }
  });

  it("fills every roster when all seats skip whenever they may, locking the last cards", () => {
    let lockedTables = 0;
    for (const pack of EXPANDED_PACKS) {
      const rules = rulesForPack(pack);
      for (const seatCount of [2, 3, 4]) {
        const label = `${pack.id} ${seatCount} seats`;
        const [{ dealt, required }] = planDeck(rules, toEngineCards(pack), seatCount);
        const spare = dealt - required;
        const seats = Array.from({ length: seatCount }, (_, index) => ({
          id: `seat-${index}`,
          name: `Person ${index + 1}`,
          kind: SeatKind.Human,
        }));
        let sawLock = false;
        const end = playChecked(pack, seats, 5, skipWheneverAllowed, (state) => {
          if (state.phase === DraftPhase.Bidding && state.lot?.skipLocked) sawLock = true;
        });

        assert.equal(end.phase, DraftPhase.Complete, label);
        assert.ok(
          end.seats.every((seat) => seat.roster.length === 5),
          label
        );
        const discarded = end.history.filter((record) => record.kind === LotOutcomeKind.Discarded);
        assert.equal(discarded.length, Math.min(rules.skipsPerSeat, spare), label);
        // The pass lock is what keeps a thin deck fillable; it must engage exactly when needed.
        assert.equal(sawLock, spare <= rules.skipsPerSeat, label);
        if (sawLock) lockedTables += 1;
      }
    }
    // Formula 1 (22 drivers) at a full table: 20 spots, 2 spare cards.
    assert.equal(lockedTables, 1);
  });
});

// Field-by-field comparison with the saved public data file. The snapshot is git-ignored scratch,
// so this suite only runs where it exists (it does on the machine that generated the packs).
const snapshotDate = EXPANDED_PACKS[0].provenance.snapshotDate;
const SNAPSHOT_PATH = join(process.cwd(), ".work", `source-snapshot-${snapshotDate}`, "players.js");
const hasSnapshot = existsSync(SNAPSHOT_PATH);

describe("expanded catalog against the source snapshot", () => {
  it(
    "matches every card to its source entry and re-derives each selection",
    { skip: hasSnapshot ? false : `snapshot not found at ${SNAPSHOT_PATH}` },
    () => {
      // Parsed as JSON data, never executed.
      const raw = readFileSync(SNAPSHOT_PATH, "utf8");
      const pools = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      let compared = 0;

      for (const pack of EXPANDED_PACKS) {
        const { poolPath, sourceEntryCount } = pack.provenance;
        const pool: unknown[][] = poolPath
          .split(".")
          .reduce((node: any, key: string) => node?.[key], pools);
        assert.ok(Array.isArray(pool), poolPath);
        assert.equal(pool.length, sourceEntryCount, poolPath);

        // Complete pools keep every entry; top-N packs keep the N highest ratings, and a tie at
        // the cutoff goes to the earlier entry in source order.
        const top = BRIEF.find((entry) => entry.id === pack.id)?.top;
        const indexed = pool.map((entry, sourceIndex) => ({
          rating: entry[2] as number,
          sourceIndex,
        }));
        const chosen = top
          ? [...indexed]
              .sort((a, b) => b.rating - a.rating || a.sourceIndex - b.sourceIndex)
              .slice(0, top)
          : indexed;
        assert.deepEqual(
          pack.cards.map((card) => card.sourceIndex),
          chosen.map(({ sourceIndex }) => sourceIndex).sort((a, b) => a - b),
          `${pack.id} selection`
        );

        for (const card of pack.cards) {
          const [name, subtitle, rating, note, basis, image, colour, , side] = pool[
            card.sourceIndex
          ] as (string | number | undefined)[];
          assert.deepEqual(
            {
              name: card.name,
              subtitle: card.subtitle,
              rating: card.rating,
              note: card.note,
              ratingBasis: card.ratingBasis,
              imageUri: card.image?.uri ?? "",
              accentColor: card.accentColor,
              side: card.side,
            },
            {
              name,
              subtitle,
              rating,
              note,
              ratingBasis: basis,
              imageUri: image,
              accentColor: /^#[0-9a-f]{6}$/i.test(String(colour))
                ? String(colour).toUpperCase()
                : null,
              side: side === "HERO" ? "hero" : side === "VILLAIN" ? "villain" : null,
            },
            `${card.id} differs from ${poolPath}[${card.sourceIndex}]`
          );
          compared += 1;
        }
      }
      assert.equal(
        compared,
        EXPANDED_PACKS.reduce((total, pack) => total + pack.cards.length, 0)
      );
    }
  );
});

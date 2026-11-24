import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  getPack,
  PACKS,
  RatingSource,
  rulesForPack,
  toEngineCards,
  toPublicCard,
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
  MAX_SEATS,
  openSpots,
  parseDraftState,
  planDeck,
  runDraft,
  SeatKind,
  validateRuleSet,
  type DraftState,
  type SeatConfig,
  type SeatPolicy,
} from "engine";

import { SPORTS_PACKS } from "../sportsCatalog";

const NOW = Date.UTC(2026, 10, 24, 12);
const SEEDS = [1, 7, 42, 2_026, 65_537, 4_000_000_000];
const SEAT_COUNTS = [2, 3, 4];
const PERSONALITIES = [BotPersonality.Accountant, BotPersonality.Shark, BotPersonality.Gambler];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HIDDEN_KEYS = ["rating", "ratingBasis", "ratingSource", "sourceIndex"];
/** Names of rating sources; seeing one on a card would hint at the hidden number. */
const SOURCE_TERMS = /\b(OVR|Metacritic|Letterboxd|Spotify)\b/i;
/** Runtime content names no website, and no "$N Draft"-style product name. */
const WEB_ADDRESS = /https?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:com|net|org|io|co|app|dev)\b/i;
const PRODUCT_NAME = /\$\s*\d+\s+draft\b|\bdollar\s*draft/i;
/** Image hosts the source links, each only under the path it serves player images from. */
const IMAGE_SOURCES = new Map([
  ["a.espncdn.com", "/i/headshots/"],
  ["r2.thesportsdb.com", "/images/media/player/"],
  ["www.thesportsdb.com", "/images/media/player/"],
]);

/** Published pool sizes in the saved 2026-11-24 data snapshot. */
const POOL_SIZES: Record<string, number> = {
  "soccer.st.current": 43,
  "soccer.w.current": 46,
  "soccer.mid.current": 60,
  "soccer.cb.current": 43,
  "soccer.fb.current": 35,
  "soccer.gk.current": 24,
  "soccer.st.alltime": 24,
  "soccer.w.alltime": 17,
  "soccer.mid.alltime": 29,
  "soccer.cb.alltime": 22,
  "soccer.fb.alltime": 16,
  "soccer.gk.alltime": 16,
  "nfl.qb.current": 63,
  "nfl.rb.current": 63,
  "nfl.wr.current": 80,
  "nfl.te.current": 39,
  "nfl.def.current": 84,
  "nba.pg.current": 76,
  "nba.sg.current": 75,
  "nba.sf.current": 76,
  "nba.pf.current": 68,
  "nba.c.current": 72,
  "f1.drv.current": 22,
  "f1.con.current": 11,
};

interface SlotBrief {
  id: string;
  count: number;
  /** [card position, source pool path] in card order. */
  pools: readonly (readonly [string, string])[];
}

interface PackBrief {
  id: string;
  budget: number;
  slots: readonly SlotBrief[];
}

/** Five picks for $20, one slot accepting every listed position. */
const single = (id: string, slotId: string, pools: SlotBrief["pools"]): PackBrief => ({
  id,
  budget: 20,
  slots: [{ id: slotId, count: 5, pools }],
});

/** One slot per position, each fed by its own pool. */
const lineup = (
  id: string,
  budget: number,
  formation: readonly (readonly [string, number, string])[]
): PackBrief => ({
  id,
  budget,
  slots: formation.map(([position, count, poolPath]) => ({
    id: position,
    count,
    pools: [[position, poolPath]],
  })),
});

/** The source's Starting XI: "$40 · GK, 2 CB, 2 FB, 3 MID, 2 W, ST". */
const XI_FORMATION = [
  ["gk", 1],
  ["cb", 2],
  ["fb", 2],
  ["mid", 3],
  ["w", 2],
  ["st", 1],
] as const;

const startingXi = (era: string) =>
  lineup(
    `soccer-starting-xi-${era}`,
    40,
    XI_FORMATION.map(([position, count]) => [position, count, `soccer.${position}.${era}`])
  );

const BRIEF: readonly PackBrief[] = [
  ...["current", "alltime"].map((era) =>
    single(`soccer-attackers-${era}`, "attacker", [
      ["st", `soccer.st.${era}`],
      ["w", `soccer.w.${era}`],
    ])
  ),
  ...["current", "alltime"].map((era) =>
    single(`soccer-midfielders-${era}`, "mid", [["mid", `soccer.mid.${era}`]])
  ),
  ...["current", "alltime"].map((era) =>
    single(`soccer-defenders-${era}`, "defender", [
      ["cb", `soccer.cb.${era}`],
      ["fb", `soccer.fb.${era}`],
      ["gk", `soccer.gk.${era}`],
    ])
  ),
  startingXi("current"),
  startingXi("alltime"),
  single("nfl-running-backs-current", "rb", [["rb", "nfl.rb.current"]]),
  single("nfl-receivers-current", "receiver", [
    ["wr", "nfl.wr.current"],
    ["te", "nfl.te.current"],
  ]),
  single("nfl-defense-current", "def", [["def", "nfl.def.current"]]),
  // The source's full lineup: "$30 · QB, 2 RB, 2 WR, TE, DEF".
  lineup("nfl-full-lineup-current", 30, [
    ["qb", 1, "nfl.qb.current"],
    ["rb", 2, "nfl.rb.current"],
    ["wr", 2, "nfl.wr.current"],
    ["te", 1, "nfl.te.current"],
    ["def", 1, "nfl.def.current"],
  ]),
  single("nba-guards-wings-current", "guard-wing", [
    ["pg", "nba.pg.current"],
    ["sg", "nba.sg.current"],
    ["sf", "nba.sf.current"],
  ]),
  single("nba-bigs-current", "big", [
    ["pf", "nba.pf.current"],
    ["c", "nba.c.current"],
  ]),
  // The source's fantasy team: "$30 · 5 drivers + 2 constructors".
  lineup("f1-fantasy-team-current", 30, [
    ["driver", 5, "f1.drv.current"],
    ["constructor", 2, "f1.con.current"],
  ]),
];

/**
 * Subtitles whose career span or team name happens to contain the card's rating (a career ending
 * in '95 on a 95, the 76ers on a 76). They are source text and state no rating.
 */
const RATING_COINCIDENCES = [
  "nba-bigs-current--dean-wade",
  "soccer-attackers-alltime--marco-van-basten",
  "soccer-defenders-alltime--franco-baresi",
  "soccer-starting-xi-alltime--franco-baresi",
  "soccer-starting-xi-alltime--marco-van-basten",
];

const briefFor = (pack: ContentPack): PackBrief => {
  const brief = BRIEF.find((entry) => entry.id === pack.id);
  assert.ok(brief, `${pack.id} is not briefed`);
  return brief;
};
const poolsOf = (brief: PackBrief) => brief.slots.flatMap((slot) => slot.pools);
const isLineup = (pack: ContentPack) => pack.slots.length > 1;
const picksOf = (pack: ContentPack) => pack.slots.reduce((total, slot) => total + slot.count, 0);
/** Every pack in the app once registered, counted once whether or not it is registered yet. */
const library = (): ContentPack[] => [
  ...PACKS,
  ...SPORTS_PACKS.filter((pack) => !PACKS.includes(pack)),
];

const numbersIn = (text: string) =>
  (text.match(/\d[\d,.]*/g) ?? []).map((value) => value.replace(/[,.]+$/, "").replace(/,/g, ""));

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

const botsOnly = (count: number): SeatConfig[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `seat-${index}`,
    name: `Bot ${index + 1}`,
    kind: SeatKind.Bot,
    personality: PERSONALITIES[index % PERSONALITIES.length],
  }));

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

/** Spends every skip it can: the most cards a table can throw away unsold. */
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

/** Every seat holds exactly each slot's count, and every pick fits the slot it fills. */
const assertFullLineups = (pack: ContentPack, end: DraftState, label: string) => {
  const positions = new Map(pack.cards.map((card) => [card.id, card.position]));
  for (const seat of end.seats) {
    for (const slot of pack.slots) {
      const filled = seat.roster.filter((entry) => entry.slotId === slot.id);
      assert.equal(filled.length, slot.count, `${label}: ${seat.id} slot ${slot.id}`);
      for (const entry of filled) {
        const position = positions.get(entry.cardId) ?? "";
        assert.ok(slot.accepts.includes(position), `${label}: ${entry.cardId} in ${slot.id}`);
      }
    }
    assert.equal(seat.roster.length, picksOf(pack), label);
  }
};

describe("sports catalog", () => {
  it("ships the fifteen briefed modes with their budgets, slots and complete pools", () => {
    assert.deepEqual(
      SPORTS_PACKS.map((pack) => pack.id),
      BRIEF.map((brief) => brief.id)
    );
    for (const pack of SPORTS_PACKS) {
      const brief = briefFor(pack);
      const [, sport, era] =
        pack.id.match(/^(soccer|nfl|nba|f1)-[a-z0-9-]+-(current|alltime)$/) ?? [];
      assert.ok(sport && era, `${pack.id} must read <sport>-<mode>-<era>`);
      assert.equal(pack.topic, TopicId.Sports, pack.id);
      assert.equal(pack.budget, brief.budget, pack.id);
      assert.deepEqual(
        pack.slots.map((slot) => ({ ...slot, accepts: [...slot.accepts] })),
        brief.slots.map((slot) => ({
          id: slot.id,
          count: slot.count,
          accepts: slot.pools.map(([position]) => position),
        })),
        pack.id
      );
      assert.equal(pack.subtitle.endsWith(" · All-time greats"), era === "alltime", pack.id);
      assert.match(pack.version, /^\d{4}-\d{2}-\d{2}\.\d+$/);
      assert.ok(pack.title.trim() && pack.noun.trim() && pack.ratingLabel.trim(), pack.id);

      // Complete pools: every entry of every pool the mode draws from, and nothing else.
      const pools = poolsOf(brief);
      for (const [position, poolPath] of pools) {
        assert.ok(poolPath.startsWith(`${sport}.`) && poolPath.endsWith(`.${era}`), poolPath);
        assert.equal(
          pack.cards.filter((card) => card.position === position).length,
          POOL_SIZES[poolPath],
          `${pack.id} ${position}`
        );
      }
      const total = pools.reduce((sum, [, poolPath]) => sum + POOL_SIZES[poolPath], 0);
      assert.equal(pack.provenance.poolPath, pools.map(([, poolPath]) => poolPath).join(" + "));
      assert.equal(pack.provenance.sourceEntryCount, total, pack.id);
      assert.equal(pack.cards.length, total, pack.id);
    }
  });

  it("fields the source's lineups exactly: XI $40 for 11, NFL and F1 $30 for 7", () => {
    const quotas = (id: string) => {
      const pack = SPORTS_PACKS.find((entry) => entry.id === id);
      assert.ok(pack, id);
      return [pack.budget, picksOf(pack), pack.slots.map((slot) => [slot.id, slot.count])];
    };
    const xi = [40, 11, XI_FORMATION.map(([position, count]) => [position, count])];
    assert.deepEqual(quotas("soccer-starting-xi-current"), xi);
    assert.deepEqual(quotas("soccer-starting-xi-alltime"), xi);
    assert.deepEqual(quotas("nfl-full-lineup-current"), [
      30,
      7,
      [
        ["qb", 1],
        ["rb", 2],
        ["wr", 2],
        ["te", 1],
        ["def", 1],
      ],
    ]);
    assert.deepEqual(quotas("f1-fantasy-team-current"), [
      30,
      7,
      [
        ["driver", 5],
        ["constructor", 2],
      ],
    ]);
    for (const pack of SPORTS_PACKS.filter((entry) => !isLineup(entry))) {
      assert.deepEqual([pack.budget, picksOf(pack)], [20, 5], pack.id);
    }
  });

  it("keeps pack and card ids unique across the library, with each player once per pack", () => {
    const packs = library();
    const packIds = packs.map((pack) => pack.id);
    assert.equal(new Set(packIds).size, packIds.length);
    const cardIds = packs.flatMap((pack) => pack.cards.map((card) => card.id));
    assert.equal(new Set(cardIds).size, cardIds.length);
    for (const pack of SPORTS_PACKS) {
      assert.match(pack.id, SLUG);
      const names = pack.cards.map((card) => card.name);
      assert.equal(new Set(names).size, names.length, `${pack.id} lists a player twice`);
      for (const card of pack.cards) {
        assert.ok(card.id.startsWith(`${pack.id}--`), card.id);
        assert.match(card.id.slice(pack.id.length + 2), SLUG, card.id);
      }
    }
  });

  it("plays by the engine's rules: disjoint slots and enough cards for four seats in each", () => {
    for (const pack of SPORTS_PACKS) {
      const rules = rulesForPack(pack);
      assert.deepEqual(validateRuleSet(rules), [], pack.id);
      for (const card of pack.cards) {
        const slots = pack.slots.filter((slot) => slot.accepts.includes(card.position));
        assert.equal(slots.length, 1, `${card.id} must fit exactly one slot`);
      }
      for (const slot of pack.slots) {
        for (const position of slot.accepts) {
          assert.ok(
            pack.cards.some((card) => card.position === position),
            `${pack.id}: no ${position} cards`
          );
        }
        const supply = pack.cards.filter((card) => slot.accepts.includes(card.position)).length;
        assert.ok(supply >= slot.count * MAX_SEATS, `${pack.id} ${slot.id}: ${supply} cards`);
      }
      for (const seatCount of SEAT_COUNTS) {
        const plan = planDeck(rules, toEngineCards(pack), seatCount);
        assert.equal(findDeckShortfall(plan), null, `${pack.id} at ${seatCount} seats`);
      }
    }

    // A slot id means the same positions everywhere, so screens can label slots by id.
    const acceptsBySlot = new Map<string, string>();
    for (const pack of library()) {
      for (const slot of pack.slots) {
        const accepts = [...slot.accepts].sort().join(",");
        const seen = acceptsBySlot.get(slot.id) ?? accepts;
        assert.equal(accepts, seen, `${pack.id}: slot ${slot.id} accepts ${accepts}, not ${seen}`);
        acceptsBySlot.set(slot.id, accepts);
      }
    }
  });

  it("copies valid card fields under neutral provenance", () => {
    for (const pack of SPORTS_PACKS) {
      const { provenance } = pack;
      assert.equal(provenance.publisher, "Licensed game catalog", pack.id);
      assert.equal(provenance.siteUrl, "", pack.id);
      assert.equal(provenance.dataUrl, "", pack.id);
      assert.equal(provenance.snapshotDate, "2026-11-24", pack.id);
      assert.ok(provenance.siteMode && provenance.ratingMethod && provenance.permission, pack.id);
      const total = pack.cards.length;
      assert.ok(provenance.selection.startsWith("The complete pool"), pack.id);
      assert.ok(provenance.selection.endsWith(` ${total} of ${total} entries.`), pack.id);

      pack.cards.forEach((card, order) => {
        assert.equal(card.sourceIndex, order, `${card.id} must keep its source order`);
        assert.ok(Number.isInteger(card.rating) && card.rating >= 40 && card.rating <= 99, card.id);
        assert.ok(card.name.trim() && card.note.trim() && card.ratingBasis.trim(), card.id);
        const saysEditorial = /^(editorial|set by hand)/i.test(card.ratingBasis);
        assert.equal(card.ratingSource === RatingSource.Editorial, saysEditorial, card.id);
        // Game overalls are the rating itself; anything else says it is a hand-made call.
        const overall = card.ratingBasis.match(/^(?:Madden 27|2K27): (\d+) OVR/);
        if (overall) assert.equal(Number(overall[1]), card.rating, card.id);
        assert.ok(card.accentColor === null || /^#[0-9A-F]{6}$/.test(card.accentColor), card.id);
        assert.equal(card.side, null, card.id);
        if (card.image) {
          const url = new URL(card.image.uri);
          const path = IMAGE_SOURCES.get(url.hostname);
          assert.equal(url.protocol, "https:", card.id);
          assert.equal(card.image.host, url.hostname, card.id);
          assert.ok(path && url.pathname.startsWith(path), `${card.id}: ${card.image.uri}`);
          assert.ok(card.image.credit.trim(), card.id);
        }
      });

      // Nothing shipped names the source or links anywhere except the card images.
      const packTexts = [
        pack.title,
        pack.subtitle,
        pack.noun,
        pack.ratingLabel,
        ...Object.values(provenance).filter((value): value is string => typeof value === "string"),
      ];
      const cardTexts = pack.cards.flatMap((card) => [
        card.name,
        card.subtitle,
        card.note,
        card.ratingBasis,
        card.image?.credit ?? "",
      ]);
      for (const text of [...packTexts, ...cardTexts]) {
        assert.doesNotMatch(text, WEB_ADDRESS, `${pack.id}: "${text}"`);
        assert.doesNotMatch(text, PRODUCT_NAME, `${pack.id}: "${text}"`);
      }
      // Pack copy is shown before the draft, so it may not single out a card.
      const packCopy = packTexts.join("\n");
      for (const card of pack.cards) {
        assert.ok(!packCopy.includes(card.name), `${pack.id} pack copy names ${card.name}`);
      }
    }
  });

  it("gives the F1 fantasy team exactly the live driver pack's drivers and ratings", () => {
    const team = SPORTS_PACKS.find((pack) => pack.id === "f1-fantasy-team-current");
    const drivers = getPack("f1-drivers");
    assert.ok(team && drivers);
    const published = (pack: ContentPack, position: string) =>
      pack.cards
        .filter((card) => card.position === position)
        .map(({ name, subtitle, note, rating, ratingBasis, ratingSource, accentColor, image }) => ({
          name,
          subtitle,
          note,
          rating,
          ratingBasis,
          ratingSource,
          accentColor,
          image,
        }));
    assert.equal(drivers.cards.length, 22);
    assert.deepEqual(published(team, "driver"), published(drivers, "driver"));
  });

  it("shows nothing before the verdict that states a rating or names its source", () => {
    const coincidences: string[] = [];
    for (const pack of SPORTS_PACKS) {
      for (const card of pack.cards) {
        const visible = toPublicCard(card) as unknown as Record<string, unknown>;
        for (const key of HIDDEN_KEYS) assert.ok(!(key in visible), `${card.id} leaks ${key}`);
        const fields = [card.name, card.subtitle, card.note];
        for (const text of fields) {
          assert.doesNotMatch(text, SOURCE_TERMS, `${card.id}: "${text}"`);
          assert.ok(!text.includes(card.ratingBasis), `${card.id} shows its basis`);
        }
        const rating = String(card.rating);
        if (!fields.some((text) => numbersIn(text).includes(rating))) continue;
        coincidences.push(card.id);
        // Only inside a career span ("1981-95") or a team name ("76ers"), never on its own.
        for (const text of fields) {
          const standalone = text.replace(/\b\d{4}-\d{2}\b/g, "").replace(/\b\d+[a-z]+/gi, "");
          assert.ok(!numbersIn(standalone).includes(rating), `${card.id}: "${text}"`);
        }
      }
    }
    assert.deepEqual(coincidences.sort(), RATING_COINCIDENCES);
  });

  it("completes 2-, 3- and 4-seat drafts in every mode with legal, full lineups", () => {
    for (const pack of SPORTS_PACKS) {
      const cardIds = new Set(pack.cards.map((card) => card.id));
      const ratings = new Map(pack.cards.map((card) => [card.id, card.rating]));
      for (const seatCount of SEAT_COUNTS) {
        const decks = new Set<string>();
        SEEDS.forEach((seed, variant) => {
          // Random human moves exercise skips, discards and forced fills next to all three bots.
          const label = `${pack.id} ${seatCount} seats seed ${seed}`;
          const end = playChecked(pack, seatsFor(seatCount, variant), seed);
          decks.add(end.deck.join(","));
          assert.equal(end.phase, DraftPhase.Complete, label);
          assertFullLineups(pack, end, label);

          const awarded = end.seats.flatMap((seat) => seat.roster.map((entry) => entry.cardId));
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
            assert.equal(seat.money + spent, pack.budget, label);
            const total = seat.roster.reduce(
              (sum, entry) => sum + (ratings.get(entry.cardId) ?? Number.NaN),
              0
            );
            assert.equal(verdict.results[index].totalRating, total, label);
          });
        });
        assert.ok(decks.size > 1, `${pack.id} ${seatCount} seats: seeds should deal new decks`);
      }
    }
  });

  it("replays the same seed and seats to the identical draft", () => {
    for (const pack of SPORTS_PACKS) {
      for (const seatCount of SEAT_COUNTS) {
        const run = () =>
          runDraft(startDraft(pack, seatsFor(seatCount, seatCount), SEEDS[seatCount]), {
            now: NOW,
          });
        assert.deepEqual(run(), run(), `${pack.id} ${seatCount} seats`);
      }
    }
  });

  it("fills every lineup when every seat skips whenever it may", () => {
    let lockedLineupTables = 0;
    for (const pack of SPORTS_PACKS) {
      const rules = rulesForPack(pack);
      for (const seatCount of SEAT_COUNTS) {
        const label = `${pack.id} ${seatCount} seats`;
        const plan = planDeck(rules, toEngineCards(pack), seatCount);
        const people = Array.from({ length: seatCount }, (_, index) => ({
          id: `seat-${index}`,
          name: `Person ${index + 1}`,
          kind: SeatKind.Human,
        }));
        const lockedSlots = new Set<string>();
        const end = playChecked(pack, people, 5, skipWheneverAllowed, (state) => {
          if (state.phase === DraftPhase.Bidding && state.lot?.skipLocked) {
            lockedSlots.add(state.lot.slotId);
          }
        });

        assert.equal(end.phase, DraftPhase.Complete, label);
        assertFullLineups(pack, end, label);
        const discarded = end.history.filter((record) => record.kind === LotOutcomeKind.Discarded);
        for (const { slotId, dealt, required } of plan) {
          const spare = dealt - required;
          const thrown = discarded.filter((record) => record.slotId === slotId).length;
          // Throwing away more than the spare cards would leave a spot that can never fill, and
          // passing locks only once a slot's spare cards are gone (the invariants check the rest).
          assert.ok(thrown <= spare, `${label}: ${thrown} ${slotId} discarded, ${spare} spare`);
          if (lockedSlots.has(slotId)) assert.equal(thrown, spare, `${label} ${slotId} lock`);
        }
        if (!isLineup(pack)) {
          // One slot: each discard costs every seat a skip, so a table throws away two cards.
          const [{ dealt, required }] = plan;
          assert.equal(discarded.length, Math.min(rules.skipsPerSeat, dealt - required), label);
        } else if (lockedSlots.size > 0) {
          lockedLineupTables += 1;
        }
      }
    }
    // The fantasy team's 22 drivers for 20 spots must lock at a full table.
    assert.ok(lockedLineupTables >= 1, "no lineup table reached the last-cards lock");
  });

  it("restores a saved lineup draft at any step and finishes the same way", () => {
    for (const id of [
      "soccer-starting-xi-current",
      "nfl-full-lineup-current",
      "f1-fantasy-team-current",
    ]) {
      const pack = SPORTS_PACKS.find((entry) => entry.id === id);
      assert.ok(pack, id);
      // Bots decide from the state alone, so a restored table must replay exactly.
      const steps: DraftState[] = [];
      const end = runDraft(startDraft(pack, botsOnly(4), 99), {
        now: NOW,
        onStep: (state) => steps.push(state),
      });
      const sampled = steps.filter((_, index) => index % 17 === 5);
      assert.ok(sampled.length >= 5, id);
      for (const state of sampled) {
        const restored = parseDraftState(JSON.parse(JSON.stringify(state)));
        const label = `${id} restored after ${state.history.length} lots`;
        assert.ok(restored.ok, restored.ok ? "" : `${label}: ${restored.error.message}`);
        assert.deepEqual(runDraft(restored.value, { now: NOW }), end, label);
      }
    }
  });
});

// Field-by-field comparison with the saved public data file. The snapshot is git-ignored scratch,
// so this suite only runs where it exists (it does on the machine that generated the packs).
const SNAPSHOT_PATH = join(process.cwd(), ".work", "source-snapshot-2026-11-24", "players.js");
const hasSnapshot = existsSync(SNAPSHOT_PATH);
/** Card positions are pool keys, except Formula 1's spelled-out driver and constructor. */
const POSITION_FOR_POOL_KEY: Record<string, string> = { drv: "driver", con: "constructor" };

describe("sports catalog against the source snapshot", () => {
  it(
    "matches every card to its source entry, in pool order, at the snapshot's pool sizes",
    { skip: hasSnapshot ? false : `snapshot not found at ${SNAPSHOT_PATH}` },
    () => {
      // Parsed as JSON data, never executed.
      const raw = readFileSync(SNAPSHOT_PATH, "utf8");
      const pools = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      const poolAt = (poolPath: string): unknown[][] => {
        const pool = poolPath.split(".").reduce((node: any, key: string) => node?.[key], pools);
        assert.ok(Array.isArray(pool), poolPath);
        return pool;
      };
      for (const [poolPath, size] of Object.entries(POOL_SIZES)) {
        assert.equal(poolAt(poolPath).length, size, poolPath);
      }

      let compared = 0;
      for (const pack of SPORTS_PACKS) {
        // The pack's source is its pools concatenated in the order poolPath lists them.
        const source = pack.provenance.poolPath.split(" + ").flatMap((poolPath) => {
          const key = poolPath.split(".")[1];
          const position = POSITION_FOR_POOL_KEY[key] ?? key;
          return poolAt(poolPath).map((entry, index) => ({ poolPath, index, position, entry }));
        });
        assert.equal(pack.provenance.sourceEntryCount, source.length, pack.id);
        assert.equal(pack.cards.length, source.length, `${pack.id} must use complete pools`);

        for (const card of pack.cards) {
          const { poolPath, index, position, entry } = source[card.sourceIndex];
          assert.equal(entry.length, 7, `${poolPath}[${index}] shape`);
          const [name, subtitle, rating, note, basis, image, colour] = entry as (string | number)[];
          assert.deepEqual(
            {
              name: card.name,
              subtitle: card.subtitle,
              rating: card.rating,
              note: card.note,
              ratingBasis: card.ratingBasis,
              imageUri: card.image?.uri ?? "",
              accentColor: card.accentColor,
              position: card.position,
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
              position,
            },
            `${card.id} differs from ${poolPath}[${index}]`
          );
          compared += 1;
        }
      }
      assert.equal(
        compared,
        SPORTS_PACKS.reduce((total, pack) => total + pack.cards.length, 0)
      );
    }
  );
});

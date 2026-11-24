// Builds the fifteen sports-mode packs in src/data/sportsPacks/ and their list in
// src/data/sportsCatalog.ts from a saved copy of the source site's public data file, players.js.
// Reuse of its data was authorised by the user; rights scope: docs/SPORTS-CATALOG.md.
//
// The public repository never names the source; exact provenance is in the git-ignored
// .work/SOURCE-PROVENANCE.md. Generated packs name a neutral publisher and carry empty site/data
// URLs, and the build stops if any generated string other than an image address mentions the
// source or any web address.
//
// The data file is parsed as JSON text and never executed. Every card value (name, subtitle, note,
// rating, basis, image, colour) is copied unchanged from its source entry, and a card's position is
// the key of the pool it came from. Every pack uses the complete pools of its mode, concatenated in
// slot order; `sourceIndex` is the entry's offset in that concatenation. The script stops instead of
// guessing when a pool is missing, an entry looks unexpected, an image host has no credit rule, the
// same player appears twice in one pack, two entries would share a card id, or a slot cannot seat
// four players. It writes only src/data/sportsPacks/*.ts and src/data/sportsCatalog.ts.
//
// Usage: node scripts/extract-sports-packs.mjs <path/to/players.js> <snapshot-date YYYY-MM-DD>
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

import { SOURCE_PATTERNS } from "./sourcePatterns.mjs";

/** What generated packs say about their origin. Exact provenance: .work/SOURCE-PROVENANCE.md. */
const PUBLISHER = "Licensed game catalog";
const PERMISSION =
  "Data reuse authorised by the user on behalf of the project. Images are linked as published by " +
  "the source and are hosted by third parties; their rights are not covered by this snapshot.";

/** Engine seat limit (MAX_SEATS in src/engine/rules.ts): every slot must seat a full table. */
const MAX_SEATS = 4;
/** Source entries: [name, team or era line, rating 40-99, note, rating basis, image url, colour]. */
const ENTRY_LENGTH = 7;

/** Every pack id already shipped. New ids must not reuse them (card ids are scoped by pack id). */
const EXISTING_PACK_IDS = [
  "nfl-quarterbacks",
  "scifi-80s",
  "looney-tunes",
  "pop-80s",
  "supercars-80s",
  "nba-point-guards",
  "soccer-strikers",
  "f1-drivers",
  "action-all-time",
  "comedy-all-time",
  "horror-all-time",
  "dragon-ball",
  "naruto",
  "nintendo",
  "pop-20s",
  "rock-all-time",
  "hip-hop-10s",
  "hypercars-all-time",
  "sports-cars-20s",
  "off-roaders-all-time",
];

/** Display names of the sports and eras, as the source's mode table labels them. */
const SPORTS = {
  soccer: { name: "Soccer", eras: { current: "Current players", alltime: "All-time greats" } },
  nfl: { name: "NFL", eras: { current: "Current players" } },
  nba: { name: "NBA", eras: { current: "Current players" } },
  f1: { name: "Formula 1", eras: { current: "Current grid" } },
};

/**
 * Card position = key of the source pool, except Formula 1: the live catalog's driver pack already
 * uses "driver" for the `drv` pool, and constructors follow the same spelled-out style.
 */
const POSITION_FOR_POOL_KEY = { drv: "driver", con: "constructor" };
const positionFor = (poolKey) => POSITION_FOR_POOL_KEY[poolKey] ?? poolKey;

/** Plural label of each pool for the human-readable selection line. */
const POOL_LABEL = {
  st: "strikers",
  w: "wingers",
  mid: "midfielders",
  cb: "centre-backs",
  fb: "full-backs",
  gk: "keepers",
  qb: "quarterbacks",
  rb: "running backs",
  wr: "wide receivers",
  te: "tight ends",
  def: "defensive players",
  pg: "point guards",
  sg: "shooting guards",
  sf: "small forwards",
  pf: "power forwards",
  c: "centers",
  drv: "drivers",
  con: "constructors",
};

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const spell = (count) => NUMBER_WORDS[count] ?? String(count);
/** "one basis line says" / "40 attacker basis lines say" */
const lines = (count, singularVerb, pluralVerb, qualifier = "") =>
  `${spell(count)}${qualifier} basis ${count === 1 ? `line ${singularVerb}` : `lines ${pluralVerb}`}`;
const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const listJoin = (items) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

// Rating methods, worded from the source's how-to ("The ratings") and checked against the basis
// lines of each pack. They describe the pack as a whole: no card names, no card ratings.
const CURRENT_ATTACK_HOWTO =
  "Current strikers are rated on 2025-26 league goals and assists per 90 minutes, discounted " +
  "outside the big five leagues, and wingers half on that and half editorially";
const BARELY_PLAYED = "players who barely played are editorial calls and say so (source how-to)";
const ALL_TIME_METHOD = (stats) => {
  stats.expectEvery(/^editorial · career$/, 'reads "editorial · career"');
  return (
    "Editorial: every all-time pool is an editorial call, and says so (source how-to). Every " +
    'basis line in this pack reads "editorial · career".'
  );
};
const attackNotes = (stats, qualifier) => {
  const blended = stats.count(/\(blended\)/);
  const byHand = stats.count(/^set by hand/i);
  return (
    `${capitalise(lines(blended, 'adds "(blended)"', 'add "(blended)"', qualifier))} and ` +
    `${spell(byHand)} ${byHand === 1 ? "starts" : "start"} "set by hand"; the source's how-to ` +
    "explains neither note."
  );
};
const maddenMethod = (stats) => {
  const metric = stats.countOverall(/^Madden 27: (\d+) OVR/);
  const unlisted = stats.count(/^editorial \(not in Madden 27\)/);
  const byHand = stats.count(/^set by hand · Madden 27: \d+ OVR/);
  stats.expectTotal(metric + unlisted + byHand);
  const handNote =
    byHand > 0 ? `, and ${lines(byHand, 'says "set by hand"', 'say "set by hand"')}` : "";
  return (
    "Current NFL players carry their Madden NFL 27 overall rating, every position including " +
    "defense; players Madden doesn't list are editorial calls and say so (source how-to). Here " +
    `${lines(metric, "starts", "start")} with a Madden 27 overall equal to the card's rating; ` +
    `${lines(unlisted, "says", "say")} "editorial (not in Madden 27)"${handNote}.`
  );
};
const nba2kMethod = (stats) => {
  const metric = stats.countOverall(/^2K27: (\d+) OVR/);
  const unlisted = stats.count(/^editorial \(not in 2K27\)/);
  stats.expectTotal(metric + unlisted);
  return (
    "Current NBA players carry their NBA 2K27 overall rating (source how-to). Here " +
    `${lines(metric, "starts", "start")} with a 2K27 overall equal to the card's rating; ` +
    `${lines(unlisted, "says", "say")} "editorial (not in 2K27)".`
  );
};

/** Current and all-time variants of one soccer mode, in that order. */
const soccerMode = ({ mode, title, noun, budget, slots, siteSub, current, alltime }) =>
  ["current", "alltime"].map((era) => ({
    sport: "soccer",
    mode,
    era,
    title,
    noun,
    budget,
    slots,
    siteMode: `Soccer › ${title} › ${SPORTS.soccer.eras[era]} (${siteSub})`,
    ...(era === "current" ? current : alltime),
  }));

const ALL_TIME_SOCCER = {
  ratingLabel: "Editorial judgement of whole careers",
  ratingMethod: ALL_TIME_METHOD,
};

/**
 * The fifteen packs, in catalog order. Slot ids name what a slot accepts and mean the same set of
 * positions everywhere in the library; multi-slot lineups use the position keys as slot ids. Slot
 * and pool order follow the source's mode table (saved home page, 2026-11-24).
 */
const PACKS = [
  ...soccerMode({
    mode: "attackers",
    title: "Attackers",
    noun: "attackers",
    budget: 20,
    slots: [{ id: "attacker", count: 5, pools: ["st", "w"] }],
    siteSub: "$20 · strikers and wingers, five picks",
    current: {
      ratingLabel: "Goals and assists per 90, wingers half editorial",
      ratingMethod: (stats) =>
        `${CURRENT_ATTACK_HOWTO}; ${BARELY_PLAYED}. ${attackNotes(stats, "")}`,
    },
    alltime: ALL_TIME_SOCCER,
  }),
  ...soccerMode({
    mode: "midfielders",
    title: "Midfielders",
    noun: "midfielders",
    budget: 20,
    slots: [{ id: "mid", count: 5, pools: ["mid"] }],
    siteSub: "$20 · the engine room, five picks",
    current: {
      ratingLabel: "Editorial judgement, with 2025-26 league stats",
      ratingMethod: (stats) => {
        stats.expectEvery(/^editorial · 2025-26 [^:]+: \d+ G, \d+ A, \d+ apps$/, "league line");
        return (
          "Editorial: current midfielders are rated editorially, because the box score doesn't " +
          'measure them (source how-to). Every basis line starts "editorial" and adds the ' +
          "player's 2025-26 league goals, assists and appearances for context."
        );
      },
    },
    alltime: ALL_TIME_SOCCER,
  }),
  ...soccerMode({
    mode: "defenders",
    title: "Defenders",
    noun: "defenders",
    budget: 20,
    slots: [{ id: "defender", count: 5, pools: ["cb", "fb", "gk"] }],
    siteSub: "$20 · centre-backs, full-backs, keepers, five picks",
    current: {
      ratingLabel: "Editorial judgement",
      ratingMethod: (stats) => {
        const keeperLine = /^editorial · 2025-26 [^:]+: \d+ clean sheets, \d+ apps$/;
        stats.expectEvery(
          (card) => (card.position === "gk" ? keeperLine : /^editorial$/).test(card.ratingBasis),
          "bare editorial, keepers with a clean-sheet line"
        );
        return (
          "Editorial: current centre-backs, full-backs and keepers are rated editorially, because " +
          "the box score doesn't measure them (source how-to). Keeper basis lines add 2025-26 " +
          "league clean sheets and appearances for context."
        );
      },
    },
    alltime: ALL_TIME_SOCCER,
  }),
  ...soccerMode({
    mode: "starting-xi",
    title: "Starting XI",
    noun: "players",
    budget: 40,
    slots: [
      { id: "gk", count: 1, pools: ["gk"] },
      { id: "cb", count: 2, pools: ["cb"] },
      { id: "fb", count: 2, pools: ["fb"] },
      { id: "mid", count: 3, pools: ["mid"] },
      { id: "w", count: 2, pools: ["w"] },
      { id: "st", count: 1, pools: ["st"] },
    ],
    siteSub: "$40 · GK, 2 CB, 2 FB, 3 MID, 2 W, ST",
    current: {
      ratingLabel: "Per-90 output up front, editorial judgement behind",
      ratingMethod: (stats) =>
        `${CURRENT_ATTACK_HOWTO}; midfielders, defenders and keepers are editorial calls, because ` +
        `the box score doesn't measure them; ${BARELY_PLAYED}. ${attackNotes(stats, " attacker")}`,
    },
    alltime: ALL_TIME_SOCCER,
  }),
  {
    sport: "nfl",
    mode: "running-backs",
    era: "current",
    title: "Running backs",
    noun: "running backs",
    budget: 20,
    slots: [{ id: "rb", count: 5, pools: ["rb"] }],
    siteMode: "NFL › Running backs › Current players ($20, five picks)",
    ratingLabel: "Madden NFL 27 overall ratings",
    ratingMethod: maddenMethod,
  },
  {
    sport: "nfl",
    mode: "receivers",
    era: "current",
    title: "Receivers & tight ends",
    noun: "receivers and tight ends",
    budget: 20,
    slots: [{ id: "receiver", count: 5, pools: ["wr", "te"] }],
    siteMode: "NFL › Receivers & tight ends › Current players ($20 · WR & TE, five picks)",
    ratingLabel: "Madden NFL 27 overall ratings",
    ratingMethod: maddenMethod,
  },
  {
    sport: "nfl",
    mode: "defense",
    era: "current",
    title: "Defense",
    noun: "defensive players",
    budget: 20,
    slots: [{ id: "def", count: 5, pools: ["def"] }],
    siteMode: "NFL › Defense › Current players ($20, five picks)",
    ratingLabel: "Madden NFL 27 overall ratings",
    ratingMethod: maddenMethod,
  },
  {
    sport: "nfl",
    mode: "full-lineup",
    era: "current",
    title: "Full lineup",
    noun: "players",
    budget: 30,
    slots: [
      { id: "qb", count: 1, pools: ["qb"] },
      { id: "rb", count: 2, pools: ["rb"] },
      { id: "wr", count: 2, pools: ["wr"] },
      { id: "te", count: 1, pools: ["te"] },
      { id: "def", count: 1, pools: ["def"] },
    ],
    siteMode: "NFL › Full lineup › Current players ($30 · QB, 2 RB, 2 WR, TE, DEF)",
    ratingLabel: "Madden NFL 27 overall ratings",
    ratingMethod: maddenMethod,
  },
  {
    sport: "nba",
    mode: "guards-wings",
    era: "current",
    title: "Guards & wings",
    noun: "guards and wings",
    budget: 20,
    slots: [{ id: "guard-wing", count: 5, pools: ["pg", "sg", "sf"] }],
    siteMode: "NBA › Guards & wings › Current players ($20 · PG, SG, SF, five picks)",
    ratingLabel: "NBA 2K27 overall ratings",
    ratingMethod: nba2kMethod,
  },
  {
    sport: "nba",
    mode: "bigs",
    era: "current",
    title: "Bigs",
    noun: "bigs",
    budget: 20,
    slots: [{ id: "big", count: 5, pools: ["pf", "c"] }],
    siteMode: "NBA › Bigs › Current players ($20 · PF, C, five picks)",
    ratingLabel: "NBA 2K27 overall ratings",
    ratingMethod: nba2kMethod,
  },
  {
    sport: "f1",
    mode: "fantasy-team",
    era: "current",
    title: "Fantasy team",
    noun: "drivers and constructors",
    budget: 30,
    slots: [
      { id: "driver", count: 5, pools: ["drv"] },
      { id: "constructor", count: 2, pools: ["con"] },
    ],
    siteMode: "Formula 1 › Fantasy team › Current grid ($30 · 5 drivers + 2 constructors)",
    ratingLabel: "2026 championship points",
    ratingMethod: (stats) => {
      // Only drivers on zero points are hand-set; everything else is a plain points line.
      stats.expectEvery(
        (card) =>
          /^2026: \d+ pts$/.test(card.ratingBasis) ||
          (card.position === "driver" && card.ratingBasis === "set by hand · 2026: 0 pts"),
        "a 2026 points line, hand-set only for a driver on zero points"
      );
      const byHand = stats.count(/^set by hand/i);
      const handSet =
        byHand === 1
          ? "One driver without points carries a basis line that says"
          : `${capitalise(spell(byHand))} drivers without points carry basis lines that say`;
      return (
        "Current F1 drivers and constructors are rated on 2026 championship points (source " +
        `how-to). ${handSet} "set by hand".`
      );
    },
  },
];

/** Emitted as enum members instead of strings; no source text contains this marker. */
const ENUM_MARKER = "@@enum:";
const HEX_COLOUR = /^#[0-9a-f]{6}$/i;
const PACK_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const IMAGE_FILE = /\.(png|jpe?g)$/i;
const WEB_ADDRESS = /https?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:com|net|org|io|co|app|dev)\b/i;

const fail = (message) => {
  throw new Error(message);
};

const slugify = (text) =>
  text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // combining accents left by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const camelCase = (id) => id.replace(/-([a-z0-9])/g, (_, next) => next.toUpperCase());

/** Who hosts each linked image, as the source links it. Unknown hosts stop the build for review. */
const imageCredit = (url) => {
  const { protocol, hostname, pathname } = new URL(url);
  if (protocol !== "https:") fail(`image is not https: ${url}`);
  if (!IMAGE_FILE.test(pathname)) fail(`image is not a PNG or JPEG file: ${url}`);
  if (hostname === "a.espncdn.com" && pathname.startsWith("/i/headshots/")) {
    return "ESPN headshot";
  }
  // TheSportsDB serves the same files from its CDN host and from its main host.
  if (hostname === "r2.thesportsdb.com" || hostname === "www.thesportsdb.com") {
    if (pathname.startsWith("/images/media/player/cutout/")) return "TheSportsDB player cutout";
    if (pathname.startsWith("/images/media/player/thumb/")) return "TheSportsDB player thumbnail";
  }
  return fail(`no credit rule for image ${url}`);
};

/** The source marks its own judgement calls in the basis line: "editorial…" or "set by hand…". */
const isEditorialBasis = (basis) => /^(editorial|set by hand)/i.test(basis.trim());

/** Parses `window.POOLS = {...};` as JSON. Anything other than comments around it stops the build. */
const readPools = (path) => {
  const raw = readFileSync(path, "utf8");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const prefix = raw.slice(0, start);
  const suffix = raw.slice(end + 1);
  if (!/^(\s*\/\/[^\n]*\n)*\s*window\.POOLS\s*=\s*$/.test(prefix) || !/^;?\s*$/.test(suffix)) {
    fail(`${path} is not the expected "window.POOLS = {...};" data file`);
  }
  if (raw.includes(ENUM_MARKER)) fail(`${path} contains the reserved marker ${ENUM_MARKER}`);
  return JSON.parse(raw.slice(start, end + 1));
};

const getPool = (pools, poolPath) => {
  const pool = poolPath.split(".").reduce((node, key) => node?.[key], pools);
  if (!Array.isArray(pool)) fail(`pool ${poolPath} not found`);
  if (pool.length === 0) fail(`pool ${poolPath} is empty`);
  return pool;
};

const packIdOf = (spec) => `${spec.sport}-${spec.mode}-${spec.era}`;
const poolPathOf = (spec, poolKey) => `${spec.sport}.${poolKey}.${spec.era}`;

const toCard = (packId, poolPath, poolKey, entry, poolIndex, sourceIndex) => {
  const where = `${poolPath}[${poolIndex}]`;
  if (!Array.isArray(entry) || entry.length !== ENTRY_LENGTH)
    fail(`${where} has an unexpected shape`);
  const [name, subtitle, rating, note, basis, imageUrl, colour] = entry;
  for (const [field, value] of Object.entries({ name, subtitle, note, basis, imageUrl, colour })) {
    if (typeof value !== "string") fail(`${where} ${field} is not text`);
  }
  if (!name.trim() || !note.trim() || !basis.trim()) fail(`${where} is missing name/note/basis`);
  if (!Number.isInteger(rating) || rating < 40 || rating > 99) fail(`${where} rating ${rating}`);
  const slug = slugify(name);
  if (!slug) fail(`${where} name "${name}" has no usable id`);
  const source = isEditorialBasis(basis) ? "Editorial" : "PublishedMetric";

  return {
    id: `${packId}--${slug}`,
    name,
    subtitle,
    note,
    position: positionFor(poolKey),
    rating,
    ratingBasis: basis,
    ratingSource: `${ENUM_MARKER}RatingSource.${source}`,
    accentColor: HEX_COLOUR.test(colour) ? colour.toUpperCase() : null,
    image: imageUrl
      ? { uri: imageUrl, host: new URL(imageUrl).hostname, credit: imageCredit(imageUrl) }
      : null,
    side: null,
    sourceIndex,
  };
};

/** Counting helpers the rating-method texts use; each check stops the build when the text lies. */
const basisStats = (packId, cards) => ({
  count: (pattern) => cards.filter((card) => pattern.test(card.ratingBasis)).length,
  /** Lines that start with a game overall; that overall must be the card's rating. */
  countOverall: (pattern) =>
    cards.filter((card) => {
      const match = card.ratingBasis.match(pattern);
      if (match && Number(match[1]) !== card.rating) {
        fail(`${card.id}: basis overall ${match[1]} differs from rating ${card.rating}`);
      }
      return !!match;
    }).length,
  expectTotal: (counted) => {
    if (counted !== cards.length) {
      fail(`${packId}: rating method covers ${counted} of ${cards.length} basis lines`);
    }
  },
  /** `rule` is a pattern for the basis line or a predicate over the whole card. */
  expectEvery: (rule, description) => {
    const fits = (card) => (typeof rule === "function" ? rule(card) : rule.test(card.ratingBasis));
    const odd = cards.find((card) => !fits(card));
    if (odd) fail(`${packId}: ${odd.id} basis "${odd.ratingBasis}" is not ${description}`);
  },
});

/** Stops on the same player twice (exact entry or same name) or two names sharing an id. */
const checkDuplicates = (packId, sources) => {
  const byEntry = new Map();
  const byName = new Map();
  const bySlug = new Map();
  for (const { where, entry } of sources) {
    const [name] = entry;
    const exact = byEntry.get(JSON.stringify(entry));
    if (exact) fail(`${packId}: ${where} repeats the exact entry ${exact} (${name})`);
    const sameName = byName.get(name);
    if (sameName) fail(`${packId}: ${where} and ${sameName} are both named "${name}"`);
    const sameSlug = bySlug.get(slugify(name));
    if (sameSlug) fail(`${packId}: ${where} and ${sameSlug} would share id "${slugify(name)}"`);
    byEntry.set(JSON.stringify(entry), where);
    byName.set(name, where);
    bySlug.set(slugify(name), where);
  }
};

/** Every generated string must be free of the source's name and of web addresses. */
const checkNeutral = (packId, value, path = "") => {
  if (typeof value === "string") {
    const isImageAddress = path.endsWith(".image.uri") || path.endsWith(".image.host");
    // The source's name and address in any spelling; none may reach a generated module.
    for (const pattern of SOURCE_PATTERNS) {
      if (pattern.test(value)) fail(`${packId}${path} names the source: "${value}"`);
    }
    if (!isImageAddress && WEB_ADDRESS.test(value)) {
      fail(`${packId}${path} contains a web address: "${value}"`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkNeutral(packId, item, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) checkNeutral(packId, item, `${path}.${key}`);
  }
};

const buildPack = (spec, pools, snapshotDate) => {
  const id = packIdOf(spec);
  const sources = [];
  const poolSummaries = [];
  for (const slot of spec.slots) {
    for (const poolKey of slot.pools) {
      const poolPath = poolPathOf(spec, poolKey);
      const pool = getPool(pools, poolPath);
      pool.forEach((entry, poolIndex) =>
        sources.push({ poolPath, poolKey, poolIndex, entry, where: `${poolPath}[${poolIndex}]` })
      );
      poolSummaries.push({ poolKey, poolPath, size: pool.length });
    }
  }
  checkDuplicates(id, sources);
  const cards = sources.map(({ poolPath, poolKey, poolIndex, entry }, sourceIndex) =>
    toCard(id, poolPath, poolKey, entry, poolIndex, sourceIndex)
  );

  for (const slot of spec.slots) {
    const accepts = slot.pools.map(positionFor);
    const available = cards.filter((card) => accepts.includes(card.position)).length;
    if (available < slot.count * MAX_SEATS) {
      fail(`${id}: slot ${slot.id} has ${available} cards for ${slot.count * MAX_SEATS} spots`);
    }
  }

  const total = cards.length;
  const listed = poolSummaries.map(({ poolKey, size }) => `${POOL_LABEL[poolKey]} (${size})`);
  const selection =
    poolSummaries.length === 1
      ? `The complete pool for this mode. ${total} of ${total} entries.`
      : `The complete pools for this mode: ${listJoin(listed)}. ${total} of ${total} entries.`;

  const pack = {
    id,
    version: `${snapshotDate}.${spec.revision ?? 1}`,
    topic: `${ENUM_MARKER}TopicId.Sports`,
    title: spec.title,
    subtitle: `${SPORTS[spec.sport].name} · ${SPORTS[spec.sport].eras[spec.era]}`,
    noun: spec.noun,
    ratingLabel: spec.ratingLabel,
    budget: spec.budget,
    slots: spec.slots.map((slot) => ({
      id: slot.id,
      count: slot.count,
      accepts: slot.pools.map(positionFor),
    })),
    cards,
    provenance: {
      publisher: PUBLISHER,
      siteUrl: "",
      dataUrl: "",
      poolPath: poolSummaries.map(({ poolPath }) => poolPath).join(" + "),
      siteMode: spec.siteMode,
      snapshotDate,
      selection,
      sourceEntryCount: total,
      ratingMethod: spec.ratingMethod(basisStats(id, cards)),
      permission: PERMISSION,
    },
  };

  checkNeutral(id, pack);
  // Pack-level copy is shown before the draft: it may not name a card.
  const packCopy = [
    pack.title,
    pack.subtitle,
    pack.noun,
    pack.ratingLabel,
    ...Object.values(pack.provenance).filter((value) => typeof value === "string"),
  ].join("\n");
  const named = cards.find((card) => packCopy.includes(card.name));
  if (named) fail(`${id}: pack-level copy names the card ${named.name}`);

  return { pack, poolSummaries };
};

const wrapComment = (text, width = 98) => {
  const words = text.split(" ");
  const out = [];
  let line = "//";
  for (const word of words) {
    if (line.length + 1 + word.length > width && line !== "//") {
      out.push(line);
      line = "//";
    }
    line += ` ${word}`;
  }
  out.push(line);
  return out;
};

const renderModule = (spec, pack, snapshotDate) => {
  const body = JSON.stringify(pack, null, 2).replace(
    new RegExp(`"${ENUM_MARKER}((?:RatingSource|TopicId)\\.[A-Za-z]+)"`, "g"),
    "$1"
  );
  if (body.includes(ENUM_MARKER)) fail(`${pack.id}: unexpected enum marker left in output`);
  return [
    ...wrapComment(
      `Generated by scripts/extract-sports-packs.mjs from the saved public data snapshot of ` +
        `${snapshotDate}; pools in card order: ${pack.provenance.poolPath.split(" + ").join(", ")}.`
    ),
    "// Do not edit by hand; re-run the script. Provenance: docs/SPORTS-CATALOG.md.",
    `import { RatingSource, TopicId, type ContentPack } from "../types";`,
    "",
    `export const ${spec.exportName}: ContentPack = ${body};`,
    "",
  ].join("\n");
};

const renderCatalog = (modules, snapshotDate) => {
  const imports = [...modules]
    .sort((a, b) => a.spec.fileName.localeCompare(b.spec.fileName))
    .map(
      ({ spec }) =>
        `import { ${spec.exportName} } from "./sportsPacks/${spec.fileName.replace(/\.ts$/, "")}";`
    );
  return [
    `// Generated by scripts/extract-sports-packs.mjs (snapshot ${snapshotDate}). Do not edit by hand.`,
    "// Sports modes built from complete source pools; provenance in docs/SPORTS-CATALOG.md.",
    ...imports,
    `import type { ContentPack } from "./types";`,
    "",
    "/**",
    " * Fifteen sports modes in catalog order: soccer attackers, midfielders, defenders and starting",
    " * XI (current players, then all-time greats), current NFL running backs, receivers, defense and",
    " * full lineup, current NBA guards & wings and bigs, and the current Formula 1 fantasy team.",
    " * The sport is the id prefix (soccer-, nfl-, nba-, f1-) and the era the id suffix (-current,",
    " * -alltime). Lineup modes use several slots with disjoint positions.",
    " */",
    "export const SPORTS_PACKS: readonly ContentPack[] = [",
    ...modules.map(({ spec }) => `  ${spec.exportName},`),
    "];",
    "",
  ].join("\n");
};

const checkSpecs = () => {
  const seen = new Set(EXISTING_PACK_IDS);
  for (const spec of PACKS) {
    const id = packIdOf(spec);
    if (!PACK_ID.test(id)) fail(`pack id ${id} must be lowercase words joined by "-"`);
    if (seen.has(id)) fail(`pack id ${id} is already used`);
    if (!SPORTS[spec.sport]?.eras[spec.era]) fail(`${id}: unknown sport/era`);
    if (spec.revision !== undefined && !(Number.isInteger(spec.revision) && spec.revision > 0)) {
      fail(`pack ${id} revision must be a positive integer`);
    }
    const positions = spec.slots.flatMap((slot) => slot.pools.map(positionFor));
    if (new Set(positions).size !== positions.length) fail(`${id}: slots overlap`);
    const slotIds = spec.slots.map((slot) => slot.id);
    if (new Set(slotIds).size !== slotIds.length) fail(`${id}: duplicate slot id`);
    const picks = spec.slots.reduce((total, slot) => total + slot.count, 0);
    if (spec.budget < picks) fail(`${id}: $${spec.budget} cannot cover ${picks} picks`);
    seen.add(id);
    spec.exportName = id.replace(/-/g, "_").toUpperCase();
    spec.fileName = `${camelCase(id)}.ts`;
  }
};

const summarise = ({ pack, poolSummaries }) => {
  const ratings = pack.cards.map((card) => card.rating);
  const editorial = pack.cards.filter((card) => card.ratingSource.endsWith("Editorial")).length;
  const credits = {};
  for (const card of pack.cards) {
    const key = card.image ? `${card.image.host} (${card.image.credit})` : "no image";
    credits[key] = (credits[key] ?? 0) + 1;
  }
  const supply = pack.slots
    .map((slot) => {
      const available = pack.cards.filter((card) => slot.accepts.includes(card.position)).length;
      return `${slot.id} ${slot.count}x: ${available}/${slot.count * MAX_SEATS}`;
    })
    .join(", ");
  return [
    `${pack.id}: ${pack.cards.length} cards, $${pack.budget}, ratings ` +
      `${Math.min(...ratings)}-${Math.max(...ratings)}, editorial ${editorial}`,
    `  pools: ${poolSummaries.map(({ poolPath, size }) => `${poolPath} ${size}`).join(", ")}`,
    `  four-seat supply (available/required): ${supply}`,
    `  images: ${Object.entries(credits)
      .map(([key, count]) => `${count} ${key}`)
      .join("; ")}`,
  ].join("\n");
};

const main = async () => {
  const [, , sourcePath, snapshotDate] = process.argv;
  if (!sourcePath || !/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate ?? "")) {
    console.error(
      "Usage: node scripts/extract-sports-packs.mjs <players.js> <snapshot-date YYYY-MM-DD>"
    );
    process.exit(1);
  }
  checkSpecs();
  const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
  const outputDir = join(dataDir, "sportsPacks");
  const pools = readPools(sourcePath);

  // Build and check everything before writing anything, so a bad entry leaves old modules intact.
  const modules = PACKS.map((spec) => {
    const built = buildPack(spec, pools, snapshotDate);
    return { spec, ...built, code: renderModule(spec, built.pack, snapshotDate) };
  });
  const catalogCode = renderCatalog(modules, snapshotDate);
  for (const text of [catalogCode, ...modules.map(({ code }) => code.split("\nimport")[0])]) {
    for (const pattern of [...SOURCE_PATTERNS, WEB_ADDRESS]) {
      if (pattern.test(text)) fail(`generated header matches ${pattern}`);
    }
  }

  mkdirSync(outputDir, { recursive: true });
  const write = async (outputPath, code) => {
    const options = (await resolveConfig(outputPath)) ?? {};
    const formatted = await format(code, { ...options, parser: "typescript" });
    let previous = null;
    try {
      previous = readFileSync(outputPath, "utf8");
    } catch {
      previous = null;
    }
    if (previous !== formatted) writeFileSync(outputPath, formatted);
    return previous === formatted ? "unchanged" : "written";
  };
  for (const module of modules) {
    const outputPath = join(outputDir, module.spec.fileName);
    const status = await write(outputPath, module.code);
    console.log(`${summarise(module)}\n  -> ${outputPath} (${status})`);
  }
  const catalogPath = join(dataDir, "sportsCatalog.ts");
  console.log(`SPORTS_PACKS -> ${catalogPath} (${await write(catalogPath, catalogCode)})`);

  const expected = new Set(modules.map(({ spec }) => spec.fileName));
  const stale = readdirSync(outputDir).filter((name) => !expected.has(name));
  if (stale.length > 0) {
    console.warn(`Not generated by this script, review or remove: ${stale.join(", ")}`);
  }
  const cards = modules.reduce((total, { pack }) => total + pack.cards.length, 0);
  console.log(`${modules.length} packs, ${cards} cards. No duplicate players or id clashes.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

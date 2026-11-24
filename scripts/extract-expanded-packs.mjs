// Builds the fifteen expansion packs in src/data/expandedPacks from a saved copy of the source
// site's public data file, players.js (reuse of its data was authorised by the user).
//
// The public repository never names the source; exact provenance is in the git-ignored
// .work/SOURCE-PROVENANCE.md. Generated packs name a neutral publisher and carry empty site/data
// URLs.
//
// The file is parsed as JSON text and never executed. Every value a card carries (name, subtitle,
// note, rating, basis, image, colour, side) is copied from its source entry unchanged; the script
// stops instead of guessing when an entry, an image host or a card id looks unexpected. It writes
// only src/data/expandedPacks/*.ts and never touches the live catalog (src/data/catalog.ts and
// src/data/packs, built by extract-source-packs.mjs).
//
// Usage: node scripts/extract-expanded-packs.mjs <path/to/players.js> <snapshot-date YYYY-MM-DD>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

import { mentionsSource } from "./sourcePatterns.mjs";

/** What generated packs say about their origin (the same wording as the sports packs). */
const PUBLISHER = "Licensed game catalog";
const PERMISSION =
  "Data reuse authorised by the user on behalf of the project. Images are linked as published " +
  "by the site and are hosted by third parties; their rights are not covered by this snapshot.";

/** Packs in the live catalog. New pack ids must not reuse them (card ids are scoped by pack id). */
const EXISTING_PACK_IDS = [
  "nfl-quarterbacks",
  "scifi-80s",
  "looney-tunes",
  "pop-80s",
  "supercars-80s",
];

const COMPLETE_POOL = "The complete pool for this mode.";
const SPOTIFY_METHOD =
  "Lifetime Spotify play count as published by the source, ranked within genre and decade " +
  "(source how-to).";
const MOVIE_METHOD =
  "Blend of the Letterboxd average and the Metacritic score, ranked within the genre; audience " +
  "only when there is no critic score (source how-to). The all-time mode takes the genre's best " +
  "from every decade.";

// `top` keeps the N highest published ratings (ties broken by source order); otherwise the whole
// pool is used. Cards always stay in source order. `revision` (default 1) is the suffix of the pack
// version: raise it when a spec change alters the cards of a pack players may already have saved.
const PACKS = [
  {
    id: "nba-point-guards",
    exportName: "NBA_POINT_GUARDS",
    fileName: "nbaPointGuards.ts",
    topic: "Sports",
    poolPath: "nba.pg.current",
    position: "pg",
    title: "Point guards",
    subtitle: "NBA · Current players",
    noun: "point guards",
    siteMode:
      "Closest site mode: NBA › Guards & wings › Current players ($20 · PG, SG, SF). The site " +
      "has no point-guard-only mode; this pack uses only its point-guard pool.",
    top: 32,
    ratingLabel: "NBA 2K27 overall ratings",
    ratingMethod:
      "Current NBA players carry their NBA 2K27 overall rating (source how-to). Every basis line " +
      "in this pack starts with the 2K27 overall.",
  },
  {
    id: "soccer-strikers",
    exportName: "SOCCER_STRIKERS",
    fileName: "soccerStrikers.ts",
    topic: "Sports",
    poolPath: "soccer.st.current",
    position: "st",
    title: "Strikers",
    subtitle: "Soccer · Current players",
    noun: "strikers",
    siteMode:
      "Closest site mode: Soccer › Attackers › Current players ($20 · strikers and wingers). The " +
      "site has no striker-only mode; this pack uses only its striker pool.",
    top: 30,
    ratingLabel: "2025-26 goals and assists per 90",
    ratingMethod:
      "Current strikers are rated on 2025-26 league goals and assists per 90 minutes, discounted " +
      "outside the big five leagues; players who barely played are editorial calls and say so " +
      '(source how-to). Some published basis lines add "(blended)" and one says "set by hand"; ' +
      "the site's how-to and ratings pages do not explain either note.",
  },
  {
    id: "f1-drivers",
    exportName: "F1_DRIVERS",
    fileName: "f1Drivers.ts",
    topic: "Sports",
    poolPath: "f1.drv.current",
    position: "driver",
    title: "Drivers",
    subtitle: "Formula 1 · Current grid",
    noun: "drivers",
    siteMode: "Formula 1 › Drivers › Current grid ($20, five picks)",
    ratingLabel: "2026 championship points",
    ratingMethod:
      "Current F1 drivers are rated on 2026 championship points (source how-to). Two drivers " +
      'without points carry basis lines that say "set by hand".',
  },
  {
    id: "action-all-time",
    exportName: "ACTION_ALL_TIME",
    fileName: "actionAllTime.ts",
    topic: "Movies",
    poolPath: "action.best.all",
    position: "film",
    title: "Action: all-time",
    subtitle: "Movies · The genre's best, every decade",
    noun: "films",
    siteMode: "Movies › Action › All-time ($20, five picks)",
    ratingLabel: "Letterboxd and Metacritic, blended",
    ratingMethod: MOVIE_METHOD,
  },
  {
    id: "comedy-all-time",
    exportName: "COMEDY_ALL_TIME",
    fileName: "comedyAllTime.ts",
    topic: "Movies",
    poolPath: "comedy.best.all",
    position: "film",
    title: "Comedy: all-time",
    subtitle: "Movies · The genre's best, every decade",
    noun: "films",
    siteMode: "Movies › Comedy › All-time ($20, five picks)",
    ratingLabel: "Letterboxd and Metacritic, blended",
    ratingMethod: MOVIE_METHOD,
  },
  {
    id: "horror-all-time",
    exportName: "HORROR_ALL_TIME",
    fileName: "horrorAllTime.ts",
    topic: "Movies",
    poolPath: "horror.best.all",
    position: "film",
    title: "Horror: all-time",
    subtitle: "Movies · The genre's best, every decade",
    noun: "films",
    siteMode: "Movies › Horror › All-time ($20, five picks)",
    ratingLabel: "Letterboxd and Metacritic, blended",
    ratingMethod: MOVIE_METHOD,
  },
  {
    id: "dragon-ball",
    exportName: "DRAGON_BALL",
    fileName: "dragonBall.ts",
    topic: "Characters",
    poolPath: "anime.dbz.all",
    position: "character",
    title: "Dragon Ball",
    subtitle: "Characters · Anime",
    noun: "characters",
    siteMode: "Characters › Anime › Dragon Ball Z ($20, five picks)",
    ratingLabel: "Editorial: raw power",
    ratingMethod:
      "Editorial: anime characters are rated on raw power; heroes and villains share one pool " +
      "(source how-to).",
  },
  {
    id: "naruto",
    exportName: "NARUTO",
    fileName: "naruto.ts",
    topic: "Characters",
    poolPath: "anime.naruto.all",
    position: "character",
    title: "Naruto",
    subtitle: "Characters · Anime",
    noun: "characters",
    siteMode: "Characters › Anime › Naruto ($20, five picks)",
    ratingLabel: "Editorial: raw power",
    ratingMethod:
      "Editorial: anime characters are rated on raw power; heroes and villains share one pool " +
      "(source how-to).",
  },
  {
    id: "nintendo",
    exportName: "NINTENDO",
    fileName: "nintendo.ts",
    topic: "Characters",
    poolPath: "games.nintendo.all",
    position: "character",
    title: "Nintendo",
    subtitle: "Characters · Video games",
    noun: "characters",
    siteMode: "Characters › Video games › Nintendo ($20, five picks)",
    top: 40,
    ratingLabel: "Editorial: strength and how big the games are",
    ratingMethod:
      "Editorial: video game characters are rated on strength, with a nod to how big their games " +
      "are; heroes and villains share one pool (source how-to).",
  },
  {
    id: "pop-20s",
    exportName: "POP_20S",
    fileName: "pop20s.ts",
    topic: "Songs",
    poolPath: "pop.20s.all",
    position: "song",
    title: "Pop: the 2020s",
    subtitle: "Songs · 2020s",
    noun: "songs",
    siteMode: "Songs › Pop › The 2020s ($20, five picks)",
    ratingLabel: "Lifetime Spotify plays, ranked in the decade",
    ratingMethod: SPOTIFY_METHOD,
  },
  {
    id: "rock-all-time",
    exportName: "ROCK_ALL_TIME",
    fileName: "rockAllTime.ts",
    topic: "Songs",
    poolPath: "rock.best.all",
    position: "song",
    title: "Rock: all-time",
    subtitle: "Songs · The genre's biggest, every decade",
    noun: "songs",
    siteMode: "Songs › Rock › All-time ($20, five picks)",
    ratingLabel: "Lifetime Spotify plays, ranked in each song's decade",
    ratingMethod:
      "Lifetime Spotify play count, ranked within genre and each song's own decade; the all-time " +
      "mode takes the best of each decade, so an older song can outrank one with far more plays " +
      "(source how-to).",
  },
  {
    id: "hip-hop-10s",
    exportName: "HIP_HOP_10S",
    fileName: "hipHop10s.ts",
    topic: "Songs",
    poolPath: "hiphop.10s.all",
    position: "song",
    title: "Hip-hop: the 2010s",
    subtitle: "Songs · 2010–2019",
    noun: "songs",
    siteMode: "Songs › Hip-Hop/Rap › The 2010s ($20, five picks)",
    ratingLabel: "Lifetime Spotify plays, ranked in the decade",
    ratingMethod: SPOTIFY_METHOD,
  },
  {
    id: "hypercars-all-time",
    exportName: "HYPERCARS_ALL_TIME",
    fileName: "hypercarsAllTime.ts",
    topic: "Cars",
    poolPath: "hyper.best.all",
    position: "car",
    title: "Hypercars: all-time",
    subtitle: "Cars · The class's best, every decade",
    noun: "cars",
    siteMode: "Cars › Hypercars › All-time ($20, five picks)",
    ratingLabel: "Power, 0–60 and top speed, ranked in each car's decade",
    ratingMethod:
      "Power, 0–60 time and top speed blended and ranked within the class and each car's own " +
      "decade; the all-time mode takes the class's best from every decade (source how-to).",
  },
  {
    id: "sports-cars-20s",
    exportName: "SPORTS_CARS_20S",
    fileName: "sportsCars20s.ts",
    topic: "Cars",
    poolPath: "sportscar.20s.all",
    position: "car",
    title: "Sports cars: the 2020s",
    subtitle: "Cars · 2020s",
    noun: "cars",
    siteMode: "Cars › Sports cars › The 2020s ($20, five picks)",
    ratingLabel: "Power, 0–60 and top speed",
    ratingMethod:
      "Power, 0–60 time and top speed blended and ranked within the class and decade " +
      "(source how-to).",
  },
  {
    id: "off-roaders-all-time",
    exportName: "OFF_ROADERS_ALL_TIME",
    fileName: "offRoadersAllTime.ts",
    topic: "Cars",
    poolPath: "offroad.best.all",
    position: "car",
    title: "Off-roaders: all-time",
    subtitle: "Cars · The class's best, every decade",
    noun: "cars",
    siteMode: "Cars › Off-roaders › All-time ($20, five picks)",
    ratingLabel: "Editorial: off-road capability",
    ratingMethod:
      "Editorial: off-roaders are rated on how far from a road they can actually get, ranked " +
      "within the class and each car's own decade; the basis lines also list power and speed " +
      "(source how-to).",
  },
];

/** Emitted as enum members instead of strings; no source text contains this marker. */
const ENUM_MARKER = "@@enum:";
const HEX_COLOUR = /^#[0-9a-f]{6}$/i;
const PACK_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SIDES = { HERO: "hero", VILLAIN: "villain" };

const fail = (message) => {
  throw new Error(message);
};

const slugify = (text) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Who hosts each linked image, as the site links it. Unknown hosts stop the build for review. */
const imageCredit = (url) => {
  const { protocol, hostname, pathname } = new URL(url);
  if (protocol !== "https:") fail(`image is not https: ${url}`);
  if (hostname === "a.espncdn.com") return "ESPN headshot";
  if (hostname === "m.media-amazon.com") return "IMDb poster (Amazon CDN)";
  if (hostname === "r2.thesportsdb.com") return "TheSportsDB player cutout";
  if (hostname === "upload.wikimedia.org") {
    if (pathname.startsWith("/wikipedia/en/")) {
      return "English Wikipedia upload; licence per file page";
    }
    if (pathname.startsWith("/wikipedia/commons/"))
      return "Wikimedia Commons; licence per file page";
  }
  if (hostname === "raw.githubusercontent.com" && pathname.startsWith("/PokeAPI/sprites/")) {
    return "PokeAPI sprites repository (GitHub), official-artwork set";
  }
  return fail(`no credit rule for image ${url}`);
};

/** The site marks its own judgement calls in the basis line: "editorial…" or "set by hand…". */
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
  return pool;
};

/** Keeps the whole pool, or the `top` highest ratings with ties broken by source order. */
const selectEntries = (spec, pool) => {
  const indexed = pool.map((entry, sourceIndex) => ({ entry, sourceIndex }));
  if (!spec.top) return { selected: indexed, selection: COMPLETE_POOL };
  if (spec.top >= pool.length) fail(`${spec.id}: top ${spec.top} is not a subset`);

  const ranked = [...indexed].sort(
    (a, b) => b.entry[2] - a.entry[2] || a.sourceIndex - b.sourceIndex
  );
  const kept = ranked.slice(0, spec.top);
  const cutoff = kept[kept.length - 1].entry[2];
  const tiedInPool = indexed.filter(({ entry }) => entry[2] === cutoff).length;
  const tiedKept = kept.filter(({ entry }) => entry[2] === cutoff).map(({ entry }) => entry[0]);
  let ties = "No rating tie crosses the cutoff.";
  if (tiedKept.length < tiedInPool) {
    ties =
      tiedKept.length === 1
        ? `${tiedInPool} entries are rated ${cutoff}; only the first in source order ` +
          `(${tiedKept[0]}) is kept.`
        : `${tiedInPool} entries are rated ${cutoff}; the first ${tiedKept.length} in source ` +
          `order (${tiedKept.join(", ")}) are kept.`;
  }
  const keptIndexes = new Set(kept.map(({ sourceIndex }) => sourceIndex));
  return {
    selected: indexed.filter(({ sourceIndex }) => keptIndexes.has(sourceIndex)),
    selection:
      `Curated subset: the ${spec.top} highest published ratings in the pool ` +
      `(${cutoff} and up). ${ties}`,
  };
};

const toCard = (spec, entry, sourceIndex) => {
  const where = `${spec.poolPath}[${sourceIndex}]`;
  if (!Array.isArray(entry) || (entry.length !== 7 && entry.length !== 9)) {
    fail(`${where} has an unexpected shape`);
  }
  const [name, subtitle, rating, note, basis, imageUrl, colour, group, side] = entry;
  for (const [field, value] of Object.entries({ name, subtitle, note, basis, imageUrl, colour })) {
    if (typeof value !== "string") fail(`${where} ${field} is not text`);
  }
  if (!name.trim() || !note.trim() || !basis.trim()) fail(`${where} is missing name/note/basis`);
  if (!Number.isInteger(rating) || rating < 40 || rating > 99) fail(`${where} rating ${rating}`);
  if (entry.length === 9 && (typeof group !== "string" || !Object.hasOwn(SIDES, side))) {
    fail(`${where} has an unknown group/side ${group}/${side}`);
  }
  const slug = slugify(name);
  if (!slug) fail(`${where} name "${name}" has no usable id`);
  const source = isEditorialBasis(basis) ? "Editorial" : "PublishedMetric";

  return {
    id: `${spec.id}--${slug}`,
    name,
    subtitle,
    note,
    position: spec.position,
    rating,
    ratingBasis: basis,
    ratingSource: `${ENUM_MARKER}RatingSource.${source}`,
    accentColor: HEX_COLOUR.test(colour) ? colour.toUpperCase() : null,
    image: imageUrl
      ? { uri: imageUrl, host: new URL(imageUrl).hostname, credit: imageCredit(imageUrl) }
      : null,
    side: entry.length === 9 ? SIDES[side] : null,
    sourceIndex,
  };
};

const buildPack = (spec, pool, snapshotDate) => {
  const { selected, selection } = selectEntries(spec, pool);
  const cards = selected.map(({ entry, sourceIndex }) => toCard(spec, entry, sourceIndex));
  const byId = new Map();
  for (const card of cards) {
    const clash = byId.get(card.id);
    if (clash) {
      fail(`${spec.id}: entries ${clash.sourceIndex} and ${card.sourceIndex} share id ${card.id}`);
    }
    byId.set(card.id, card);
  }
  if (cards.length < 20) fail(`${spec.id} has only ${cards.length} cards for four seats`);

  return {
    id: spec.id,
    version: `${snapshotDate}.${spec.revision ?? 1}`,
    topic: `${ENUM_MARKER}TopicId.${spec.topic}`,
    title: spec.title,
    subtitle: spec.subtitle,
    noun: spec.noun,
    ratingLabel: spec.ratingLabel,
    budget: 20,
    slots: [{ id: spec.position, count: 5, accepts: [spec.position] }],
    cards,
    provenance: {
      publisher: PUBLISHER,
      siteUrl: "",
      dataUrl: "",
      poolPath: spec.poolPath,
      siteMode: spec.siteMode,
      snapshotDate,
      selection: `${selection} ${cards.length} of ${pool.length} entries.`,
      sourceEntryCount: pool.length,
      ratingMethod: spec.ratingMethod,
      permission: PERMISSION,
    },
  };
};

const renderModule = (spec, pack, snapshotDate) => {
  const body = JSON.stringify(pack, null, 2).replace(
    new RegExp(`"${ENUM_MARKER}((?:RatingSource|TopicId)\\.[A-Za-z]+)"`, "g"),
    "$1"
  );
  if (body.includes(ENUM_MARKER)) fail(`${spec.id}: unexpected enum marker left in output`);
  return [
    "// Generated by scripts/extract-expanded-packs.mjs from a saved copy of the public data file",
    `// (snapshot ${snapshotDate}, pool ${spec.poolPath}). Do not edit by hand; re-run the script.`,
    `import { RatingSource, TopicId, type ContentPack } from "../types";`,
    "",
    `export const ${spec.exportName}: ContentPack = ${body};`,
    "",
  ].join("\n");
};

const checkSpecs = () => {
  const seen = new Set(EXISTING_PACK_IDS);
  for (const spec of PACKS) {
    if (!PACK_ID.test(spec.id)) fail(`pack id ${spec.id} must be lowercase words joined by "-"`);
    if (seen.has(spec.id)) fail(`pack id ${spec.id} is already used`);
    if (spec.revision !== undefined && !(Number.isInteger(spec.revision) && spec.revision > 0)) {
      fail(`pack ${spec.id} revision must be a positive integer`);
    }
    seen.add(spec.id);
  }
};

/** Generated content must never name or link the source (see AGENTS.md). */
const assertNeutral = (id, code) => {
  if (mentionsSource(code)) throw new Error(`${id}: generated code mentions the source`);
};

const main = async () => {
  const [, , sourcePath, snapshotDate] = process.argv;
  if (!sourcePath || !/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate ?? "")) {
    console.error(
      "Usage: node scripts/extract-expanded-packs.mjs <players.js> <snapshot-date YYYY-MM-DD>"
    );
    process.exit(1);
  }
  checkSpecs();
  const outputDir = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "src",
    "data",
    "expandedPacks"
  );
  const pools = readPools(sourcePath);
  // Build everything before writing anything, so a bad entry leaves the old modules intact.
  const modules = PACKS.map((spec) => {
    const pool = getPool(pools, spec.poolPath);
    const pack = buildPack(spec, pool, snapshotDate);
    const code = renderModule(spec, pack, snapshotDate);
    assertNeutral(spec.id, code);
    return { spec, pack, code };
  });

  mkdirSync(outputDir, { recursive: true });
  for (const { spec, pack, code } of modules) {
    const outputPath = join(outputDir, spec.fileName);
    const options = (await resolveConfig(outputPath)) ?? {};
    writeFileSync(outputPath, await format(code, { ...options, parser: "typescript" }));
    console.log(
      `${spec.id}: ${pack.cards.length} of ${pack.provenance.sourceEntryCount} from ` +
        `${spec.poolPath} -> ${outputPath}`
    );
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

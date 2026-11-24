// Builds the local content packs in src/data/packs from a saved copy of the source site's public
// data file, players.js (reuse of its data was authorised by the user).
//
// The public repository never names the source; exact provenance is in the git-ignored
// .work/SOURCE-PROVENANCE.md. Generated packs name a neutral publisher and carry empty site/data
// URLs.
//
// The file is parsed as JSON text and never executed. Each pack records exactly which pool it came
// from, how cards were selected and the snapshot date, so the extract can be audited or rebuilt.
//
// Usage: node scripts/extract-source-packs.mjs <path/to/players.js> [snapshot-date]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

import { mentionsSource } from "./sourcePatterns.mjs";

/** What generated packs say about their origin (the same wording as the sports packs). */
const PUBLISHER = "Licensed game catalog";
const PERMISSION =
  "Data reuse authorised by the user on behalf of the project. Images are linked as published " +
  "by the site and are hosted by third parties; their rights are not covered by this snapshot.";

const PACKS = [
  {
    id: "nfl-quarterbacks",
    exportName: "NFL_QUARTERBACKS",
    fileName: "nflQuarterbacks.ts",
    topic: "Sports",
    poolPath: "nfl.qb.current",
    position: "qb",
    title: "Quarterbacks",
    subtitle: "NFL · Current players",
    noun: "quarterbacks",
    siteMode: "NFL › Quarterbacks › Current players ($20, five picks)",
    minRating: 74,
    selection: "Every current quarterback rated 74 or higher in the snapshot.",
    ratingLabel: "Madden NFL 27 overall ratings",
    ratingMethod:
      "Current NFL players carry their Madden NFL 27 overall rating; players Madden does not " +
      "list are editorial and say so (source how-to).",
  },
  {
    id: "scifi-80s",
    exportName: "SCIFI_80S",
    fileName: "scifi80s.ts",
    topic: "Movies",
    poolPath: "scifi.80s.all",
    position: "film",
    title: "Sci-fi: the 80s",
    subtitle: "Movies · 1980–1989",
    noun: "films",
    siteMode: "Movies › Sci-fi › The 80s ($20, five picks)",
    selection: "The complete pool for this mode.",
    ratingLabel: "Letterboxd and Metacritic, blended",
    ratingMethod:
      "Blend of the Letterboxd average and the Metacritic score, ranked within the genre; " +
      "audience only when there is no critic score (source how-to).",
  },
  {
    id: "pop-80s",
    exportName: "POP_80S",
    fileName: "pop80s.ts",
    topic: "Songs",
    poolPath: "pop.80s.all",
    position: "song",
    title: "Pop: the 80s",
    subtitle: "Songs · 1980–1989",
    noun: "songs",
    siteMode: "Songs › Pop › The 80s ($20, five picks)",
    selection: "The complete pool for this mode.",
    ratingLabel: "Lifetime Spotify plays, ranked in the decade",
    ratingMethod:
      "Lifetime Spotify play count as published by the source, ranked within genre and decade " +
      "(source how-to).",
  },
  {
    id: "supercars-80s",
    exportName: "SUPERCARS_80S",
    fileName: "supercars80s.ts",
    topic: "Cars",
    poolPath: "super.80s.all",
    position: "car",
    title: "Supercars: the 80s",
    subtitle: "Cars · 1980–1989",
    noun: "cars",
    siteMode: "Cars › Supercars › The 80s ($20, five picks)",
    selection: "The complete pool for this mode.",
    ratingLabel: "Power, 0–60 and top speed",
    ratingMethod:
      "Power, 0–60 time and top speed blended and ranked within the class and decade " +
      "(source how-to).",
  },
  {
    id: "looney-tunes",
    exportName: "LOONEY_TUNES",
    fileName: "looneyTunes.ts",
    topic: "Characters",
    poolPath: "cartoons.looney.all",
    position: "character",
    title: "Looney Tunes",
    subtitle: "Characters · Cartoons",
    noun: "characters",
    siteMode: "Characters › Cartoons › Looney Tunes ($20, five picks)",
    selection: "The complete pool for this mode.",
    ratingLabel: "Editorial: how loved they are",
    ratingMethod: "Editorial: how loved the character is and how good the show is (source how-to).",
  },
];

const slugify = (text) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const imageCredit = (url) => {
  const { hostname, pathname } = new URL(url);
  if (hostname === "a.espncdn.com") return "ESPN headshot";
  if (hostname === "m.media-amazon.com") return "IMDb poster (Amazon CDN)";
  if (hostname === "upload.wikimedia.org") {
    return pathname.startsWith("/wikipedia/commons/")
      ? "Wikimedia Commons; licence per file page"
      : "English Wikipedia upload; licence per file page";
  }
  return hostname;
};

const readPools = (path) => {
  const raw = readFileSync(path, "utf8");
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(json);
};

const getPool = (pools, poolPath) => {
  const pool = poolPath.split(".").reduce((node, key) => node?.[key], pools);
  if (!Array.isArray(pool)) throw new Error(`pool ${poolPath} not found`);
  return pool;
};

const toCard = (spec, entry, sourceIndex, usedIds) => {
  const [name, subtitle, rating, note, basis, imageUrl, color, , side] = entry;
  if (typeof name !== "string" || typeof rating !== "number") {
    throw new Error(`${spec.poolPath}[${sourceIndex}] is malformed`);
  }
  let id = `${spec.id}--${slugify(name)}`;
  for (let suffix = 2; usedIds.has(id); suffix += 1) id = `${spec.id}--${slugify(name)}-${suffix}`;
  usedIds.add(id);
  const isEditorial = String(basis).trim().toLowerCase().startsWith("editorial");
  return {
    id,
    name,
    subtitle: String(subtitle ?? ""),
    note: String(note ?? ""),
    position: spec.position,
    rating,
    ratingBasis: String(basis ?? ""),
    ratingSource: isEditorial ? "RatingSource.Editorial" : "RatingSource.PublishedMetric",
    accentColor: /^#[0-9a-f]{6}$/i.test(String(color)) ? String(color).toUpperCase() : null,
    image: imageUrl
      ? { uri: imageUrl, host: new URL(imageUrl).hostname, credit: imageCredit(imageUrl) }
      : null,
    side: side === "HERO" ? "hero" : side === "VILLAIN" ? "villain" : null,
    sourceIndex,
  };
};

const renderPack = (spec, pool, snapshotDate) => {
  const usedIds = new Set();
  const selected = pool
    .map((entry, sourceIndex) => ({ entry, sourceIndex }))
    .filter(({ entry }) => spec.minRating === undefined || entry[2] >= spec.minRating);
  const cards = selected.map(({ entry, sourceIndex }) => toCard(spec, entry, sourceIndex, usedIds));
  if (cards.length < 20) throw new Error(`${spec.id} has only ${cards.length} cards`);

  const pack = {
    id: spec.id,
    version: `${snapshotDate}.1`,
    topic: `TopicId.${spec.topic}`,
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
      selection: `${spec.selection} ${cards.length} of ${pool.length} entries.`,
      sourceEntryCount: pool.length,
      ratingMethod: spec.ratingMethod,
      permission: PERMISSION,
    },
  };
  // Enum members are emitted as code, everything else as JSON literals.
  const body = JSON.stringify(pack, null, 2).replace(
    /"((?:RatingSource|TopicId)\.[A-Za-z]+)"/g,
    "$1"
  );
  return [
    "// Generated by scripts/extract-source-packs.mjs from a saved copy of the public data file",
    `// (snapshot ${snapshotDate}, pool ${spec.poolPath}). Do not edit by hand; re-run the script.`,
    `import { RatingSource, TopicId, type ContentPack } from "../types";`,
    "",
    `export const ${spec.exportName}: ContentPack = ${body};`,
    "",
  ].join("\n");
};

/** Generated content must never name or link the source (see AGENTS.md). */
const assertNeutral = (id, code) => {
  if (mentionsSource(code)) throw new Error(`${id}: generated code mentions the source`);
};

const main = async () => {
  const [, , sourcePath, snapshotDate = "2026-11-24"] = process.argv;
  if (!sourcePath) {
    console.error("Usage: node scripts/extract-source-packs.mjs <players.js> [snapshot-date]");
    process.exit(1);
  }
  const outputDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "packs");
  const pools = readPools(sourcePath);
  for (const spec of PACKS) {
    const pool = getPool(pools, spec.poolPath);
    const outputPath = join(outputDir, spec.fileName);
    const options = (await resolveConfig(outputPath)) ?? {};
    const source = renderPack(spec, pool, snapshotDate);
    assertNeutral(spec.id, source);
    const code = await format(source, {
      ...options,
      parser: "typescript",
    });
    writeFileSync(outputPath, code);
    console.log(`${spec.id}: wrote ${outputPath}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

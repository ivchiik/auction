// Neutrality guard, run by `npm run check`:
// - no file in the repository names the source of the card data or links to it. The repository is
//   public, so docs and scripts say "the source site"; exact provenance stays in git-ignored
//   `.work/` notes (AGENTS.md);
// - no visible copy or app metadata shows the retired working brand;
// - app.json carries the approved name and slug.
//
// Kept on purpose, so installed saves stay continuous: the `com.paddle.pitch` application ids and
// the `paddle.*.v1` storage keys. They are identifiers that players never see.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { mentionsSource } from "./sourcePatterns.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Local or generated folders that never reach the repository (see .gitignore). */
const SKIPPED_DIRS = new Set([
  ".git",
  ".work",
  ".expo",
  ".brilliant",
  "node_modules",
  "android",
  "ios",
  "dist",
  "web-build",
  "coverage",
  "builds",
]);
const TEXT_FILE = /\.(ts|tsx|js|mjs|cjs|json|md|bl|ds|ya?ml|txt|html|css)$|^\.[a-z]+(rc|ignore)?$/i;

/** The retired working brand, wherever players could read it. */
const BRAND_PATTERN = /\bpaddle\b/i;
const LEGACY_IDENTIFIERS = [/com\.paddle\.pitch/, /paddle\.(game|settings)\.v1/];
/** Visible copy and app metadata: "paddle" as an object (the app icon) is fine elsewhere. */
const VISIBLE_TEXT = /^src\/i18n\/locales\/|^app\.json$/;

const listFiles = (dir) =>
  readdirSync(join(ROOT, dir)).flatMap((entry) => {
    const path = dir ? `${dir}/${entry}` : entry;
    if (statSync(join(ROOT, path)).isDirectory()) {
      return SKIPPED_DIRS.has(entry) ? [] : listFiles(path);
    }
    return TEXT_FILE.test(entry) ? [path] : [];
  });

const problems = [];
for (const file of listFiles("")) {
  const lines = readFileSync(join(ROOT, file), "utf8").split("\n");
  lines.forEach((line, index) => {
    const where = `${relative(ROOT, join(ROOT, file))}:${index + 1}`;
    if (mentionsSource(line)) problems.push(`${where} names the card-data source`);
    const isLegacyId = LEGACY_IDENTIFIERS.some((pattern) => pattern.test(line));
    if (VISIBLE_TEXT.test(file) && !isLegacyId && BRAND_PATTERN.test(line)) {
      problems.push(`${where} shows the retired brand`);
    }
  });
}

const app = JSON.parse(readFileSync(join(ROOT, "app.json"), "utf8")).expo;
if (app.name !== "Auction") problems.push(`app.json name is "${app.name}", expected "Auction"`);
if (app.slug !== "auction") problems.push(`app.json slug is "${app.slug}", expected "auction"`);

if (problems.length > 0) {
  console.error(`Neutrality check failed:\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(
  "Neutrality check passed: no source name or link in the repository, no retired brand in the app."
);

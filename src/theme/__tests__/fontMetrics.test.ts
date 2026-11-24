import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

import {
  clipFreeLineHeight,
  displayType,
  FONT_METRICS,
  lineBoxEm,
  type FontFace,
} from "../fontMetrics";

const require = createRequire(import.meta.url);

/** The TTFs the app bundles (see theme/fonts.ts), by family. */
const BUNDLED: Record<FontFace, readonly string[]> = {
  fraunces: [
    "@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf",
    "@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf",
  ],
  dmSans: [
    "@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf",
    "@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf",
    "@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf",
    "@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf",
  ],
};

/** unitsPerEm (head) and the hhea ascender/descender that Android and iOS size lines from. */
const readVerticalMetrics = (path: string) => {
  const font = readFileSync(require.resolve(path));
  const offsets = new Map<string, number>();
  for (let index = 0; index < font.readUInt16BE(4); index += 1) {
    const record = 12 + index * 16;
    offsets.set(font.toString("latin1", record, record + 4), font.readUInt32BE(record + 8));
  }
  const head = offsets.get("head") as number;
  const hhea = offsets.get("hhea") as number;
  return {
    unitsPerEm: font.readUInt16BE(head + 18),
    ascender: font.readInt16BE(hhea + 4),
    descender: -font.readInt16BE(hhea + 6),
  };
};

describe("font metrics", () => {
  it("match every bundled weight, so line heights are derived from the real files", () => {
    for (const face of Object.keys(BUNDLED) as FontFace[]) {
      for (const path of BUNDLED[face]) {
        assert.deepEqual(readVerticalMetrics(path), { ...FONT_METRICS[face] }, path);
      }
    }
  });

  it("give a line height that holds the whole ascent and descent at every size", () => {
    for (const face of Object.keys(FONT_METRICS) as FontFace[]) {
      for (let fontSize = 10; fontSize <= 140; fontSize += 1) {
        const lineHeight = clipFreeLineHeight(fontSize, face);
        // Android rounds the ascent and the descent up to whole pixels: at density 2 that is
        // at most one point more than the exact box, which the extra point covers.
        assert.ok(lineHeight >= fontSize * lineBoxEm(face) + 1, `${face} ${fontSize}`);
        assert.ok(Number.isInteger(lineHeight));
      }
    }
  });

  it("keep the headlines that clipped on Android inside the Fraunces line box", () => {
    // "Argue now." at 46 pt used a 50 pt line: 6.7 pt short of the 56.7 pt box, so Android
    // trimmed 3.4 pt off the bottom while the "g" reaches 98% of the descent.
    assert.ok(46 * lineBoxEm("fraunces") > 50);
    assert.equal(displayType(46).lineHeight, 58);
    assert.equal(displayType(38).lineHeight, 48);
    assert.equal(displayType(44).fontSize, 44);
  });
});

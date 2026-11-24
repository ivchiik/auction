// Detects the card-data source's name and address in every spelling seen in the snapshot and the
// early docs. The patterns are stored base64-encoded on purpose: this repository is public and
// never spells the source's name, yet the neutrality guard and the pack generators can still
// refuse it. Decoded, each one is a case-insensitive regular expression.
const ENCODED = [
  "MjBccypkb2xsYXJccypkcmFmdA==",
  "XCRccyoyMFxzK2RyYWZ0XGI=",
  "dHdlbnR5W1xzLV0rZG9sbGFyW1xzLV0rZHJhZnQ=",
];

export const SOURCE_PATTERNS = ENCODED.map(
  (encoded) => new RegExp(Buffer.from(encoded, "base64").toString("utf8"), "i")
);

/** True when the text names the source in any known spelling. */
export const mentionsSource = (text) => SOURCE_PATTERNS.some((pattern) => pattern.test(text));

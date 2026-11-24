import type { Rng } from "./types";

const UINT32_RANGE = 4_294_967_296;

/**
 * Mulberry32: a tiny, fast, well-distributed 32-bit PRNG. Same seed, same sequence, on every
 * platform, which is what deterministic decks and daily drafts need. Not for cryptography.
 */
export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return { next, int };
};

/** FNV-1a over UTF-16 code units, returning an unsigned 32-bit hash. */
export const hashString = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** Stable seed derived from labelled parts, e.g. deriveSeed(seed, "bot", lot, seat). */
export const deriveSeed = (...parts: readonly (string | number)[]): number =>
  hashString(parts.map((part) => String(part)).join("|"));

/** Fisher–Yates shuffle that returns a new array and never touches the input. */
export const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapWith = rng.int(0, index);
    const held = result[index];
    result[index] = result[swapWith];
    result[swapWith] = held;
  }
  return result;
};

export const isValidSeed = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value < UINT32_RANGE;

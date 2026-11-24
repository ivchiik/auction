/**
 * A fresh 32-bit seed for a quick draft. This is the app layer's single source of
 * non-determinism; the engine only ever sees the resulting number.
 */
export const createSeed = (): number => Math.floor(Math.random() * 4_294_967_296) >>> 0;

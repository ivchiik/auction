import { TopicId, type SportId } from "data";
import { BotPersonality, Grade, type SlotRule } from "engine";

import type { TranslationResources } from "./locales/en";
import type { TranslationKey, TranslationValues } from "./types";

/** `t` from react-i18next, or any function with its shape (tests pass a stub). */
export type TranslateFn = (key: TranslationKey, values?: TranslationValues) => string;

export const topicNameKey = (topic: TopicId): TranslationKey => `topics.${topic}.name`;
export const topicBlurbKey = (topic: TopicId): TranslationKey => `topics.${topic}.blurb`;
export const topicDailyKey = (topic: TopicId): TranslationKey => `topics.${topic}.daily`;

export const sportNameKey = (sport: SportId): TranslationKey => `sports.${sport}.name`;
export const sportBlurbKey = (sport: SportId): TranslationKey => `sports.${sport}.blurb`;
export const sportHeadlineKey = (sport: SportId): TranslationKey => `sports.${sport}.headline`;

type PositionEntry = Exclude<
  keyof TranslationResources["positions"],
  "slot" | "slotLabel_one" | "slotLabel_other" | "or"
>;

/**
 * Card position codes used by the content packs, mapped to their i18n entries. A Map, because a
 * plain object would also "contain" codes such as "constructor" through Object.prototype.
 */
const POSITION_ENTRIES = new Map<string, PositionEntry>([
  ["gk", "gk"],
  ["cb", "cb"],
  ["fb", "fb"],
  ["mid", "mid"],
  ["w", "w"],
  ["st", "st"],
  ["qb", "qb"],
  ["rb", "rb"],
  ["wr", "wr"],
  ["te", "te"],
  ["def", "def"],
  ["pg", "pg"],
  ["sg", "sg"],
  ["sf", "sf"],
  ["pf", "pf"],
  ["c", "c"],
  ["driver", "driver"],
  ["constructor", "constructors"],
]);

export interface PositionLabels {
  /** "GK", shown on tags and allocation chips. */
  short: string;
  /** "goalkeeper", for sentences and accessibility labels. */
  name: string;
  plural: string;
}

/** Words for a card position code; a code the app has no words for is shown as itself. */
export const positionLabels = (code: string, translate: TranslateFn): PositionLabels => {
  const entry = POSITION_ENTRIES.get(code);
  if (!entry) return { short: code.toUpperCase(), name: code, plural: code };
  return {
    short: translate(`positions.${entry}.short`),
    name: translate(`positions.${entry}.name`),
    plural: translate(`positions.${entry}.plural`),
  };
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Strikers or wingers" for the positions one slot accepts. */
export const describeAccepted = (accepts: readonly string[], translate: TranslateFn): string => {
  const plurals = accepts.map((code) => positionLabels(code, translate).plural);
  if (plurals.length <= 1) return capitalize(plurals[0] ?? "");
  return capitalize(
    translate("positions.or", {
      list: plurals.slice(0, -1).join(", "),
      last: plurals[plurals.length - 1],
    })
  );
};

/** Labels for a slot: its single position's words, or the accepted positions joined. */
export const slotLabels = (slot: SlotRule, translate: TranslateFn): PositionLabels => {
  if (slot.accepts.length === 1) return positionLabels(slot.accepts[0], translate);
  const labels = slot.accepts.map((code) => positionLabels(code, translate));
  return {
    short: labels.map((label) => label.short).join("/"),
    name: describeAccepted(slot.accepts, translate).toLowerCase(),
    plural: describeAccepted(slot.accepts, translate).toLowerCase(),
  };
};

/**
 * A lineup's allocation: "GK ×1 · CB ×2 · …" to read, and "1 goalkeeper, 2 centre-backs, …" to
 * hear. Single-slot packs have nothing to allocate and return null.
 */
export const describeLineup = (
  slots: readonly SlotRule[],
  translate: TranslateFn
): { text: string; label: string } | null => {
  if (slots.length < 2) return null;
  const parts = slots.map((slot) => {
    const labels = slotLabels(slot, translate);
    return {
      text: translate("positions.slot", { short: labels.short, count: slot.count }),
      label: translate("positions.slotLabel", {
        count: slot.count,
        name: labels.name,
        plural: labels.plural,
      }),
    };
  });
  return {
    // The no-break space keeps each "·" at the end of a line instead of starting the next one.
    text: parts.map((part) => part.text).join(" · "),
    label: parts.map((part) => part.label).join(", "),
  };
};

/**
 * What a pack's roster is made of, for choosers and setup: "Lineup: GK ×1 · CB ×2 · …" for
 * lineups, "Strikers or wingers" when one slot takes several positions, null for one position.
 */
export const describePackPositions = (
  slots: readonly SlotRule[],
  translate: TranslateFn
): { text: string; label: string } | null => {
  const lineup = describeLineup(slots, translate);
  if (lineup) {
    return {
      text: translate("sport.lineup", { slots: lineup.text }),
      label: translate("sport.lineup", { slots: lineup.label }),
    };
  }
  const [slot] = slots;
  if (!slot || slot.accepts.length < 2) return null;
  const text = describeAccepted(slot.accepts, translate);
  return { text, label: text };
};

export const personalityNameKey = (personality: BotPersonality): TranslationKey =>
  `personalities.${personality}.name`;
export const personalityBlurbKey = (personality: BotPersonality): TranslationKey =>
  `personalities.${personality}.blurb`;

const GRADE_LINES: Record<Grade, TranslationKey> = {
  [Grade.APlus]: "verdict.gradeLine.aPlus",
  [Grade.A]: "verdict.gradeLine.a",
  [Grade.B]: "verdict.gradeLine.b",
  [Grade.C]: "verdict.gradeLine.c",
  [Grade.D]: "verdict.gradeLine.d",
  [Grade.F]: "verdict.gradeLine.f",
};

export const gradeLineKey = (grade: string): TranslationKey =>
  GRADE_LINES[grade as Grade] ?? GRADE_LINES[Grade.C];

export const isTopicId = (value: string): value is TopicId =>
  (Object.values(TopicId) as string[]).includes(value);

const parseDateKey = (dateKey: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};

const format = (date: Date, options: Intl.DateTimeFormatOptions, fallback: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch {
    return fallback;
  }
};

/** "Tuesday, November 24" for a local date key. */
export const formatLongDate = (dateKey: string): string => {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return format(date, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }, dateKey);
};

/** "Nov 24" for a local date key. */
export const formatShortDateKey = (dateKey: string): string => {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return format(date, { month: "short", day: "numeric", timeZone: "UTC" }, dateKey);
};

/** "Nov 24" for a timestamp, in the device's zone. */
export const formatShortDate = (timestampMs: number): string =>
  format(
    new Date(timestampMs),
    { month: "short", day: "numeric" },
    new Date(timestampMs).toISOString().slice(0, 10)
  );

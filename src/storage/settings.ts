export interface AppSettings {
  hapticsEnabled: boolean;
  /** Default for the optional ten-second shot clock in table setup. */
  shotClockEnabled: boolean;
  /** Forces reduced motion even when the system setting allows animation. */
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  hapticsEnabled: true,
  shotClockEnabled: false,
  reduceMotion: false,
};

/** Field-by-field: a bad value falls back to its default without losing the others. */
export const parseSettings = (raw: unknown): AppSettings => {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const pick = (key: keyof AppSettings) =>
    typeof source[key] === "boolean" ? (source[key] as boolean) : DEFAULT_SETTINGS[key];
  return {
    hapticsEnabled: pick("hapticsEnabled"),
    shotClockEnabled: pick("shotClockEnabled"),
    reduceMotion: pick("reduceMotion"),
  };
};

import * as Haptics from "expo-haptics";

export enum HapticKind {
  Tap = "tap",
  Bid = "bid",
  Win = "win",
  Warning = "warning",
}

const HAPTICS: Record<HapticKind, () => Promise<void>> = {
  [HapticKind.Tap]: () => Haptics.selectionAsync(),
  [HapticKind.Bid]: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  [HapticKind.Win]: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  [HapticKind.Warning]: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

/** Fire-and-forget feedback. Does nothing when switched off; never throws. */
export const playHaptic = (kind: HapticKind, enabled: boolean): void => {
  if (!enabled) return;
  HAPTICS[kind]().catch((error: unknown) => console.warn("[haptics] unavailable", error));
};

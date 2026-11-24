import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { AppText } from "components";
import { TextVariant } from "theme";

export interface ShotClockBadgeProps {
  /** Reads the scheduler's monotonic countdown; null when no clock is running. */
  getRemainingMs: () => number | null;
}

const POLL_MS = 250;

/** "08s" — polls the scheduler itself so the rest of the screen does not re-render. */
export const ShotClockBadge = ({ getRemainingMs }: ShotClockBadgeProps) => {
  const { t } = useTranslation();
  const [remainingMs, setRemainingMs] = useState(getRemainingMs);

  useEffect(() => {
    const timer = setInterval(() => setRemainingMs(getRemainingMs()), POLL_MS);
    return () => clearInterval(timer);
  }, [getRemainingMs]);

  if (remainingMs === null) return null;
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return (
    <AppText
      variant={TextVariant.Stat}
      color="onHighlight"
      accessibilityLabel={t("auction.timerLabel", { seconds })}
      testID="auction-shot-clock"
    >
      {t("auction.timer", { seconds: String(seconds).padStart(2, "0") })}
    </AppText>
  );
};

import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AppText, SeatAvatar } from "components";
import type { SeatView } from "game";
import type { TranslationKey } from "i18n";
import { TextVariant, useTheme } from "theme";

import { _styles } from "./SeatStrip.styles";

export interface SeatStripProps {
  seats: SeatView[];
  /** Lineups: the card's position tag, for seats with no open spot for it ("No GK spot"). */
  lotTag?: string | null;
}

const statusKey = (seat: SeatView): TranslationKey | null => {
  if (seat.isDone) return "auction.statusDone";
  if (seat.isTurn) return "auction.statusTurn";
  if (seat.isHighBidder) return "auction.statusLeads";
  if (seat.hasPassed) return "auction.statusPassed";
  if (!seat.hasRoomForLot) return "auction.statusNoRoom";
  return null;
};

/** Every seat's bankroll, open spots and skips, with a word for its state on this card. */
export const SeatStrip = ({ seats, lotTag = null }: SeatStripProps) => {
  const { styles } = useTheme(_styles);
  const { t } = useTranslation();
  return (
    <View style={styles.grid} testID="auction-seats">
      {seats.map((seat) => {
        const key = statusKey(seat);
        const status = key ? t(key, { short: lotTag ?? "" }) : null;
        const money = t("auction.moneyLine", { money: seat.money, count: seat.openSpots });
        const skips = t("auction.skips", { count: seat.skipsLeft });
        const isSittingOut = seat.hasPassed || seat.isDone || !seat.hasRoomForLot;
        return (
          <View
            key={seat.id}
            style={[styles.chip, seat.isTurn && styles.chipActive, isSittingOut && styles.chipOut]}
            accessible
            accessibilityLabel={[seat.name, money, skips, status].filter(Boolean).join(". ")}
            testID={`auction-seat-${seat.index}`}
          >
            <SeatAvatar seat={seat.index} size={30} />
            <View style={styles.text}>
              <AppText variant={TextVariant.BodyStrong} numberOfLines={1}>
                {seat.name}
              </AppText>
              <AppText variant={TextVariant.Caption} color="textMuted" numberOfLines={2}>
                {status ? `${money} · ${status}` : `${money} · ${skips}`}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

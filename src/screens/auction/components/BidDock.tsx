import { Pressable, Text, View } from "react-native";

import {
  AppButton,
  AppText,
  ArrowRightIcon,
  ButtonVariant,
  SeatAvatar,
  usePressGuard,
} from "components";
import { TextVariant, useTheme } from "theme";

import type { BannerModel, BidButtonModel } from "../container/useAuction";
import { _styles } from "./BidDock.styles";
import { ShotClockBadge } from "./ShotClockBadge";
import { StatusRow } from "./StatusRow";

interface BidButtonProps {
  model: BidButtonModel;
  onBid: (amount: number) => void;
}

const BidButton = ({ model, onBid }: BidButtonProps) => {
  const { styles } = useTheme(_styles);
  const handlePress = usePressGuard(() => onBid(model.amount), !model.isEnabled);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={model.accessibilityLabel}
      accessibilityHint={model.accessibilityHint || undefined}
      accessibilityState={{ disabled: !model.isEnabled }}
      disabled={!model.isEnabled}
      onPress={handlePress}
      testID={`auction-bid-${model.step}`}
      style={({ pressed }) => [
        styles.bidButton,
        !model.isEnabled && styles.bidDisabled,
        pressed && model.isEnabled && styles.bidPressed,
      ]}
    >
      <Text style={styles.bidLabel} maxFontSizeMultiplier={1.3}>
        {model.label}
      </Text>
    </Pressable>
  );
};

export interface BidDockProps {
  banner: BannerModel | null;
  isResolved: boolean;
  bidButtons: BidButtonModel[];
  bidHint: string | null;
  pass: { label: string; isEnabled: boolean; hint: string | null };
  hasShotClock: boolean;
  getShotClockMs: () => number | null;
  amountLabel: string;
  leaderLine: string;
  nudge: string | null;
  onBid: (amount: number) => void;
  onPass: () => void;
  onNext: () => void;
}

/**
 * Thumb-reach controls pinned above the home indicator, with the current bid and leader always
 * visible above them. The card and table context scroll separately above the dock.
 */
export const BidDock = ({
  banner,
  isResolved,
  bidButtons,
  bidHint,
  pass,
  hasShotClock,
  getShotClockMs,
  amountLabel,
  leaderLine,
  nudge,
  onBid,
  onPass,
  onNext,
}: BidDockProps) => {
  const { styles, theme } = useTheme(_styles);
  const isHumanTurn = !!banner?.isHumanTurn;

  return (
    <View style={styles.dock} testID="auction-dock">
      {!isResolved ? (
        <StatusRow amountLabel={amountLabel} leaderLine={leaderLine} nudge={nudge} />
      ) : null}
      {banner ? (
        <View
          style={[styles.banner, isHumanTurn && styles.bannerHuman]}
          accessible
          accessibilityLabel={banner.accessibilityLabel}
          testID="auction-banner"
        >
          {banner.seat !== null ? <SeatAvatar seat={banner.seat} size={40} ringed /> : null}
          <View style={styles.bannerText}>
            <AppText variant={TextVariant.Subhead} color={isHumanTurn ? "onHighlight" : "text"}>
              {banner.title}
            </AppText>
            {banner.line ? (
              <AppText
                variant={TextVariant.Caption}
                color={isHumanTurn ? "onHighlight" : "textMuted"}
              >
                {banner.line}
              </AppText>
            ) : null}
          </View>
          {isHumanTurn && hasShotClock ? <ShotClockBadge getRemainingMs={getShotClockMs} /> : null}
        </View>
      ) : null}

      {isResolved ? (
        <AppButton
          i18nKey="auction.next"
          pill
          onPress={onNext}
          trailing={<ArrowRightIcon size={22} color={theme.color.onPrimary} />}
          testID="auction-next"
        />
      ) : (
        <>
          <View style={styles.bidRow}>
            {bidButtons.map((model) => (
              <BidButton key={model.step} model={model} onBid={onBid} />
            ))}
          </View>
          {bidHint ? (
            <AppText variant={TextVariant.Caption} color="textMuted" style={styles.hint}>
              {bidHint}
            </AppText>
          ) : null}
          <AppButton
            label={pass.label}
            variant={ButtonVariant.Secondary}
            pill
            disabled={!pass.isEnabled}
            onPress={onPass}
            accessibilityHint={pass.hint ?? undefined}
            testID="auction-pass"
          />
          {isHumanTurn && !pass.isEnabled && pass.hint ? (
            <AppText variant={TextVariant.Caption} color="textMuted" style={styles.hint}>
              {pass.hint}
            </AppText>
          ) : null}
        </>
      )}
    </View>
  );
};
